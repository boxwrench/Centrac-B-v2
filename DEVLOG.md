# Development Log

This file tracks development sessions, decisions, and context for continuity across time and collaborators.

---

## Project Status

Current State: Live on GitHub Pages (`main`, `/Centrac-B-v2/` base path)
Primary Goal: Offline-first field toolkit for plant operators, anchored on an
interactive 3D Centrac B model, with plant-wide troubleshooting/maintenance,
dosing/hydraulics calculators, and a daily report — all logged against a
local equipment register (Dexie/IndexedDB), single device, no backend.
Tech Stack: React + Vite + Tailwind + Dexie (IndexedDB) + Three.js (3D Model)

---

## Quick Context for New Sessions

- Nav (in workflow order): 3D Model (landing, full-bleed) → Manual →
  Troubleshoot → Maintenance → Calculators → Report → Assets. Hash routes
  (`#/model`, `#/manual`, `#/troubleshoot`, `#/maintenance`, `#/calcs`,
  `#/report`, `#/assets`) are owned by `state/NavContext.tsx`; no hash lands
  on the model. `useNav().openPart(id)` / `openManual(page)` are the
  cross-tab deep links (jump into the model, cut it open, focus a part; jump
  to a manual page).
- `packs/model/ModelPack.tsx` renders both the 3D explorer and the O&M PDF
  reader (`view="model" | "manual"`); `App.tsx` keeps it mounted once opened
  so the WebGL scene survives tab switches. Troubleshoot and Maintenance each
  have two views via `components/ui/Segmented`: a manual-backed Centrac B
  guide (`packs/model/ServiceGuides.tsx`, embedded via `.explorer-embed`) and
  a plant-wide matrix/checklist (`constants.ts`'s `TROUBLESHOOTING_MATRIX` /
  `PM_CHECKLIST`, filtered by the active asset's `EquipmentType`). Calculators
  merges Dosing (`packs/dosing`) and equipment Checks (`packs/hydraulics`,
  asset-type aware) the same way.
- Domain content — Centrac B parts, 3D geometry, manual excerpts, plant
  symptom/PM data, calculation engines — is documented in
  `docs/MAKE-YOUR-OWN.md` and the `engines/*.test.ts` suite rather than here;
  use this log for session-to-session decisions and history.

---

## Session Notes

### 2026-09-22 — 3D simulator import (`packs/model/`)

- Imported the standalone Centrac B simulator as a new **3D Model** tab next
  to Troubleshooting; troubleshooter untouched.
- `parts.ts` / `inspection.ts` / `pumpScene.ts` are byte-identical copies of
  the sim libs (verified with `diff`); only `ModelPack.tsx` adapts the UI
  (plain buttons instead of shadcn, base-aware IOM links, scoped fullscreen).
- Decisions: Three.js + scene code-split into a lazy chunk loaded on tab
  open; `#/model` hash deep-link; IOM PDF (1.8 MB) deployed but left out of
  the service-worker precache (viewer offline, manual links online).
- Deps added: `three@^0.186.0`, `@types/three`, `lucide-react@^1.31.0`;
  `vite/client` types added to `tsconfig.json`.
- Verified: `tsc --noEmit` clean, 135/135 Vitest passing (new
  `packs/model/parts.test.ts` + `scene.test.ts`), `npm run build` succeeds.
- Pending: visual check of Working/Cutaway animation in a real browser
  (headless Chrome unavailable in the build sandbox); sim owner still
  iterating — future sim revisions sync per README "Updating the 3D model".

### 2026-09-22 — Manual reader + service guides sync (`packs/model/`)

- Ported the sim's new workspace tabs: O&M reader (`ManualReader.tsx`,
  pdfjs-dist, worker + search index + optimized 1.67 MB IOM in `public/`),
  maintenance and troubleshooting guides (`ServiceGuides.tsx`,
  `manual-content.ts`). Scene `setActive` API synced; guides cross-link into
  the model (cutaway + focus) and the reader (PDF page).
