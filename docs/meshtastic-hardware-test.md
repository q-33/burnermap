# Meshtastic hardware test checklist

Validates the Phase 1 Meshtastic integration (branch `phase1-meshtastic`) against
real radios. Nothing in the mesh feature is proven until it talks to hardware — run
this before merging to `main` / deploying.

## 0. What you need

- **2+ Meshtastic radios** (e.g. Heltec LoRa32 V3, LILYGO T‑Beam, or T‑Deck).
  At least **one with GPS** (T‑Beam/T‑Deck) to test live positions — or set a
  **fixed position** on a GPS‑less node (Meshtastic app → Position → Fixed position).
- Radios flashed with current **Meshtastic firmware (≥ 2.5)** and **region set**
  (e.g. `US`). ⚠️ With no region set the radio will **not transmit** — nothing will
  appear. Set it in the Meshtastic app/web first.
- All test radios on the **same channel** (the default `LongFast` / public key `AQ==`
  is fine) so they hear each other.
- A **USB cable** (for the Serial path) and/or **Bluetooth** enabled.
- **Browser:** desktop **Chrome or Edge** (Web Bluetooth **and** Web Serial) or
  **Android Chrome** (Web Bluetooth). ❌ Not iOS Safari, ❌ not Firefox — those are
  expected to show the "use the Meshtastic app" note (that's a test case, below).

## 1. Run the app

```bash
git checkout phase1-meshtastic
pnpm install
pnpm dev            # http://localhost:3000  (localhost is a secure context, so Web BLE/Serial work)
```

- Web Bluetooth / Web Serial require a **secure context** — `localhost` qualifies; any
  other host must be **HTTPS**.
- The service worker/offline bits only run in a production build, but the **mesh UI
  works in dev**, so `pnpm dev` is fine for these tests. (For the offline test in §12,
  use a production build: `pnpm build` then run the built server.)
- The **"Mesh"** button is bottom‑left of the map.

---

## 2. Connection — USB / Serial
1. Plug a radio in via USB.
2. Mesh → **Connect via USB** → pick the serial port in the browser chooser.
- ✅ Chooser appears; status goes **Connecting… → Reading the mesh… → connected** (green
  dot on the button). Your own node appears in the people list.

## 3. Connection — Bluetooth
1. Mesh → **Connect via Bluetooth** → pick your radio (BLE pair PIN default `123456`).
- ✅ Pairs, then connected; your node appears.
- If the chooser lists nothing: confirm the radio is powered, BLE enabled, and not
  already connected to the phone app (disconnect it there first).

## 4. Self node
- ✅ Your node shows with **(you)**, an **amber** dot, and the long/short name set on the
  device.

## 5. Peer discovery (NodeInfo)
1. Power on a second radio on the same channel, nearby.
- ✅ Within ~1 minute the peer appears in the people list with its **name, battery %, and
  a last‑heard time**. The list count increments.

## 6. Peer position on the map
1. Give the peer a fix (GPS outdoors, or a fixed position).
- ✅ The peer shows as an **emerald dot** on the map at its coordinates; the header reads
  "People (N) · **M on map**" with M matching the number of located peers.
- ✅ Clicking the dot shows a popup with the peer's name.
- Move a GPS node → ✅ its dot **updates** as new position packets arrive.

## 7. Coordinate correctness
1. Read the peer's actual lat/lng in the Meshtastic app; compare to the plotted dot.
- ✅ Matches within GPS accuracy. (Confirms the `latitudeI/longitudeI ÷ 1e7` conversion and
  `[lng, lat]` ordering — a swap would put the dot in the wrong hemisphere.)

## 8. Mesh chat — receive
1. From the second radio (Meshtastic app or another client) send a text on the shared channel.
- ✅ The message appears in the app's **Mesh chat** with the sender's name.

## 9. Mesh chat — send
1. Type a message in the app → send.
- ✅ Appears as **"You"**; the other radio/app receives it over LoRa (we send with `wantAck`).

## 10. Persistence (IndexedDB)
1. With peers + messages present, **reload the page** (no radio needed after reload).
- ✅ Disconnected state shows "**last seen: N people · M on the map**"; the peers **still
  plot on the map** (restored from IndexedDB); chat history remains.
- ✅ DevTools → Application → IndexedDB → `keyval-store` → keys `bm:mesh:nodes` and
  `bm:mesh:messages` exist.
2. Click **Clear saved mesh data** → list + map peers clear; reload → stays cleared.

## 11. Disconnect / reconnect
1. **Disconnect** → status returns to disconnected; last‑known peers remain (persisted).
2. **Reconnect** → live updates resume; nodes merge by node‑number (✅ no duplicate rows).

## 12. Offline (the whole point)
1. Production build, load once online, connect a radio, get peers.
2. Go **offline** (airplane mode, or DevTools → Network → Offline).
- ✅ Map + peers still render; **mesh chat still sends/receives** over LoRa with **no
  internet**. This is the core promise — validate positions + chat fully off‑grid.

## 13. Expected‑to‑fail / edge cases
- **iOS Safari / any iOS browser:** Mesh panel shows the "use the Meshtastic app" note,
  no connect buttons. ✅ Expected (no Web BLE/Serial on iOS).
- **Firefox:** same note. ✅ Expected.
- **Dismiss the connect chooser:** ✅ no error toast, status returns to disconnected.
- **GPS‑less node, no fixed position:** ✅ shows in the people list but **not** on the map.
- **Unplug USB / power off a radio mid‑session:** should not crash the page. Note the
  observed behavior (status may stay "connected" until you hit Disconnect).

---

## Record while testing
- Which transport(s) worked, on which browser + OS.
- Observed **LoRa range** in open/dusty conditions.
- Any packet fields that came through wrong or empty (name, battery, coords, last‑heard).
- A **position broadcast interval** that felt live without saturating the channel (watch
  for dropped/laggy updates as you add nodes — LoRa shares one slow channel; keep max hops 3).

## Sign‑off (ready to merge `phase1-meshtastic` → `main`)
- [ ] Connect works on ≥1 transport (Serial and/or BLE).
- [ ] A peer appears on the map at the **correct** coordinates.
- [ ] Chat **send + receive** both work.
- [ ] Persistence survives a reload; Clear works.
- [ ] Mesh chat + positions work **offline** (no internet).
