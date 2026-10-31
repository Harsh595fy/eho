-- EHO: permanently delete an individual certificate from the admin list.
-- Admin-only RPC. Related audit entries are removed with the certificate so no orphan history remains.
create or replace function public.delete_eho_certificate(p_certificate_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_id text;
begin
  if not public.is_eho_admin() then
    raise exception 'Administrator authorization required';
  end if;

  if p_certificate_id is null or length(trim(p_certificate_id)) = 0 then
    raise exception 'Certificate ID is required';
  end if;

  delete from public.eho_certificate_audit
   where certificate_id = trim(p_certificate_id);

  delete from public.eho_certificates
   where certificate_id = trim(p_certificate_id)
   returning certificate_id into v_deleted_id;

  return v_deleted_id is not null;
end;
$$;

revoke all on function public.delete_eho_certificate(text) from public, anon;
grant execute on function public.delete_eho_certificate(text) to authenticated;
notify pgrst, 'reload schema';
