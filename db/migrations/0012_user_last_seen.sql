-- BurnerMap — track user presence (last activity) for the admin "Online" view.
-- Updated on each /api/me call (page load + a periodic client heartbeat).
-- Idempotent.
alter table users add column if not exists last_seen_at timestamptz;
create index if not exists users_last_seen_idx on users(last_seen_at desc);