- Adaptations: shadcn Tabs/Accordion replaced with native buttons and
  `<details>`; all asset URLs base-aware; PDF worker, search index, and IOM
  added to the service-worker precache (31 entries / ~5.4 MB) so the manual
  works offline.
- Verified: `tsc --noEmit` clean, 138/138 Vitest passing (new
  `manual-content.test.ts`), `npm run build` succeeds, `dist/` contains the
  lazy `pdf-*`/`pumpScene-*` chunks and all reader assets.

### 2026-09-22 — Light theme + overlay fixes (`packs/model/`)

- Restyled the simulator light to match the app: `model.css` remapped
  through new `packs/model/light-palette.json` (271 replacements), scene
  background/ground/grid/outlines/section rims lightened in `pumpScene.ts`.
- Text contrast machine-checked: body 14.6, muted micro-labels 5.6, accent
  text 5.6, white-on-accent 5.0 after darkening the accent fill.
- Overlays: new hide-interface toggle in the tool rail, minimizable part
  card (auto-expands on new selection), slimmer control bar, and true
  full-bleed `:fullscreen` CSS for the existing fullscreen button.

### 2026-09-24 — UX consolidation

- The 3D model is now the landing page and renders full-bleed (`AppTab.MODEL`
  first in `TABS`, the default when there is no hash, `ModelPack` mounted edge-to-edge
  instead of inside the page column).
- Nav reordered around the tech's actual workflow: 3D Model → Manual →
  Troubleshoot → Maintenance → Calculators → Report → Assets.
- The duplicate troubleshooting/maintenance surfaces were merged into single
  tabs with two views each, switched by the new `Segmented` control: Troubleshoot
  is "Centrac B · O&M manual" (manual-backed, via `ServiceGuides.tsx`) vs.
  "Plant symptoms" (the asset-type-filtered `TROUBLESHOOTING_MATRIX`);
  Maintenance is "Rounds & PM" vs. "Centrac B service intervals".
- Dosing and Checks were merged into one "Calculators" tab ("Dosing &
  calibration" / "Equipment checks" views) instead of separate top-level tabs.
- Added `state/NavContext.tsx`: owns the hash route, tab state, and the
  cross-tab deep links (`openPart`, `openManual`) that the model, manual
  reader, and both service guides now use to jump into each other.
- Removed the model explorer's internal header/workspace-tabs row — the app
  header now owns all navigation. "Sources & references" moved out of that
  header into the sidebar as a button that opens the reference modal.
- Fixed the light-theme sidebar that had been left dark after the earlier
  light-theme pass.
- Added `components/ui/PageHeader.tsx` and `components/ui/Segmented.tsx` as
  shared primitives for pack headers and the new two-view switchers.
- One accent across the app: field packs moved from Tailwind blue to the
  Centrac burnt orange used by the header and model; app renamed "Centrac B
  Field Toolkit" (page title, PWA manifest, slate theme colour).
- Phone layout: the header now fits on one row with the nav below it, and the
  explorer stacks in a single column. The workspace block's 292px sidebar column
  had been overriding the phone media query. Manual contents list is
  left-aligned again (a `.explorer button` specificity clash).
- Verified: `tsc --noEmit` clean, 141/141 Vitest passing (new `state/nav.test.ts`),
  `npm run build` succeeds with `pumpScene`/`pdf` still lazy chunks. Checked
  visually in headless Chromium (SwiftShader WebGL) at 1366, 1024, and 400 px wide.
  The Troubleshoot → part link opens the cutaway with the part focused;
  the manual links open the reader at the right page.
- Dead-code sweep: removed the orphaned `PDF` constant and 31 orphaned CSS
  rules (the old explorer header/workspace tabs, `.service-panel`,
  `.status-dot`). The three copies of save-to-log + toast (checks, dosing,
  troubleshooting) are now one hook, `state/useLogSave.ts`. `tsc --noUnusedLocals` is clean.
- Fixed PM completion `outputs.date`: it was stamped in UTC, so after 5 pm
  Pacific it showed tomorrow's date. It now uses the local-time `localDateKey`.
