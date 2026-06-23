-- BurnerMap — artists claim their (official, ownerless) artwork; an admin
-- approves the request through the site. Idempotent.
--
-- A claim belongs to one artwork and one logged-in claimant. status:
--   'pending'  (default, awaiting admin review)
--   'approved' (admin set art.owner_id = claimant; they now manage the piece)
--   'rejected' (declined)
-- An optional message lets the artist identify themselves / provide proof.
create table if not exists art_claims (
  id             uuid primary key default gen_random_uuid(),
  art_id         uuid not null references art(id)   on delete cascade,
  claimant_id    uuid not null references users(id) on delete cascade,
  message        text,
  status         text not null default 'pending',
  reviewed_by_id uuid          references users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint art_claims_status_chk check (status in ('pending', 'approved', 'rejected'))
);
create index if not exists art_claims_status_idx   on art_claims(status);
create index if not exists art_claims_art_idx       on art_claims(art_id, status);
create index if not exists art_claims_claimant_idx  on art_claims(claimant_id);
-- at most one pending claim per (artwork, claimant)
create unique index if not exists art_claims_one_pending
  on art_claims(art_id, claimant_id) where status = 'pending';

drop trigger if exists art_claims_set_updated on art_claims;
create trigger art_claims_set_updated
  before update on art_claims for each row execute function set_updated_at();
