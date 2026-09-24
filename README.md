<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Centrac B — Field Toolkit

An **offline-first, installable** toolkit for water/wastewater and process **plant
operators**, built around an interactive **3D reconstruction of the Milton Roy
Centrac B metering pump** — open it up, cut it in half, watch the mechanism run,
and jump straight from any part to the manual page that covers it. Around that
model sits the rest of a tech's day: a manual-backed troubleshooting and
maintenance guide, a plant-wide symptom matrix and PM checklist for the rest of
the equipment, dosing/calibration and hydraulic-check calculators, and a daily
report — all logged against a local equipment register and usable with no
signal, at the pump skid.

> Status: live on GitHub Pages at <https://boxwrench.github.io/Centrac-B-v2/>
> (`main` branch, deployed by `.github/workflows/deploy.yml` on every push).
> See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the original
> design and implementation plan, `docs/MAKE-YOUR-OWN.md` for forking this to
> other equipment, and `DEVLOG.md` for the session history.

## Using it at the pump

**Top nav, in the order a tech works:** 3D Model (landing page) → Manual →
Troubleshoot → Maintenance → Calculators → Report → Assets. The active-asset
picker and the online/offline badge live in the header and apply to every tab.
Routes are hash-based (`#/model`, `#/manual`, `#/troubleshoot`, `#/maintenance`,
`#/calcs`, `#/report`, `#/assets`); no hash lands on the 3D model.

### First-time setup

1. **Assets** — add the plant's equipment (tag, type, make, model). The type
   drives which troubleshooting symptoms, PM tasks, and calculator show up for
   that asset.
2. Pick the **active asset** from the header dropdown (or leave it
   "Unassigned" for facility-wide work) — everything logged goes against
   whichever asset is active.
3. **Report** tab — set the plant name and operator name once. They're saved
   to this device (`localStorage`, via `state/settings.ts`) and reused every
   day; there's no separate settings screen.

### Typical flows

- **Diagnose → 3D → manual.** Troubleshoot tab: the "Centrac B · O&M manual"
  view (default for a metering pump) walks a symptom to a manual-sourced
  cause; each cause links to the relevant part (jumps into the 3D model,
  cuts it open, and focuses that part) and to the supporting manual page. The
  "Plant symptoms" view is a searchable symptom → cause → recommendation
  matrix for the rest of the plant's equipment, scoped to the active asset's
  type, with "Log this fix."
- **Rounds.** Maintenance → "Rounds & PM": facility-wide tasks plus the active
  asset's type-specific tasks. Simple items are a tap to check off; tasks with
  structured fields (readings, checks, notes — some with pass/warn/fail
  thresholds) expand into a form and log a full entry.
- **Calibration drawdown.** Calculators → "Dosing & calibration": catch-column
  drawdown (mL / time → GPH) and chemical dosing (MGD · PPM → required GPH),
  saved to the active asset's log.
- **Print the day's report.** Report tab compiles that day's rounds, checks,
  calibrations and logged issues; exclude anything that shouldn't print, add
  remarks, then "Print / Save as PDF."

### 3D controls cheat sheet

- **Modes** — Assembled, Exploded, Working (mechanism running, ghosted
  casing), Cutaway (half the casing removed) via the mode switch.
- **X-ray** and **Part labels** toggles in the bottom control panel.
- **Camera views** — iso / front / end / top buttons.
- **Part search** and section filter (All / Drive / Liquid end) in the
  sidebar; tap any part to select it there or in the viewport.
- **CSV parts export** — download icon next to "Components" (the illustrated
  parts list, not a full bill of materials).
