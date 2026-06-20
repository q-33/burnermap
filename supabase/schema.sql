-- BurnerMap — Phase 1 schema (Supabase / Postgres + PostGIS)
--
-- Auth model: public READ; authenticated users may INSERT, and may modify only
-- their OWN rows. Run this in the Supabase SQL Editor (Database -> SQL Editor).
-- Safe to re-run (idempotent where practical).

-- 1. Extensions -------------------------------------------------------------
create extension if not exists postgis;

-- 2. Profiles (1:1 with auth.users) -----------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  playa_name   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. updated_at helper ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- Harden: these are trigger functions and must not be directly callable by
-- clients. Postgres grants EXECUTE to PUBLIC by default, so revoke it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at()  from public, anon, authenticated;

-- 4. Camps ------------------------------------------------------------------
create table if not exists public.camps (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade default auth.uid(),
  name          text not null,
  year          int  not null,
  description   text,
  website       text,
  url           text,
  contact_email text,
  hometown      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists camps_owner_idx on public.camps(owner_id);
create index if not exists camps_year_idx  on public.camps(year);

-- 5. Art installations ------------------------------------------------------
create table if not exists public.art (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade default auth.uid(),
  name          text not null,
  year          int  not null,
  description   text,
  website       text,
  url           text,
  contact_email text,
  hometown      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists art_owner_idx on public.art(owner_id);
create index if not exists art_year_idx  on public.art(year);

-- 6. Locations (belongs to exactly one camp OR one art) ---------------------
-- gps_latitude/gps_longitude are the source of truth (the frontend already
-- uses these names); geom is auto-derived for PostGIS spatial queries.
create table if not exists public.locations (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references auth.users(id) on delete cascade default auth.uid(),
  camp_id        uuid references public.camps(id) on delete cascade,
  art_id         uuid references public.art(id)   on delete cascade,
  -- BRC clock + letter address
  address_string text,             -- e.g. "7:30 & E"
  hour           int,              -- clock hour
  minute         int,              -- 0..59
  road_letter    text,             -- Esplanade, A..L
  distance_ft    numeric,          -- art: feet from the Man
  -- resolved coordinates
  gps_latitude   double precision,
  gps_longitude  double precision,
  geom geography(Point, 4326) generated always as (
    case
      when gps_longitude is not null and gps_latitude is not null
        then st_setsrid(st_makepoint(gps_longitude, gps_latitude), 4326)::geography
    end
  ) stored,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint locations_one_parent check (
    (camp_id is not null and art_id is null) or
    (camp_id is null and art_id is not null)
  )
);
create index if not exists locations_camp_idx  on public.locations(camp_id);
create index if not exists locations_art_idx   on public.locations(art_id);
create index if not exists locations_owner_idx on public.locations(owner_id);
create index if not exists locations_geom_idx  on public.locations using gist(geom);

-- 7. updated_at triggers ----------------------------------------------------
drop trigger if exists profiles_set_updated on public.profiles;
create trigger profiles_set_updated  before update on public.profiles  for each row execute function public.set_updated_at();
drop trigger if exists camps_set_updated on public.camps;
create trigger camps_set_updated      before update on public.camps      for each row execute function public.set_updated_at();
drop trigger if exists art_set_updated on public.art;
create trigger art_set_updated        before update on public.art        for each row execute function public.set_updated_at();
drop trigger if exists locations_set_updated on public.locations;
create trigger locations_set_updated  before update on public.locations  for each row execute function public.set_updated_at();

-- 8. Row Level Security -----------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.camps     enable row level security;
alter table public.art       enable row level security;
alter table public.locations enable row level security;

-- Policies use (select auth.uid()) so the function is evaluated once per
-- statement (cached), not once per row. Writes are scoped to authenticated.

-- profiles: public read, self write
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select to anon, authenticated using (true);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- camps: public read; authenticated insert (must own); owner update/delete
drop policy if exists "camps public read" on public.camps;
create policy "camps public read"  on public.camps for select to anon, authenticated using (true);
drop policy if exists "camps owner insert" on public.camps;
create policy "camps owner insert" on public.camps for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "camps owner update" on public.camps;
create policy "camps owner update" on public.camps for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "camps owner delete" on public.camps;
create policy "camps owner delete" on public.camps for delete to authenticated using ((select auth.uid()) = owner_id);

-- art: same as camps
drop policy if exists "art public read" on public.art;
create policy "art public read"  on public.art for select to anon, authenticated using (true);
drop policy if exists "art owner insert" on public.art;
create policy "art owner insert" on public.art for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "art owner update" on public.art;
create policy "art owner update" on public.art for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "art owner delete" on public.art;
create policy "art owner delete" on public.art for delete to authenticated using ((select auth.uid()) = owner_id);

-- locations: public read; owner writes
drop policy if exists "locations public read" on public.locations;
create policy "locations public read"  on public.locations for select to anon, authenticated using (true);
drop policy if exists "locations owner insert" on public.locations;
create policy "locations owner insert" on public.locations for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "locations owner update" on public.locations;
create policy "locations owner update" on public.locations for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "locations owner delete" on public.locations;
create policy "locations owner delete" on public.locations for delete to authenticated using ((select auth.uid()) = owner_id);
