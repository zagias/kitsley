-- Billing verifies project ownership with the server role.
grant select on public.account_workspaces to service_role;
-- Apply after account workspace migration. Billing tables are server-only.
create table if not exists public.billing_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique
);
create table if not exists public.billing_grants (
 id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 plan text not null check(plan in ('project-pass','plus')), project_id text,
 starts_at timestamptz not null, ends_at timestamptz not null,
 active boolean not null default true, source_id text not null,
 check(ends_at>starts_at), check(plan='plus' or project_id is not null)
);
create index if not exists billing_grants_owner on public.billing_grants(user_id);
create table if not exists public.billing_usage (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 project_id text not null, feature text not null check(feature in ('answer','search')),
 input_tokens integer not null default 0, output_tokens integer not null default 0,
 bucket text not null, created_at timestamptz not null default now()
);
alter table public.billing_usage add column if not exists input_tokens integer not null default 0;
alter table public.billing_usage add column if not exists output_tokens integer not null default 0;
create index if not exists billing_usage_owner on public.billing_usage(user_id,bucket);
create table if not exists public.billing_checkouts (
 user_id uuid not null references auth.users(id) on delete cascade, scope text not null,
 attempt uuid not null default gen_random_uuid(), expires_at timestamptz not null,
 primary key(user_id,scope)
);
alter table public.billing_accounts enable row level security;
alter table public.billing_grants enable row level security;
alter table public.billing_usage enable row level security;
alter table public.billing_checkouts enable row level security;
revoke all on public.billing_accounts,public.billing_grants,public.billing_usage,public.billing_checkouts from anon,authenticated;
grant all on public.billing_accounts,public.billing_grants,public.billing_usage,public.billing_checkouts to service_role;

