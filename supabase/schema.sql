-- EHO certificate management and administrator authorization.
-- Run in Supabase SQL Editor as project owner. Never expose service-role keys in the browser.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.eho_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);
alter table public.eho_admins enable row level security;
revoke all on public.eho_admins from anon, authenticated;

create or replace function public.is_eho_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(select 1 from public.eho_admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_eho_admin() from public;
grant execute on function public.is_eho_admin() to authenticated;

create table if not exists public.eho_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique,
  recipient_name text not null check (length(trim(recipient_name)) between 1 and 160),
  certificate_title text not null default 'Certificate of Achievement' check (length(trim(certificate_title)) between 1 and 180),
  program_name text not null check (length(trim(program_name)) between 1 and 180),
  issue_date date not null default current_date,
  completion_date date,
  issuer_name text not null default 'EHO — Ethical Hacking Organizations',
  signatory_name text,
  grade text,
  details text,
  status text not null default 'issued' check (status in ('issued','revoked')),
  created_at timestamptz not null default now(),
  issued_by uuid references auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  revocation_reason text,
  check ((status = 'issued' and revoked_at is null and revoked_by is null and revocation_reason is null)
      or (status = 'revoked' and revoked_at is not null and revoked_by is not null and length(trim(coalesce(revocation_reason,''))) >= 5))
);
-- Upgrade the earlier minimal EHO certificate table in place.
alter table public.eho_certificates add column if not exists certificate_title text not null default 'Certificate of Achievement';
alter table public.eho_certificates add column if not exists completion_date date;
alter table public.eho_certificates add column if not exists issuer_name text not null default 'EHO — Ethical Hacking Organizations';
alter table public.eho_certificates add column if not exists signatory_name text;
alter table public.eho_certificates add column if not exists grade text;
alter table public.eho_certificates add column if not exists details text;
alter table public.eho_certificates add column if not exists issued_by uuid references auth.users(id);
alter table public.eho_certificates add column if not exists revoked_at timestamptz;
alter table public.eho_certificates add column if not exists revoked_by uuid references auth.users(id);
alter table public.eho_certificates add column if not exists revocation_reason text;
create index if not exists eho_certificates_recipient_idx on public.eho_certificates (lower(recipient_name));
create index if not exists eho_certificates_status_issue_idx on public.eho_certificates (status, issue_date desc);
alter table public.eho_certificates enable row level security;
revoke all on public.eho_certificates from anon, authenticated;

create table if not exists public.eho_certificate_audit (
  id bigint generated always as identity primary key,
  certificate_id text not null,
  action text not null check (action in ('issued','revoked')),
  reason text,
  actor_id uuid references auth.users(id),
  occurred_at timestamptz not null default now()
);
create index if not exists eho_certificate_audit_certificate_idx on public.eho_certificate_audit(certificate_id, occurred_at desc);
alter table public.eho_certificate_audit enable row level security;
revoke all on public.eho_certificate_audit from anon, authenticated;

-- Narrow public projection intentionally excludes internal UUIDs, actor IDs, and private details.
create or replace view public.eho_public_certificates as
select certificate_id, recipient_name, certificate_title, program_name, issue_date,
       completion_date, issuer_name, signatory_name, grade, status, revoked_at
from public.eho_certificates;
grant select on public.eho_public_certificates to anon, authenticated;

