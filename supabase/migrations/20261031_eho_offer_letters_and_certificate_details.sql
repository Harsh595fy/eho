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
