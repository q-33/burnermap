# 🔥 BurnerMap

[![CI](https://github.com/q-33/burnermap/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/q-33/burnermap/actions/workflows/ci.yml)

Find your people on the playa. An unofficial, community map of **Black Rock City** —
mark your camp's location before you arrive and update it once you have service on playa.

**Live: [burnermap.org](https://burnermap.org)**

> Unofficial map. Pins are approximate and do not equal reserved space. Only Burning Man
> Placement determines camp locations and only the ARTery determines art placement.

## What it does

- 🗺️ **Tile-free BRC map** — the city is drawn from a parametric geocoder, so it renders
  the street grid (and works) without any map provider.
- 📍 **Mark & find camps** — log in, drop your camp at your GPS location; it's geocoded to a
  Black Rock City address and shown to everyone.
- 🧭 **Where am I** — live GPS on the city grid with a reverse-geocoded readout
  (e.g. _"near 7:30 & Eternal"_).
- 🔎 **Browse & search** camps (Postgres-native, no external index).
- 🏙️ **Current-year aware** — 2026 themed street names (_Axis Mundi_: Ararat → Kundalini).

## Stack

| | |
|---|---|
| Frontend | [Nuxt 4](https://nuxt.com) + [Nuxt UI](https://ui.nuxt.com) (Reka + Tailwind) |
| Map | [MapLibre GL](https://maplibre.org) |
| API / auth | Nitro server routes + [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| Data | [Drizzle ORM](https://orm.drizzle.team) → DigitalOcean **Postgres + PostGIS** |
| Geocoder | `lib/brc` — parametric BRC address ⇄ lat/lng (pure TS, tested) |
| Hosting | DigitalOcean App Platform (Node service) |

## Develop

```bash
pnpm install

# .env (gitignored) needs:
#   DATABASE_URL=postgresql://…           # Postgres with PostGIS
#   NUXT_SESSION_PASSWORD=…               # 32+ char session secret (auto-added in dev)

pnpm db:migrate   # apply db/migrations/0001_init.sql
pnpm dev          # http://localhost:3000
```

## Verify

```bash
pnpm test         # vitest — geocoder + city-grid
pnpm typecheck    # nuxt typecheck
pnpm build        # production (Nitro Node) build
```

CI runs all three on every push to `main` (see the badge above).

## The BRC geocoder

`lib/brc/geocode.ts` models Black Rock City as a polar city (the Man at center, a
30°/hour clock bearing, concentric lettered streets) and converts addresses to
coordinates with no shipped per-year geometry. To roll to a new year, update
`STREET_NAMES` + `CITY_YEAR` (and only refit the radii if the city plan's geometry
actually changes).
