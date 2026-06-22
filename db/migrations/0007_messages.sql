-- BurnerMap — in-app 1:1 direct messages between registered users.
-- Append-only; a "conversation" is derived from the (sender, recipient) pair.
-- All additive. Idempotent.

create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references users(id) on delete cascade,
  recipient_id  uuid not null references users(id) on delete cascade,
  body          text not null,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- thread lookup: all messages between two people, newest first
create index if not exists messages_pair_idx
  on messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);

-- unread badge + nudge checks: a recipient's unread inbox
create index if not exists messages_recipient_unread_idx
  on messages (recipient_id, read_at);
