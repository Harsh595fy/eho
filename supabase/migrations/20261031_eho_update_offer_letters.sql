-- Allow EHO administrators to correct an existing offer letter without changing its reference ID.
create or replace function public.update_eho_offer_letter(
  p_offer_letter_id text,
  p_recipient_name text,
  p_program_name text,
  p_participation text,
  p_duration text,
  p_start_date date,
  p_end_date date,
  p_issue_date date,
  p_issuer_name text,
  p_signatory_name text default null,
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

  if length(trim(coalesce(p_offer_letter_id,''))) not between 1 and 100
     or length(trim(coalesce(p_recipient_name,''))) not between 1 and 160
     or length(trim(coalesce(p_program_name,''))) not between 1 and 180
     or length(trim(coalesce(p_participation,''))) not between 1 and 240
     or length(trim(coalesce(p_duration,''))) not between 1 and 80
     or length(trim(coalesce(p_issuer_name,''))) not between 1 and 180
     or length(coalesce(p_details,'')) > 1200
     or p_start_date is null or p_end_date is null or p_end_date < p_start_date
     or p_issue_date is null then
    raise exception 'Invalid offer letter input';
  end if;

  update public.eho_offer_letters
     set recipient_name = trim(p_recipient_name),
         program_name = trim(p_program_name),
         participation = trim(p_participation),
         duration = trim(p_duration),
         start_date = p_start_date,
         end_date = p_end_date,
         issue_date = p_issue_date,
         issuer_name = trim(p_issuer_name),
         signatory_name = nullif(trim(coalesce(p_signatory_name,'')),''),
         details = nullif(trim(coalesce(p_details,'')),'')
   where offer_letter_id = trim(p_offer_letter_id);

  if not found then
    raise exception 'Offer letter not found';
  end if;
  return true;
end;
$$;

revoke all on function public.update_eho_offer_letter(text,text,text,text,text,date,date,date,text,text,text) from public, anon;
grant execute on function public.update_eho_offer_letter(text,text,text,text,date,date,date,text,text,text) to authenticated;

notify pgrst, 'reload schema';
