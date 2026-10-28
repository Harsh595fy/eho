-- =====================================================================
-- EHO — repair administrator access            (safe to run many times)
-- =====================================================================
-- Run this in Supabase → SQL Editor → New query → Run,
-- in the SAME Supabase project whose URL is in your .env.local file.
--
-- It does NOT give anyone admin rights. It only makes sure the admin table,
-- the is_eho_admin() check and its permissions are correct.
-- To make a user an admin, run grant_admin.sql afterwards.
-- =====================================================================

-- 1) Administrator membership table (private: browsers can never read or write it)
create table if not exists public.eho_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);
alter table public.eho_admins enable row level security;
revoke all on public.eho_admins from anon, authenticated;

-- 2) The check the admin page calls. It looks ONLY at the logged-in user's
--    own verified identity (auth.uid()) — the browser cannot fake it.
create or replace function public.is_eho_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.eho_admins a where a.user_id = (select auth.uid())
  );
$$;

-- 3) Only signed-in users may call it (anonymous visitors cannot).
revoke all on function public.is_eho_admin() from public;
revoke all on function public.is_eho_admin() from anon;
grant execute on function public.is_eho_admin() to authenticated;

-- 4) Tell the Supabase API to reload, so the function is found immediately.
notify pgrst, 'reload schema';

-- 5) Diagnostic: shows every login account and whether it is an EHO admin.
--    (Visible only to you in the SQL Editor.)
select u.email,
       u.id                              as user_id,
       u.email_confirmed_at is not null  as email_confirmed,
       a.user_id is not null             as is_eho_admin
from auth.users u
left join public.eho_admins a on a.user_id = u.id
order by u.created_at;