create or replace function public.issue_eho_certificate(
 p_recipient_name text, p_certificate_title text, p_program_name text, p_issue_date date default current_date,
 p_completion_date date default null, p_issuer_name text default 'EHO — Ethical Hacking Organizations',
 p_signatory_name text default null, p_grade text default null, p_details text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare v_id text;
begin
 if not public.is_eho_admin() then raise exception 'Administrator authorization required'; end if;
 if length(trim(coalesce(p_recipient_name,''))) not between 1 and 160
    or length(trim(coalesce(p_certificate_title,''))) not between 1 and 180
    or length(trim(coalesce(p_program_name,''))) not between 1 and 180
    or length(trim(coalesce(p_issuer_name,''))) not between 1 and 180
    or length(coalesce(p_details,'')) > 1000 then raise exception 'Invalid certificate input'; end if;
 -- Random, human-readable identifier. Unique constraint is the final concurrency safeguard.
 loop
   v_id := 'EHO-' || to_char(coalesce(p_issue_date,current_date),'YYYY') || '-' || upper(encode(extensions.gen_random_bytes(6),'hex'));
   exit when not exists(select 1 from public.eho_certificates c where c.certificate_id = v_id);
 end loop;
 insert into public.eho_certificates(certificate_id,recipient_name,certificate_title,program_name,issue_date,completion_date,issuer_name,signatory_name,grade,details,issued_by)
 values(v_id,trim(p_recipient_name),trim(p_certificate_title),trim(p_program_name),coalesce(p_issue_date,current_date),p_completion_date,trim(p_issuer_name),nullif(trim(coalesce(p_signatory_name,'')),''),nullif(trim(coalesce(p_grade,'')),''),nullif(trim(coalesce(p_details,'')),''),(select auth.uid()));
 insert into public.eho_certificate_audit(certificate_id,action,actor_id) values(v_id,'issued',(select auth.uid()));
 return v_id;
end $$;
revoke all on function public.issue_eho_certificate(text,text,text,date,date,text,text,text,text) from public, anon;
grant execute on function public.issue_eho_certificate(text,text,text,date,date,text,text,text,text) to authenticated;

create or replace function public.revoke_eho_certificate(p_certificate_id text, p_reason text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_eho_admin() then raise exception 'Administrator authorization required'; end if;
 if length(trim(coalesce(p_reason,''))) not between 5 and 1000 then raise exception 'A revocation reason is required'; end if;
 update public.eho_certificates set status='revoked', revoked_at=now(), revoked_by=(select auth.uid()), revocation_reason=trim(p_reason)
 where certificate_id=p_certificate_id and status='issued';
 if not found then raise exception 'Certificate not found or already revoked'; end if;
 insert into public.eho_certificate_audit(certificate_id,action,reason,actor_id)
 values(p_certificate_id,'revoked',trim(p_reason),(select auth.uid()));
 return true;
end $$;
revoke all on function public.revoke_eho_certificate(text,text) from public, anon;
grant execute on function public.revoke_eho_certificate(text,text) to authenticated;

-- Public can read only the narrow verification projection; no direct base-table reads/writes.
-- Admins use security-definer RPCs and the authenticated management query below.
drop policy if exists "Public can verify issued certificates" on public.eho_certificates;
drop policy if exists "Authenticated admins manage certificates" on public.eho_certificates;
drop policy if exists "admins read certificate records" on public.eho_certificates;
drop policy if exists "admins read certificate audit" on public.eho_certificate_audit;
create policy "admins read certificate records"  on public.eho_certificates for select to authenticated using (public.is_eho_admin());
create policy "admins read certificate audit" on public.eho_certificate_audit for select to authenticated using (public.is_eho_admin());
grant select on public.eho_certificates to authenticated;
grant select on public.eho_certificate_audit to authenticated;

-- Make the API see new/changed functions immediately (prevents "function not found" right after setup).
notify pgrst, 'reload schema';


-- Fresh-install equivalent of migration 20261031_eho_offer_letters_and_certificate_details.sql
-- EHO Admin Studio: persistent offer letters and safe certificate detail corrections.
-- Additive migration: existing certificate rows, IDs, QR verification and statuses are untouched.

create table if not exists public.eho_offer_letters (
  id uuid primary key default gen_random_uuid(),
  offer_letter_id text not null unique,
  recipient_name text not null check (length(trim(recipient_name)) between 1 and 160),
  program_name text not null check (length(trim(program_name)) between 1 and 180),
  participation text not null check (length(trim(participation)) between 1 and 240),
  duration text not null check (length(trim(duration)) between 1 and 80),
  start_date date not null,
  end_date date not null,
  issue_date date not null default current_date,
  issuer_name text not null default 'EHO — Ethical Hacking Organizations' check (length(trim(issuer_name)) between 1 and 180),
  signatory_name text,
  details text check (length(coalesce(details,'')) <= 1200),
  created_at timestamptz not null default now(),
  issued_by uuid references auth.users(id),
  check (end_date >= start_date)
);

create index if not exists eho_offer_letters_recipient_idx
  on public.eho_offer_letters (lower(recipient_name));
create index if not exists eho_offer_letters_created_idx
  on public.eho_offer_letters (created_at desc);

alter table public.eho_offer_letters enable row level security;
revoke all on public.eho_offer_letters from anon, authenticated;
drop policy if exists "admins read offer letters" on public.eho_offer_letters;
create policy "admins read offer letters" on public.eho_offer_letters
  for select to authenticated using (public.is_eho_admin());
grant select on public.eho_offer_letters to authenticated;

create or replace function public.issue_eho_offer_letter(
  p_recipient_name text,
  p_program_name text,
  p_participation text,
  p_duration text,
  p_start_date date,
  p_end_date date,
  p_issue_date date default current_date,
  p_issuer_name text default 'EHO — Ethical Hacking Organizations',
  p_signatory_name text default null,
  p_details text default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare v_id text;
begin
  if not public.is_eho_admin() then raise exception 'Administrator authorization required'; end if;
  if length(trim(coalesce(p_recipient_name,''))) not between 1 and 160
     or length(trim(coalesce(p_program_name,''))) not between 1 and 180
     or length(trim(coalesce(p_participation,''))) not between 1 and 240
     or length(trim(coalesce(p_duration,''))) not between 1 and 80
     or length(trim(coalesce(p_issuer_name,''))) not between 1 and 180
     or length(coalesce(p_details,'')) > 1200
     or p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Invalid offer letter input';
  end if;
  loop
    v_id := 'EHO-OL-' || to_char(coalesce(p_issue_date,current_date),'YYYY') || '-' || upper(encode(extensions.gen_random_bytes(5),'hex'));
    exit when not exists(select 1 from public.eho_offer_letters l where l.offer_letter_id = v_id);
  end loop;
  insert into public.eho_offer_letters(
    offer_letter_id,recipient_name,program_name,participation,duration,start_date,end_date,
    issue_date,issuer_name,signatory_name,details,issued_by
  ) values (
    v_id,trim(p_recipient_name),trim(p_program_name),trim(p_participation),trim(p_duration),
    p_start_date,p_end_date,coalesce(p_issue_date,current_date),trim(p_issuer_name),
    nullif(trim(coalesce(p_signatory_name,'')),''),nullif(trim(coalesce(p_details,'')),''),(select auth.uid())
  );
  return v_id;
end $$;
revoke all on function public.issue_eho_offer_letter(text,text,text,text,date,date,date,text,text,text) from public, anon;
grant execute on function public.issue_eho_offer_letter(text,text,text,text,date,date,date,text,text,text) to authenticated;

-- Update only the private details field; the certificate ID and public verification data stay intact.
create or replace function public.update_eho_certificate_details(
  p_certificate_id text,
  p_details text
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_eho_admin() then raise exception 'Administrator authorization required'; end if;
  if length(trim(coalesce(p_certificate_id,''))) not between 1 and 100
     or length(coalesce(p_details,'')) > 1000 then
    raise exception 'Invalid certificate details input';
  end if;
  update public.eho_certificates
    set details = nullif(trim(coalesce(p_details,'')),'')
    where certificate_id = p_certificate_id;
  if not found then raise exception 'Certificate not found'; end if;
  return true;
end $$;
revoke all on function public.update_eho_certificate_details(text,text) from public, anon;
grant execute on function public.update_eho_certificate_details(text,text) to authenticated;

notify pgrst, 'reload schema';
