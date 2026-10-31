-- EHO: administrator-managed certificate signature appearance.
-- Stores a small signature image or typed-signature preference separately from certificate records.
create table if not exists public.eho_certificate_signature_settings (
  id boolean primary key default true check (id = true),
  mode text not null default 'typed' check (mode in ('typed','image')),
  image_data_url text,
  font_style text not null default 'script' check (font_style in ('script','italic')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint eho_signature_image_size check (length(coalesce(image_data_url,'')) <= 700000),
  constraint eho_signature_image_format check (
    image_data_url is null or image_data_url ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'
  )
);

alter table public.eho_certificate_signature_settings enable row level security;
revoke all on public.eho_certificate_signature_settings from anon, authenticated;
drop policy if exists "admins read certificate signature settings" on public.eho_certificate_signature_settings;
create policy "admins read certificate signature settings"
  on public.eho_certificate_signature_settings for select to authenticated
  using (public.is_eho_admin());
grant select on public.eho_certificate_signature_settings to authenticated;

create or replace function public.save_eho_certificate_signature_settings(
  p_mode text,
  p_image_data_url text default null,
  p_font_style text default 'script'
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_eho_admin() then
    raise exception 'Administrator authorization required';
  end if;
  if p_mode not in ('typed','image')
     or p_font_style not in ('script','italic')
     or (p_mode = 'image' and (
       p_image_data_url is null
       or length(p_image_data_url) > 700000
       or p_image_data_url !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'
     ))
     or (p_mode = 'typed' and p_image_data_url is not null) then
    raise exception 'Invalid signature settings';
  end if;

  insert into public.eho_certificate_signature_settings
    (id, mode, image_data_url, font_style, updated_at, updated_by)
  values
    (true, p_mode, p_image_data_url, p_font_style, now(), auth.uid())
  on conflict (id) do update set
    mode = excluded.mode,
    image_data_url = excluded.image_data_url,
    font_style = excluded.font_style,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;

  return true;
end;
$$;

revoke all on function public.save_eho_certificate_signature_settings(text,text,text) from public, anon;
grant execute on function public.save_eho_certificate_signature_settings(text,text,text) to authenticated;

notify pgrst, 'reload schema';