- **GLB download** — "Download 3D" exports the current pose/explosion as a
  glTF binary (the running-mechanism animation itself isn't exported).
- **Hide interface** — eye icon in the tool rail clears every overlay for an
  unobstructed view.
- **Fullscreen** — the Maximize button; the explorer goes true full-bleed via
  CSS `:fullscreen`.

### Installing it / offline behavior

It's a standard installable PWA (`vite-plugin-pwa`, auto-updating). The
service-worker precache (`vite.config.ts`, `workbox.globPatterns`) covers the
app shell plus every JS/CSS/HTML/JSON/PDF/SVG/PNG/ICO/WOFF asset it can find —
including the O&M PDF, `manual-index.json`, and the PDF.js worker — so the 3D
model, manual reader, and every tool work with no signal once you've opened
the app while online. **Needs network:** the external Milton Roy product-page
link (in "Sources & references"), and PDF.js's on-demand wasm/standard-font
files (JBIG2/OpenJPEG decoders, Foxit/Liberation fonts) used only for uncommon
PDF content — those extensions aren't in the precache glob.

There's also a fully portable build (`npm run build:single`) that inlines
everything — JS, CSS, fonts, icons — into one `dist-single/index.html`; no
server, install step, or network ever required. Copy it to a tablet or USB
stick and double-click it.

## Architecture

| Layer | Responsibility |
|-------|----------------|
| `engines/` | Pure calculation functions (no React, no I/O) — the tested core |
| `db/` | The only layer that touches IndexedDB (Dexie); typed `equipmentRepo`, `logRepo`, `reportRepo` |
| `state/` | Active-asset context, nav (hash routing + cross-tab deep links), settings, online-status hook |
| `packs/` | One folder per tool: `model` (3D + manual reader), `troubleshooting`, `maintenance`, `calcs` (dosing + hydraulics), `report`, `equipment` |
| `components/ui/` | Shared presentational primitives: `InfoCard`, `AssetPicker`, `PageHeader`, `Segmented` |

Adding a tool = adding a `packs/<name>/` folder, without editing existing
engines, repos, or other packs.

### Make it your own

Everything Centrac-B-specific — the 3D geometry, the parts list, the manual
content, the plant symptom/PM data, the branding — is concentrated in a
handful of files. See **[docs/MAKE-YOUR-OWN.md](docs/MAKE-YOUR-OWN.md)** for a
guide to forking this for another pump model or a different equipment type
entirely.

### Updating the 3D model

`packs/model/` is a port of a standalone simulator, not its source of truth.
The simulator still lives and evolves separately; to sync a new sim revision:

1. Re-copy `lib/parts.ts`, `lib/inspection.ts`, and `lib/pump-scene.ts` into
   `packs/model/` (as `parts.ts`, `inspection.ts`, `pumpScene.ts`).
2. Re-copy `lib/manual-content.ts`, and port the sim's manual-reader and
   service-guide components into `packs/model/ManualReader.tsx` and
   `packs/model/ServiceGuides.tsx` (`MaintenanceGuide` / `TroubleshootingGuide`),
   keeping the plain-button markup, the `<details>` accordion in the
   troubleshooting guide, and `import.meta.env.BASE_URL` asset paths.
3. Re-verify with `diff` that only intended changes landed.
4. Port any upstream UI changes into `packs/model/ModelPack.tsx`. Note that
   `ModelPack` no longer owns a workspace-tabs header or the service guides —
   it only renders the 3D explorer (`view="model"`) and the manual reader
   (`view="manual"`); `MaintenanceGuide` and `TroubleshootingGuide` are
   rendered directly by `packs/maintenance/MaintenancePack.tsx` and
   `packs/troubleshooting/TroubleshootingPack.tsx` inside a
   `.cb-model .explorer.explorer-embed` wrapper. Keep that split, and keep the
   `.cb-model .explorer` fullscreen scope.
5. Re-copy changed `public/` assets (`Centrac_B_IOM.pdf`, `manual-index.json`,
   `pdfjs/` worker files). Add any new runtime dependency (e.g. a `pdfjs-dist`
   version bump) to `package.json`.
6. Run `npx tsc --noEmit`, `npm test`, and `npm run build`.
7. If the sync touched `model.css`, re-apply the light theme afterwards:
   map every new hex color through `packs/model/light-palette.json` (new sim
   rules need new entries), then re-check text contrast — body 14.6, muted
   micro-labels ≥ 5.5, accent text ≥ 5.5, white-on-accent ≥ 4.9. Scene colors
   in `pumpScene.ts` (background, ground, grid, outlines, section rims) are
   hand-maintained to match and need the same treatment. Then restore the
   **"App shell integration"** block at the end of `model.css` — the
   `.cb-model`, `.explorer-embed`, and related mobile-override rules that make
   the explorer full-bleed and let the service guides render inside a regular
   page. It's app-specific, isn't part of the standalone sim, and a wholesale
   overwrite of `model.css` will delete it.

Known trade-offs: Three.js and the PDF reader stay in lazily loaded chunks so
the main bundle stays lean; the IOM PDF, search index, and PDF worker are
precached for offline use, while the external manufacturer link and
edge-case PDF font/wasm files still need network.

## Run locally

**Prerequisites:** Node.js >= 20

```bash
npm install
npm run dev          # start the dev server
npm run build        # production build (GitHub Pages, base "/Centrac-B-v2/")
npm run build:single # portable single-file build → dist-single/index.html
npm run preview      # preview the production build
npm test             # run the Vitest suite once
npm run test:watch   # Vitest in watch mode
npm run icons        # regenerate pwa-192.png / pwa-512.png from public/icon.svg
```

`npm test` covers the engines, the Dexie repos, the nav/active-asset/settings
state, and the model pack (parts table, scene helpers, manual content).

## Deployment

`.github/workflows/deploy.yml` builds (`npm run build`) and deploys `dist/` to
GitHub Pages on every push to `main`, under the `/Centrac-B-v2/` base path
configured in `vite.config.ts`.

---

© Milton Roy Centrac B Series · API 675 reference · Local-first / offline
