do $$ begin if not has_table_privilege('service_role','public.account_workspaces','SELECT') then raise exception 'Billing server cannot verify project ownership'; end if; end $$;
-- Run only against a disposable database after billing migration + auth/workspace fixture.
-- Assertions execute in a rollback transaction; no production accounts are used.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000099');
insert into account_workspaces(user_id,entities) values('00000000-0000-4000-8000-000000000099','{"conversation:p1":{},"conversation:p2":{},"conversation:p3":{},"conversation:p4":{}}');
do $$
declare u uuid:='00000000-0000-4000-8000-000000000099'; r jsonb; i integer;
begin
 for i in 1..3 loop r:=reserve_project_usage(u,'p1','answer');if not (r->>'ok')::boolean then raise exception 'Free reply rejected';end if;end loop;
 r:=reserve_project_usage(u,'p1','answer');if (r->>'ok')::boolean then raise exception 'Free quota bypass';end if;
 perform reserve_project_usage(u,'p2','answer');perform reserve_project_usage(u,'p3','answer');
 r:=reserve_project_usage(u,'p4','answer');if (r->>'ok')::boolean then raise exception 'Free project cap bypass';end if;
 r:=reserve_project_usage(u,'p1','search');if (r->>'ok')::boolean then raise exception 'Free shopping bypass';end if;
 begin perform reserve_project_usage(u,'someone-elses-project','answer');raise exception 'Ownership bypass';exception when raise_exception then if sqlerrm='Ownership bypass' then raise;end if;end;
 insert into billing_grants values('test-pass',u,'project-pass','p1',now(),now()+interval '30 days',true,'pi_test');
 for i in 1..30 loop r:=reserve_project_usage(u,'p1','answer');if r->>'plan'<>'project-pass' then raise exception 'Pass not applied';end if;end loop;
 r:=reserve_project_usage(u,'p1','answer');if (r->>'ok')::boolean then raise exception 'Pass quota bypass';end if;
 r:=reserve_project_usage(u,'p2','search');if (r->>'ok')::boolean then raise exception 'Pass project scope bypass';end if;
 for i in 1..6 loop r:=reserve_project_usage(u,'p1','search');if not (r->>'ok')::boolean then raise exception 'Pass search rejected';end if;end loop;
 r:=reserve_project_usage(u,'p1','search');if (r->>'ok')::boolean then raise exception 'Pass search cap bypass';end if;
 delete from billing_usage where id=(select id from billing_usage where bucket='test-pass' and feature='answer' limit 1);
 r:=reserve_project_usage(u,'p1','answer');if not (r->>'ok')::boolean then raise exception 'Failed-call refund did not restore quota';end if;
 update billing_grants set active=false where id='test-pass';
 r:=reserve_project_usage(u,'p1','search');if (r->>'ok')::boolean then raise exception 'Revoked pass still active';end if;
 insert into billing_grants values('test-plus',u,'plus',null,now(),now()+interval '1 month',true,'sub_test');
 perform reserve_project_usage(u,'p1','answer');perform reserve_project_usage(u,'p2','answer');perform reserve_project_usage(u,'p3','answer');
 r:=reserve_project_usage(u,'p4','answer');if (r->>'ok')::boolean then raise exception 'Plus project cap bypass';end if;
 update billing_grants set starts_at=now()-interval '2 months',ends_at=now()-interval '1 month' where id='test-plus';
 r:=reserve_project_usage(u,'p1','search');if (r->>'ok')::boolean then raise exception 'Expired Plus active';end if;
 if has_table_privilege('authenticated','public.billing_grants','INSERT') or has_function_privilege('authenticated','public.reserve_project_usage(uuid,text,text)','EXECUTE') then raise exception 'Client can grant access';end if;
 raise notice 'Billing database assertions passed';
end $$;
rollback;
