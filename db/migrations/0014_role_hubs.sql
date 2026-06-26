-- BurnerMap — add the 'hubs' role. Idempotent.
--   'hubs' : organizers who run several camps — may create, place, move & edit
--            MULTIPLE camps they own (own-camps only; not the place-any-camp
--            powers of 'org'/'admin').
-- Roles are now: 'user' | 'gpe' | 'admin' | 'org' | 'tco' | 'hubs' (stored as
-- plain text with a CHECK constraint, so adding a role is just swapping it).
alter table users drop constraint if exists users_role_chk;
alter table users add constraint users_role_chk
  check (role in ('user', 'gpe', 'admin', 'org', 'tco', 'hubs'));
