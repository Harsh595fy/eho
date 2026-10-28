-- EHO follow-up: robust date-constraint removal and actionable issuance validation errors.
-- Run once in Supabase SQL Editor as project owner. No certificate rows are deleted or rewritten.
begin;

do $migration$
declare
  v_crypto_schema text;
  v_constraint record;
begin
  -- Resolve the actual installed schema instead of assuming public/extensions.
  select n.nspname into v_crypto_schema
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'gen_random_bytes'
    and pg_get_function_identity_arguments(p.oid) = 'integer'
    and has_function_privilege(current_user, p.oid, 'EXECUTE')
  order by (n.nspname = 'extensions') desc, (n.nspname = 'public') desc
  limit 1;

  if v_crypto_schema is null then
    raise exception 'pgcrypto gen_random_bytes(integer) is not installed or not executable. Install/repair pgcrypto as project owner, then rerun this migration.';
  end if;

  -- Drop only the date-order check, retaining all other constraints.
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.eho_certificates'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%completion_date%'
      and pg_get_constraintdef(oid) ilike '%issue_date%'
  loop
    execute format('alter table public.eho_certificates drop constraint %I', v_constraint.conname);
  end loop;

  -- Security-definer RPC retains admin authorization and a locked-down search_path.
  execute format($ddl$
    create or replace function public.issue_eho_certificate(
      p_recipient_name text,
      p_certificate_title text,
      p_program_name text,
      p_issue_date date default current_date,
      p_completion_date date default null,
      p_issuer_name text default 'EHO — Ethical Hacking Organizations',
      p_signatory_name text default null,
      p_grade text default null,
      p_details text default null
    ) returns text
    language plpgsql security definer set search_path = ''
    as $function$
    declare v_id text;
    begin
      if not public.is_eho_admin() then
        raise exception 'Administrator authorization required';
      end if;

      -- Report the specific invalid field so future form/RPC mismatches are diagnosable.
      if length(trim(coalesce(p_recipient_name,''))) not between 1 and 160 then
        raise exception 'Invalid certificate input: Recipient full name is required (1–160 characters).';
      end if;
      if length(trim(coalesce(p_certificate_title,''))) not between 1 and 180 then
        raise exception 'Invalid certificate input: Certificate title is required (1–180 characters).';
      end if;
      if length(trim(coalesce(p_program_name,''))) not between 1 and 180 then
        raise exception 'Invalid certificate input: Course / program name is required (1–180 characters).';
      end if;
      if length(trim(coalesce(p_issuer_name,''))) not between 1 and 180 then
        raise exception 'Invalid certificate input: Issuing organization is required (1–180 characters).';
      end if;
      if length(coalesce(p_details,'')) > 1000 then
        raise exception 'Invalid certificate input: Additional details must be 1000 characters or fewer.';
      end if;

      loop
        v_id := 'EHO-' || to_char(coalesce(p_issue_date,current_date),'YYYY')
                || '-' || upper(encode(%1$I.gen_random_bytes(6),'hex'));
        exit when not exists (
          select 1 from public.eho_certificates c where c.certificate_id = v_id
        );
      end loop;

      insert into public.eho_certificates
        (certificate_id,recipient_name,certificate_title,program_name,issue_date,
         completion_date,issuer_name,signatory_name,grade,details,issued_by)
      values
        (v_id,trim(p_recipient_name),trim(p_certificate_title),trim(p_program_name),
         coalesce(p_issue_date,current_date),p_completion_date,trim(p_issuer_name),
         nullif(trim(coalesce(p_signatory_name,'')),''),
         nullif(trim(coalesce(p_grade,'')),''),
         nullif(trim(coalesce(p_details,'')),''),(select auth.uid()));

      insert into public.eho_certificate_audit(certificate_id,action,actor_id)
      values(v_id,'issued',(select auth.uid()));
      return v_id;
    end
    $function$;
  $ddl$, v_crypto_schema);
end
$migration$;

revoke all on function public.issue_eho_certificate(text,text,text,date,date,text,text,text,text) from public, anon;
grant execute on function public.issue_eho_certificate(text,text,text,date,date,text,text,text,text) to authenticated;
notify pgrst, 'reload schema';

commit;
