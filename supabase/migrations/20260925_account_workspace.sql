-- One private, versioned workspace per authenticated user. No service key required.
create table if not exists public.account_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0,
 entities jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 constraint workspace_size check (octet_length(entities::text) <= 4000000),
 constraint workspace_object check (jsonb_typeof(entities) = 'object')
);
alter table public.account_workspaces enable row level security;
revoke all on public.account_workspaces from anon;
grant select, insert, update on public.account_workspaces to authenticated;
create policy "Own workspace only" on public.account_workspaces for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.save_account_workspace(expected_revision bigint, next_entities jsonb)
returns setof public.account_workspaces
language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.account_workspaces(user_id) values(auth.uid()) on conflict do nothing;
 return query update public.account_workspaces
 set entities = next_entities, revision = revision + 1, updated_at = now()
 where user_id = auth.uid() and revision = expected_revision returning *;
end; $$;
revoke all on function public.save_account_workspace(bigint,jsonb) from public, anon;
grant execute on function public.save_account_workspace(bigint,jsonb) to authenticated;
