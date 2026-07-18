# Centrac B → Field Operator Platform — Design Spec

**Date:** 2026-07-18
**Status:** Approved for planning
**Author:** brainstormed with Claude Code

---

## 1. Context & Problem

The existing app (`Centrac B Field Engineering Dashboard`) is a React + Vite tool for
Milton Roy Centrac B metering pumps with four tabs: Suction & Ha, Discharge &
Performance, Calibration & Dosing, and a Troubleshooting Matrix.

Two problems motivate this work:

1. **The "Offline-Ready" badge is false.** The app depends on `cdn.tailwindcss.com`,
   Google Fonts CDN, and holds all state in memory. It fails without a network
   connection and loses every calculation on refresh. There is also leftover,
   unused `GEMINI_API_KEY` wiring — an online dependency with no purpose.

2. **It is four disconnected calculators, not an operator's tool.** Nothing is
   saved, nothing attaches to real equipment, and there is no reason for the tabs
   to live together.

### Reframed audience

The target operator is a **plant maintenance technician** at a single
water/wastewater or process plant — not a traveling service engineer. Their day:
daily rounds → dosing/chemical feed → react to a problem → planned PM → shift
handoff → compliance record. They work at **one site with a fixed equipment
list**, often with no signal (concrete/underground galleries), and must keep
durable records.

### Data durability model (decided)

**Local-first, single device.** Each operator's tablet holds its own data in the
browser via IndexedDB. Zero backend, truly offline. Export/import and
server-sync are explicitly deferred and must be addable later without rework.

---

## 2. Product Vision — The Tool Family

This project is the **first tool in a family** bound by the plant operator's day,
sitting on a shared reusable offline platform. The full family (for context; only
the MVP subset is built now):

| # | Tool | Origin | Purpose |
|---|---|---|---|
| **0** | **Equipment Register** *(spine)* | new | Plant asset list + nameplate; everything hangs off it |
| 1 | Daily Rounds & Readings | new | Structured per-asset readings, auto out-of-range flags |
| 2 | **Dosing & Chemical Feed** | evolve *Calibration* | Dose targets, tank inventory/run-out, per-pump calibration log |
| 3 | **Pump Hydraulics** | *Suction* + *Discharge* | Ha / vacuum / derating as commissioning & diagnostic aids |
| 4 | **Guided Troubleshooting** | evolve *Matrix* | Symptom → cause → action per equipment type; logs the fix |
| 5 | PM Tracker | new | Scheduled tasks per asset, last-done / next-due |
| 6 | Shift Handoff Log | new | Digital logbook; open items carry forward |
| 7 | Chemical Safety Quick-Ref | new | Compatibility, spill/first-aid, PPE |

Tools 1, 5, 6, 7 are **out of scope for this build** but the platform is designed
so each is added as a self-contained "domain pack" without changing the core.

---

## 3. MVP Scope (this build)

Build tools **0, 2, 3, 4**:

- **Equipment Register** (spine) — create/edit/list plant assets; view per-asset history.
- **Dosing & Chemical Feed** — port existing Calibration tab onto the platform; save results to log.
- **Pump Hydraulics** — merge existing Suction + Discharge logic; save results to log.
- **Guided Troubleshooting** — evolve the matrix; log the selected fix against an asset.

All on a **genuinely offline PWA** with **IndexedDB persistence**, each calc
loggable against a real asset.

### Explicitly out of scope
- Multi-device sync / plant server / file export-import
- Daily Rounds, PM Tracker, Shift Handoff, Chemical Safety tools
- Any AI / network feature (remove existing Gemini wiring)

---

## 4. Architecture

Separate the buried logic so the platform is reusable and testable. Today's
formulas live inside React components (e.g. acceleration-head math inside
`SuctionTab`); the design pulls them into pure modules.

```
src/
  engines/        Pure functions, no React — hydraulics.ts, dosing.ts, derating.ts
  db/             Dexie schema + typed repositories (equipmentRepo, logRepo)
  packs/          One folder per domain pack = engine wiring + UI
                    equipment/  dosing/  hydraulics/  troubleshooting/
  components/ui/  Shared primitives: InfoCard, InputField, StatusBadge, AssetPicker
  pwa/            Service worker registration + manifest wiring
```

**Unit boundaries and contracts**

- `engines/*` — Pure calculation functions. Input: plain typed objects. Output:
  typed result objects (`{ value, unit, status, message }`). No React, no I/O.
  Depend only on `constants.ts`. Independently unit-testable.
- `db/*` — The **only** module allowed to touch IndexedDB. Exposes typed repos:
  `equipmentRepo.add/list/get/update`, `logRepo.add/listByEquipment`. UI never
  touches Dexie directly.
- `packs/*` — Compose an engine + repos + UI primitives into a tool. A pack knows
  nothing about other packs. Adding a new tool later = add a pack folder.
