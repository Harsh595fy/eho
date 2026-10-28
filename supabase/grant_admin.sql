-- =====================================================================
-- EHO — make an existing login account an administrator
-- =====================================================================
-- 1. First create the user in Supabase → Authentication → Users → Add user
--    (tick "Auto Confirm User").
-- 2. Replace the email below with that user's email (keep the quotes).
-- 3. Run in Supabase → SQL Editor of the SAME project as your .env.local.
-- =====================================================================
do $$
declare
  v_email text := 'YOUR_ADMIN_EMAIL@example.com';   -- <<< change this
  v_id uuid;
begin
  if v_email ilike 'YOUR_ADMIN_EMAIL%' then
    raise exception 'Please replace YOUR_ADMIN_EMAIL@example.com with the real admin email first.';
  end if;

  select id into v_id from auth.users where lower(email) = lower(trim(v_email));
  if v_id is null then
    raise exception 'No login account with email % exists in THIS Supabase project. Create it in Authentication → Users first (or check that .env.local points to this project).', v_email;
  end if;

  insert into public.eho_admins (user_id, role) values (v_id, 'admin')
  on conflict (user_id) do nothing;

  raise notice 'Done: % (%) is now an EHO administrator.', v_email, v_id;
end $$;

-- To REMOVE an admin later:
-- delete from public.eho_admins where user_id = (select id from auth.users where lower(email) = lower('someone@example.com'));
