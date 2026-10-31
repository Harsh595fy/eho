-- EHO: allow administrators to correct already-issued certificate content.
-- Additive and non-destructive: certificate_id, status, QR verification identity,
-- created_at, revoked_at and revocation_reason are deliberately never modified.

create or replace function public.update_eho_certificate(
  p_certificate_id text,
  p_recipient_name text,
  p_certificate_title text,
  p_program_name text,
  p_issue_date date,
  p_completion_date date default null,
  p_issuer_name text default 'EHO — Ethical Hacking Organizations',
  p_signatory_name text default null,
  p_grade text default null,
  p_details text default null
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_eho_admin() then
    raise exception 'Administrator authorization required';
  end if;

  if length(trim(coalesce(p_certificate_id,''))) not between 1 and 100
     or length(trim(coalesce(p_recipient_name,''))) not between 1 and 160
     or length(trim(coalesce(p_certificate_title,''))) not between 1 and 180
     or length(trim(coalesce(p_program_name,''))) not between 1 and 180
     or p_issue_date is null
     or length(trim(coalesce(p_issuer_name,''))) not between 1 and 180
     or length(coalesce(p_signatory_name,'')) > 160
     or length(coalesce(p_grade,'')) > 80
     or length(coalesce(p_details,'')) > 1000 then
    raise exception 'Invalid certificate update input';
  end if;

  update public.eho_certificates
     set recipient_name = trim(p_recipient_name),
         certificate_title = trim(p_certificate_title),
         program_name = trim(p_program_name),
         issue_date = p_issue_date,
         completion_date = p_completion_date,
         issuer_name = trim(p_issuer_name),
         signatory_name = nullif(trim(coalesce(p_signatory_name,'')),''),
         grade = nullif(trim(coalesce(p_grade,'')),''),
         details = nullif(trim(coalesce(p_details,'')),'')
   where certificate_id = trim(p_certificate_id);

  if not found then
    raise exception 'Certificate not found';
  end if;

  return true;
end;
$$;

revoke all on function public.update_eho_certificate(text,text,text,text,date,date,text,text,text,text) from public, anon;
grant execute on function public.update_eho_certificate(text,text,text,text,date,date,text,text,text,text) to authenticated;

notify pgrst, 'reload schema';