- `components/ui/*` — Presentational primitives, no domain knowledge.

This means: adding "Daily Rounds" is a new `packs/rounds/` + maybe a new store —
no changes to existing engines, repos, or packs.

---

## 5. Data Model

Two IndexedDB object stores (via Dexie):

```ts
// store: equipment
interface Equipment {
  id: string;              // uuid
  tag: string;             // operator-facing label, e.g. "Chlorine Pump 1"
  type: EquipmentType;     // 'metering_pump' | 'tank' | 'other'
  make?: string;
  model?: string;
  nameplate?: Record<string, string>;  // free-form nameplate fields
  location?: string;
  createdAt: number;       // epoch ms
}

// store: logEntry
interface LogEntry {
  id: string;              // uuid
  equipmentId: string | null;  // null = unassigned
  kind: 'dosing' | 'hydraulics' | 'troubleshoot';
  inputs: Record<string, unknown>;   // snapshot of the calc inputs
  outputs: Record<string, unknown>;  // snapshot of the results
  note?: string;
  timestamp: number;       // epoch ms
}
```

Dexie schema: `equipment: 'id, tag, type, createdAt'`,
`logEntry: 'id, equipmentId, kind, timestamp'`.

**Active Asset** — a global UI selection (header picker) of the current
`Equipment`. When a calc is saved, it attaches to the active asset, or is stored
`equipmentId: null` (unassigned) if none is selected. Never blocks the operator.

---

## 6. Offline Mechanics (making the badge true)

| Concern | Change |
|---|---|
| App install | Add `vite-plugin-pwa` (Workbox): web app manifest + service worker precaching the app shell → installable to tablet home screen |
| CSS | Remove `cdn.tailwindcss.com`; adopt build-time `tailwindcss` + `postcss` with an `index.css` using `@tailwind` directives |
| Fonts | Self-host Inter + JetBrains Mono via `@fontsource/*` (bundled, no Google CDN) |
| Dead code | Remove `GEMINI_API_KEY` / `API_KEY` defines from `vite.config.ts` and any references |
| Verify | App loads and runs fully in airplane mode after first load |

`base: '/Centrac-B-v2/'` in `vite.config.ts` is retained for GitHub Pages; the PWA
manifest `start_url`/`scope` must match this base.

---

## 7. Navigation & UX

- Header keeps the brand + an **Active Asset** picker (`AssetPicker`) and an
  honest offline indicator driven by service-worker/`navigator.onLine` state.
- Tabs become: **Assets** · **Dosing** · **Hydraulics** · **Troubleshooting**.
- **Assets tab:** list equipment, add/edit form, tap an asset → its log history.
- **Calc tabs:** unchanged inputs/outputs, plus a **"Save to log"** action that
  writes a `LogEntry` for the active asset.

---

## 8. Error Handling

- **Divide-by-zero / invalid math:** guard all engine functions (extend existing
  `D > 0` and `sec === 0` guards); return a `warning` status rather than `NaN`.
- **Out-of-range physical inputs:** engines flag implausible values (e.g. negative
  length, SG ≤ 0) via result `status: 'warning'` with a message.
- **Save with no active asset:** allowed; stored unassigned.
- **IndexedDB write/read failure:** surface a non-blocking toast; the in-progress
  calculation state is never lost (persistence failure ≠ data loss in the UI).

---

## 9. Testing

- Add **Vitest**.
- **Engine unit tests** (`engines/*`): known API 675 cases — acceleration head,
  static lift, derating, drawdown GPH, dosing GPH — including guard/edge cases.
  This satisfies the DEVLOG's standing request for per-tab test cases.
- **Repository round-trip tests** (`db/*`): add → list/get → update against a
  fake/in-memory IndexedDB, confirming data survives.
- UI is thin by design; no heavy component testing required for the MVP.

---

## 10. New Dependencies

- `dexie` — IndexedDB wrapper for typed stores/repos
- `vite-plugin-pwa` — manifest + Workbox service worker
- `tailwindcss` + `postcss` (+ `autoprefixer`) — build-time CSS, replaces CDN
- `@fontsource/inter`, `@fontsource/jetbrains-mono` — self-hosted fonts
- `vitest` — unit testing

---

## 11. Success Criteria

1. After first load, the app installs to a tablet home screen and runs **fully in
   airplane mode** — no CDN or network calls.
2. A calculation result **survives refresh and reboot** (persisted in IndexedDB).
3. An operator can **create an asset** and **save a dosing/hydraulics/troubleshoot
   result against it**, then see it in that asset's history.
4. Engine calculations are covered by passing Vitest unit tests with known-good
   API 675 reference values.
5. No remaining Gemini/`API_KEY` code paths.
6. Platform structure (`engines` / `db` / `packs` / `ui`) is in place so a new tool
   is addable as a pack without touching existing packs.