create or replace function public.reserve_project_usage(owner uuid,project text,feature text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare g billing_grants; b text; tier text; cap integer; maxprojects integer; n integer; usedprojects integer; usageid uuid;
begin
 if feature not in ('answer','search') then raise exception 'Invalid feature'; end if;
 perform pg_advisory_xact_lock(62419029);
 if (select count(*) from billing_usage u where u.created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' and u.feature=reserve_project_usage.feature)>=(case when feature='search' then 200 else 1000 end) then return jsonb_build_object('ok',false,'message','The service has reached today’s capacity. No allowance was used; please try again later.');end if;
 insert into billing_accounts(user_id) values(owner) on conflict do nothing;
 perform 1 from billing_accounts where user_id=owner for update;
 if not exists(select 1 from account_workspaces where user_id=owner and entities->('conversation:'||project) is not null and entities->('conversation:'||project)<>'null'::jsonb) then raise exception 'Project not owned'; end if;
 select bg.* into g from billing_grants bg where bg.user_id=owner and bg.active and bg.starts_at<=now() and bg.ends_at>now()
 and (bg.plan='plus' or bg.project_id=project)
 and (select count(*) from billing_usage u where u.user_id=owner and u.bucket=bg.id and u.feature=reserve_project_usage.feature)<case when feature='answer' then case when bg.plan='plus' then 90 else 30 end else case when bg.plan='plus' then 18 else 6 end end
 and (bg.plan='project-pass' or (select count(distinct u.project_id) from billing_usage u where u.user_id=owner and u.bucket=bg.id)<3 or exists(select 1 from billing_usage u where u.user_id=owner and u.bucket=bg.id and u.project_id=project))
 order by (bg.plan='project-pass') desc,bg.ends_at asc limit 1;
 if g.id is null then
  if exists(select 1 from billing_grants where user_id=owner and active and starts_at<=now() and ends_at>now() and (plan='plus' or project_id=project)) then return jsonb_build_object('ok',false,'message','Your available plan allowance is used. Continue an included project, wait for renewal, or use a Project Pass for a new job.');end if;
  tier:='free'; b:='free:'||to_char(now() at time zone 'UTC','YYYY-MM'); cap:=3; maxprojects:=3;
  if feature='search' then return jsonb_build_object('ok',false,'message','Choose a Project Pass or Plus to compare retailer listings. Your saved results remain available.'); end if;
 else
  tier:=g.plan; b:=g.id; maxprojects:=case when tier='plus' then 3 else 1 end;
  cap:=case when feature='answer' then case when tier='plus' then 90 else 30 end else case when tier='plus' then 18 else 6 end end;
 end if;
 -- Calls count as soon as reserved; explicit failures are refunded by the server.
 select count(*) into n from billing_usage u where u.user_id=owner and u.bucket=b and u.feature=reserve_project_usage.feature and (tier<>'free' or u.project_id=project);
 if n>=cap then return jsonb_build_object('ok',false,'message',case when tier='free' then 'You have your three free replies. Choose a plan for tailored follow-up help.' else 'This plan’s allowance is used. Saved work stays available; Plus renews on your billing date.' end); end if;
 select count(distinct project_id) into usedprojects from billing_usage where user_id=owner and bucket=b;
 if usedprojects>=maxprojects and not exists(select 1 from billing_usage where user_id=owner and bucket=b and project_id=project) then return jsonb_build_object('ok',false,'message','Your project allowance is used. Continue an included project or choose a Project Pass for this job.'); end if;
 insert into billing_usage(user_id,project_id,feature,bucket) values(owner,project,feature,b) returning id into usageid;
 return jsonb_build_object('ok',true,'id',usageid,'plan',tier);
end $$;

create or replace function public.reserve_checkout(owner uuid,checkout_scope text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare c billing_checkouts;
begin
 insert into billing_accounts(user_id) values(owner) on conflict do nothing;
 perform 1 from billing_accounts where user_id=owner for update;
 insert into billing_checkouts(user_id,scope,expires_at) values(owner,checkout_scope,now()+interval '32 minutes')
 on conflict(user_id,scope) do update set attempt=gen_random_uuid(),expires_at=now()+interval '32 minutes' where billing_checkouts.expires_at<=now();
 select * into c from billing_checkouts where user_id=owner and scope=checkout_scope;
 return to_jsonb(c);
end $$;
revoke all on function public.reserve_project_usage(uuid,text,text),public.reserve_checkout(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_project_usage(uuid,text,text),public.reserve_checkout(uuid,text) to service_role;

-- Refund tombstones prevent out-of-order/concurrent fulfillment re-enabling access.
create table if not exists public.billing_revocations(id text primary key,created_at timestamptz not null default now());
alter table public.billing_revocations enable row level security;
revoke all on public.billing_revocations from anon,authenticated;
grant all on public.billing_revocations to service_role;
create or replace function public.apply_billing_grant(payload jsonb)
returns void language plpgsql security invoker set search_path=public as $$
begin
 perform pg_advisory_xact_lock(62419030);
 if exists(select 1 from billing_revocations where id in (payload->>'id',payload->>'source_id')) then return;end if;
 insert into billing_grants(id,user_id,plan,project_id,starts_at,ends_at,active,source_id)
 values(payload->>'id',(payload->>'user_id')::uuid,payload->>'plan',payload->>'project_id',(payload->>'starts_at')::timestamptz,(payload->>'ends_at')::timestamptz,true,payload->>'source_id') on conflict(id) do nothing;
end $$;
create or replace function public.revoke_billing_grant(reference text)
returns void language plpgsql security invoker set search_path=public as $$
begin
 perform pg_advisory_xact_lock(62419030);
 insert into billing_revocations(id) values(reference) on conflict do nothing;
 update billing_grants set active=false where id=reference or source_id=reference;
end $$;
revoke all on function public.apply_billing_grant(jsonb),public.revoke_billing_grant(text) from public,anon,authenticated;
grant execute on function public.apply_billing_grant(jsonb),public.revoke_billing_grant(text) to service_role;
