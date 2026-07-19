<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Centrac B — Field Operator Toolkit

An **offline-first, installable** toolkit for water/wastewater and process **plant
operators** working with Milton Roy Centrac B metering pumps. Built to run on a
tablet at the pump skid — in a concrete gallery with no signal — and to keep the
operator's data on the device.

> Status: in active development on `feat/offline-field-operator-platform`. See
> `docs/superpowers/specs/` and `docs/superpowers/plans/` for the design and
> implementation plan.

## What it does

Everything is anchored to a local **Equipment Register** (the plant's asset list),
so each calculation is logged against a real pump:

- **Assets** — create the plant's equipment list; view each asset's saved history.
- **Dosing & Calibration** — drawdown catch-column (mL/s → GPH) and chemical dosing
  (MGD · PPM → GPH), saved to the active asset's log.
- **Hydraulics** — API 675 suction acceleration head / vacuum-demand pass-fail and
  discharge peak-flow / back-pressure / high-pressure derating.
- **Troubleshooting** — searchable symptom → root cause → recommendation matrix;
  log the chosen fix against an asset.

## Durable & offline by design

- **PWA** — installs to the tablet home screen; loads and runs in airplane mode.
- **Self-hosted assets** — no CDN calls; Tailwind is built at compile time and
  fonts are bundled.
- **Local-first storage** — records persist in the browser (IndexedDB via Dexie)
  and survive refresh, reboot, and days offline. Single-device; no backend.

## Architecture

The codebase is structured so new tools are added as self-contained packs:

| Layer | Responsibility |
|-------|----------------|
| `engines/` | Pure calculation functions (no React, no I/O) — the tested core |
| `db/` | The only module that touches IndexedDB; typed `equipmentRepo` / `logRepo` |
| `state/` | Active-asset context, online-status hook |
| `packs/` | One folder per tool (equipment, dosing, hydraulics, troubleshooting) |
| `components/ui/` | Shared presentational primitives |

Adding a tool = adding a `packs/<name>/` folder, without editing existing engines,
repos, or packs.

## Run locally

**Prerequisites:** Node.js >= 20

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm test         # run the Vitest suite (engines + repos)
```

## Deployment

Configured for GitHub Pages under the `/Centrac-B-v2/` base path (see
`.github/workflows`).

---

© Milton Roy Centrac B Series · API 675 reference · Local-first / offline
