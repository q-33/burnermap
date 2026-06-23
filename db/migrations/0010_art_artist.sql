-- BurnerMap — give art a dedicated artist field. Idempotent.
-- Previously the artist was folded into the description ("By {artist} — …");
-- this column lets us attribute the maker cleanly and search by artist.
alter table art add column if not exists artist text;
