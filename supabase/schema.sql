-- Skema awal ServisKu untuk dijalankan pada proyek Supabase.
-- Jalankan sebagai pemilik database (misalnya melalui SQL Editor Supabase).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kendaraan (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nama_motor text not null,
  merek text not null,
  model text not null,
  nomor_polisi text not null,
  jenis_motor text,
  tahun integer check (tahun is null or tahun between 1900 and 2200),
  odometer_terbaru integer not null default 0 check (odometer_terbaru >= 0),
  tanggal_servis_terakhir date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nomor_polisi)
);

create table if not exists public.komponen_perawatan (
  id uuid primary key default gen_random_uuid(),
  kendaraan_id uuid not null references public.kendaraan (id) on delete cascade,
  nama_komponen text not null,
  interval_km integer not null default 0 check (interval_km >= 0),
  interval_bulan integer not null default 0 check (interval_bulan >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kendaraan_id, nama_komponen),
  check (interval_km > 0 or interval_bulan > 0)
);

create table if not exists public.catatan_servis (
  id uuid primary key default gen_random_uuid(),
  komponen_id uuid not null references public.komponen_perawatan (id) on delete cascade,
  tanggal_servis date not null,
  odometer integer not null check (odometer >= 0),
  biaya numeric(14, 2) check (biaya is null or biaya >= 0),
  bengkel text,
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists kendaraan_owner_id_idx on public.kendaraan (owner_id);
create index if not exists komponen_kendaraan_id_idx on public.komponen_perawatan (kendaraan_id);
create index if not exists catatan_komponen_tanggal_idx on public.catatan_servis (komponen_id, tanggal_servis desc);

alter table public.profiles enable row level security;
alter table public.kendaraan enable row level security;
alter table public.komponen_perawatan enable row level security;
alter table public.catatan_servis enable row level security;

drop policy if exists "Pengguna dapat mengelola profil sendiri" on public.profiles;
create policy "Pengguna dapat mengelola profil sendiri" on public.profiles
  for all to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Pengguna dapat mengelola kendaraan sendiri" on public.kendaraan;
create policy "Pengguna dapat mengelola kendaraan sendiri" on public.kendaraan
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Pengguna dapat mengelola komponen kendaraannya" on public.komponen_perawatan;
create policy "Pengguna dapat mengelola komponen kendaraannya" on public.komponen_perawatan
  for all to authenticated
  using (exists (select 1 from public.kendaraan k where k.id = kendaraan_id and k.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.kendaraan k where k.id = kendaraan_id and k.owner_id = (select auth.uid())));

drop policy if exists "Pengguna dapat mengelola catatan servis kendaraannya" on public.catatan_servis;
create policy "Pengguna dapat mengelola catatan servis kendaraannya" on public.catatan_servis
  for all to authenticated
  using (exists (
    select 1 from public.komponen_perawatan kp
    join public.kendaraan k on k.id = kp.kendaraan_id
    where kp.id = komponen_id and k.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.komponen_perawatan kp
    join public.kendaraan k on k.id = kp.kendaraan_id
    where kp.id = komponen_id and k.owner_id = (select auth.uid())
  ));

create or replace function public.tambah_kendaraan_lengkap(
  p_nama_motor text,
  p_model text,
  p_odometer_awal integer,
  p_merek text,
  p_nomor_polisi text,
  p_jenis_motor text default null,
  p_tahun integer default null,
  p_tanggal_servis_terakhir date default null,
  p_komponen jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_kendaraan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Pengguna harus masuk untuk menambahkan kendaraan';
  end if;
  if jsonb_typeof(coalesce(p_komponen, '[]'::jsonb)) <> 'array' then
    raise exception 'p_komponen harus berupa array JSON';
  end if;

  insert into public.kendaraan (
    owner_id, nama_motor, model, odometer_terbaru, merek, nomor_polisi,
    jenis_motor, tahun, tanggal_servis_terakhir
  ) values (
    auth.uid(), p_nama_motor, p_model, p_odometer_awal, p_merek, p_nomor_polisi,
    p_jenis_motor, p_tahun, p_tanggal_servis_terakhir
  ) returning id into v_kendaraan_id;

  insert into public.komponen_perawatan (kendaraan_id, nama_komponen, interval_km, interval_bulan)
  select v_kendaraan_id, item.nama_komponen, item.interval_km, item.interval_bulan
  from jsonb_to_recordset(coalesce(p_komponen, '[]'::jsonb))
    as item(nama_komponen text, interval_km integer, interval_bulan integer);

  return v_kendaraan_id;
end;
$$;

create or replace function public.perbarui_komponen_kendaraan(
  p_kendaraan_id uuid,
  p_komponen jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.kendaraan k
    where k.id = p_kendaraan_id and k.owner_id = auth.uid()
  ) then
    raise exception 'Kendaraan tidak ditemukan atau bukan milik pengguna';
  end if;
  if jsonb_typeof(coalesce(p_komponen, '[]'::jsonb)) <> 'array' then
    raise exception 'p_komponen harus berupa array JSON';
  end if;

  -- Hapus catatan servis komponen yang dihapus melalui cascade.
  delete from public.komponen_perawatan kp
  where kp.kendaraan_id = p_kendaraan_id
    and not exists (
      select 1 from jsonb_to_recordset(coalesce(p_komponen, '[]'::jsonb))
        as item(id uuid, nama_komponen text, interval_km integer, interval_bulan integer)
      where item.id = kp.id
    );

  insert into public.komponen_perawatan (kendaraan_id, nama_komponen, interval_km, interval_bulan)
  select p_kendaraan_id, item.nama_komponen, item.interval_km, item.interval_bulan
  from jsonb_to_recordset(coalesce(p_komponen, '[]'::jsonb))
    as item(id uuid, nama_komponen text, interval_km integer, interval_bulan integer)
  where item.id is null
  on conflict (kendaraan_id, nama_komponen) do update
    set interval_km = excluded.interval_km,
        interval_bulan = excluded.interval_bulan,
        updated_at = now();

  update public.komponen_perawatan kp
  set nama_komponen = item.nama_komponen,
      interval_km = item.interval_km,
      interval_bulan = item.interval_bulan,
      updated_at = now()
  from jsonb_to_recordset(coalesce(p_komponen, '[]'::jsonb))
    as item(id uuid, nama_komponen text, interval_km integer, interval_bulan integer)
  where item.id = kp.id and kp.kendaraan_id = p_kendaraan_id;
end;
$$;

revoke all on function public.tambah_kendaraan_lengkap(text, text, integer, text, text, text, integer, date, jsonb) from public;
grant execute on function public.tambah_kendaraan_lengkap(text, text, integer, text, text, text, integer, date, jsonb) to authenticated;
revoke all on function public.perbarui_komponen_kendaraan(uuid, jsonb) from public;
grant execute on function public.perbarui_komponen_kendaraan(uuid, jsonb) to authenticated;
