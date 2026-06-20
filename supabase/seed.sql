-- BurnerMap seed: a few demo camps with real block centroids.
-- Safe to run once in the Supabase SQL Editor. Owner is null (official/seeded).

-- Allow ownerless (seeded/imported) rows; user-submitted rows are still owner-checked by RLS.
alter table public.camps     alter column owner_id drop not null;
alter table public.art       alter column owner_id drop not null;
alter table public.locations alter column owner_id drop not null;

with c as (
  insert into public.camps (name, year, description) values ('Robot Heart', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '7:30 & E', 40.784919, -119.218287 from c;

with c as (
  insert into public.camps (name, year, description) values ('Mayan Warrior', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '5:00 & B', 40.777652, -119.205015 from c;

with c as (
  insert into public.camps (name, year, description) values ('Camp Question Mark', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '3:00 & C', 40.780546, -119.193465 from c;

with c as (
  insert into public.camps (name, year, description) values ('Pink Heart', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '9:00 & D', 40.792735, -119.214364 from c;

with c as (
  insert into public.camps (name, year, description) values ('Disco Knights', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '6:00 & G', 40.776341, -119.215103 from c;

with c as (
  insert into public.camps (name, year, description) values ('Black Rock Bistro', 2026, 'Seeded demo camp') returning id
)
insert into public.locations (camp_id, address_string, gps_latitude, gps_longitude)
select id, '4:30 & F', 40.773981, -119.202429 from c;
