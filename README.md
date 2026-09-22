<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Centrac B — Field Operator Toolkit

An **offline-first, installable** toolkit for water/wastewater and process **plant
operators** working with Milton Roy Centrac B metering pumps. Built to run on a
tablet at the pump skid — in a concrete gallery with no signal — and to keep the
operator's data on the device.

> Status: live on GitHub Pages at <https://boxwrench.github.io/Centrac-B-v2/>
> (`main` branch, deployed by `.github/workflows` on every push). See
> `docs/superpowers/specs/` and `docs/superpowers/plans/` for the original
> design and implementation plan, and `DEVLOG.md` for the session history.

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
- **Maintenance** — PM checklist with guided task forms; completions logged
  against the active asset.
- **Report** — daily report with review, exclusions, and print export.
- **3D Model** — interactive Centrac B workspace with four sub-tabs: the 3D
  reconstruction (assembled, exploded, X-ray, half-section cutaway, running
  mechanism), an embedded O&M manual reader with full-text search, and
  maintenance + troubleshooting guides that cross-link into the model and the
  manual. Illustrated parts CSV and GLB export included. Deep-linkable via
  `#/model`.

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
| `packs/` | One folder per tool (equipment, dosing, hydraulics, troubleshooting, model) |
| `components/ui/` | Shared presentational primitives |

Adding a tool = adding a `packs/<name>/` folder, without editing existing engines,
repos, or packs.

### Updating the 3D model

`packs/model/` is a port of the standalone simulator, not its source of truth.
The simulator still lives and evolves separately; to sync a new sim revision:

1. Re-copy `lib/parts.ts`, `lib/inspection.ts`, and `lib/pump-scene.ts` into
   `packs/model/` (as `parts.ts`, `inspection.ts`, `pumpScene.ts`).
2. Re-copy `lib/manual-content.ts` and port `components/manual/*.tsx` into
   `packs/model/`, keeping the plain-button markup, the `<details>`
   accordion in the troubleshooting guide, and `import.meta.env.BASE_URL`
   asset paths.
3. Re-verify with `diff` that only intended changes landed.
4. Port any `app/page.tsx` UI changes into `packs/model/ModelPack.tsx`,
   keeping the sub-tab structure and the `.cb-model .explorer` fullscreen
   scope.
5. Re-copy changed `public/` assets (`Centrac_B_IOM.pdf`, `manual-index.json`,
   `pdfjs/` worker files). Add any new runtime dependency (e.g. `pdfjs-dist`)
   to `package.json`.
6. Run `npx tsc --noEmit`, `npm test`, and `npm run build`.
7. If the sync touched `model.css`, re-apply the light theme afterwards:
   map every hex color through `packs/model/light-palette.json` (new sim
   rules need new entries), then re-check text contrast — body 14.6, muted
   micro-labels ≥ 5.5, accent text ≥ 5.5, white-on-accent ≥ 4.9. Scene colors
   in `pumpScene.ts` (background, ground, grid, outlines, section rims) are
   hand-maintained to match and need the same treatment.

Known trade-offs: Three.js and the PDF reader stay in lazily loaded chunks so
the main bundle stays lean; the IOM PDF, search index, and PDF worker are
precached for offline use, while the external manufacturer link and
edge-case PDF font/wasm files still need network.

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
