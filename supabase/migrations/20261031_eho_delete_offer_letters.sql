-- Administrator-only removal of a saved EHO offer letter.
create or replace function public.delete_eho_offer_letter(
  p_offer_letter_id text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_eho_admin() then
    raise exception 'Administrator authorization required';
  end if;
  if length(trim(coalesce(p_offer_letter_id,''))) not between 1 and 100 then
    raise exception 'Invalid offer letter reference';
  end if;
  delete from public.eho_offer_letters
   where offer_letter_id = p_offer_letter_id;
  if not found then
    raise exception 'Offer letter not found';
  end if;
  return true;
end;
$$;

revoke all on function public.delete_eho_offer_letter(text) from public, anon;
grant execute on function public.delete_eho_offer_letter(text) to authenticated;

notify pgrst, 'reload schema';
