# Development Log

This file tracks development sessions, decisions, and context for continuity across time and collaborators.

---

## Project Status

Current State: Live on GitHub Pages (`main`, `/Centrac-B-v2/` base path)
Primary Goal: Field engineering dashboard for API 675 pump troubleshooting and sizing
Tech Stack: React + Vite + Tailwind + Dexie (IndexedDB) + Three.js (3D Model tab)

---

## Quick Context for New Sessions

- App structure: tabbed dashboard (Suction & Ha, Discharge, Calibration, Troubleshooting)
- UI is present; domain model and calculation rules need explicit documentation
- Use this log to preserve the evolving model and decision history

---

## Conceptual Model (Initial)

System Model:
- Pump system with suction conditions, discharge conditions, and calibration/dosing behavior
- Troubleshooting matrix that maps symptoms to root causes and actions

Inputs (expected):
- Fluid properties (SG, temperature, vapor pressure)
- Suction pressure, elevation, line losses
- Discharge pressure, flow rate, head
- Pump geometry / model parameters
- Calibration settings (stroke length, speed, capacity)

Outputs (expected):
- NPSHa / suction margin
- Head, performance, efficiency
- Dosing rate and calibration adjustments
- Troubleshooting guidance

Constraints and Rules to Confirm:
- API 675 compliance assumptions
- Unit system and conversion rules
- Valid ranges and failure thresholds
- Required minimum inputs for each calculation path

Failure Modes / Breakpoints:
- Missing or inconsistent units
- Out-of-range physical values
- Insufficient data to compute NPSHa or dosing

Optimization Levers:
- Clear input validation
- Fast feedback with sensible defaults
- Traceable formula references

---

## Initial Tasks (Model-First)

- Map components to model: list each tab, its inputs, outputs, and formulas
- Define the minimum input set for each tab to produce a valid result
- Document constraints, breakpoints, and validation rules per tab
- Identify and document formula sources (manual sections, references)
- Add a small set of test cases for each tab (expected inputs/outputs)
- Capture any known edge cases or unsupported configurations

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
