# Make it your own

This app is a general-purpose field-toolkit shell (assets, logging, rounds,
calculators, report) wrapped around one pump's worth of specific content: a
procedural 3D model, a parts table, and manual-derived troubleshooting/
maintenance text, all for the Milton Roy Centrac B. This guide inventories
every Centrac-B-specific file and what to do with it if you fork this to model
a different Centrac B configuration, another pump model, or a different
equipment class entirely (a chlorinator, a blower, and so on).

The layered architecture in the README (`engines/`, `db/`, `state/`,
`packs/`, `components/ui/`) doesn't need to change for a fork like this —
everything below lives inside `packs/model/`, `constants.ts`, `types.ts`, and
branding files.

## 1. `packs/model/parts.ts` — the parts table

```ts
export type Part = {
  id: string; item: string; name: string; pn: string;
  section: 'Drive' | 'Liquid end'; page: number; figure: number;
  qty: string; description: string;
};
```

Two helpers build entries: `d(id, item, name, pn, page, description, qty?)`
for `section: 'Drive'` (figure 8), and `h(...)` for `section: 'Liquid end'`
(figure 10). `id` is the identifier used everywhere else in the app (3D mesh
group name, cross-link target, manual/PM part chip) — pick short, stable,
lowercase ids (`'gear'`, `'diaphragm'`) since they're load-bearing keys, not
just display text. `item` and `pn` are the manual's item number and part
number; `page`/`figure` point at the manual's parts-table page and drawing
figure. `byId` is a derived lookup (`Object.fromEntries`) — don't hand-maintain
it separately.

To replace this file: build a new `Part[]` for your equipment (still using two
sections if it helps organize a sidebar filter, or drop the `section` filter
UI in `ModelPack.tsx` if it doesn't apply). Every other Centrac-specific file
(`pumpScene.ts`, `manual-content.ts`, `constants.ts`'s `parts` arrays) refers
to parts **by `id`**, so decide your id scheme here first.

## 2. `packs/model/pumpScene.ts` — the 3D model

This is the hard part, and it's honestly hard: `pumpScene.ts` is ~150 dense
lines of procedural Three.js — there's no CAD import, every part is built from
primitives (`box`, `cyl`/cylinder, `ring`/torus) parented into a
`THREE.Group` per part id, positioned by hand-tuned coordinates.

The pattern:

- `group(id, position, explodeOffset)` creates a named `THREE.Group` (the
  group's `name` is the part `id`) and records its assembled position plus
  the vector it moves along when exploded.
- `mesh()`/`box()`/`cyl()`/`ring()`/`bolt()`/`pipe()` add primitive meshes
  into a group, tag `mesh.userData.id = group.name` (this is what raycasting/
  click-selection and the part list resolve against), and pick a material
  from a small hand-tuned palette (`materials.blue/black/steel/polish/dark/
  brass/rubber/membrane/oil/liquid`).
- Every part in `parts.ts` needs a matching `group(...)` call (or the app
  looks up a part with no mesh). The reverse isn't required — `fluid`, for
  example, is a scene-only group with no matching `Part`.
- **Animation phase**: a single `theta` angle (0–2π, one pump cycle) drives
  everything that moves — gear/pinion/coupling rotation, the eccentric-driven
  crosshead/plunger slide, the two check balls opening on alternating half-
  cycles, the diaphragm's vertex-level flex (rewriting its
  `BufferGeometry` position attribute every frame), and fluid particles along
  the process side. `theta` advances in `animate()` when `state.running` is
  true, or is set directly from the `phase` (0–100) scrub value when paused.
  This is a Scotch-yoke reciprocating mechanism specific to the Centrac B
  drive — a rotary-lobe blower, a peristaltic chlorinator pump, etc. would
  need genuinely different motion code, not just retimed constants.
- `update(state: ViewState)` runs on every prop change (not every frame): it
  applies explode/x-ray/cutaway/labels/selection to materials — ghosting
  `enclosingParts` (from `inspection.ts`) in x-ray, swapping shell meshes to
  their hollow geometry and applying a clip plane in cutaway, tinting
  `mechanismColors` parts when "inspecting."
- `exportModel()` clones the scene, bakes the current clip plane into real
  geometry (`clipGeometry`), strips inspection-only helpers, and exports a
  `.glb` via `GLTFExporter`.

**Options for your own equipment**, roughly in order of effort:

1. **Hand-build procedurally, like this file does.** Full control, matches
   the existing style, but it's real 3D-modeling work in code — expect to
   iterate visually (there's no local screenshot tooling for this; test in a
   real browser).
2. **Load a GLB and name nodes by part id.** Model the equipment in Blender/
   CAD, export a `.glb`, load it with `GLTFLoader` (from `three/addons/
   loaders/GLTFLoader.js`, same import pattern this file uses for
   `OrbitControls`/`GLTFExporter`), and name each node/mesh to match a `Part`
   id (`scene.getObjectByName(part.id)`). You'd still need to port the
   selection (`userData.id`), explode-offset, x-ray/cutaway material swap,
   and animation logic to operate on the loaded nodes instead of
   procedurally-built groups — `inspection.ts`'s `enclosingParts`/
   `mechanismColors` and `update()`'s material logic are the parts most
   reusable as-is; the geometry-construction functions (`box`, `cyl`,
   `hollowBox`, `hollowCylinder`) become unnecessary.
3. A middle ground: procedural shell/casing geometry (cheap, and x-ray/
   cutaway needs a "shell" concept anyway) with a loaded GLB for the more
   organic moving parts.

Whichever route, `ViewState`, `PumpScene` (the return type of
`createPumpScene`), and the `ModelPack.tsx` props it's wired to
(`update`, `setView`, `focus`, `exportModel`, `setActive`, `zoom`, `dispose`)
are the contract the rest of the app depends on — keep that surface if you
want to reuse `ModelPack.tsx` unchanged.

## 3. `packs/model/inspection.ts` — shared geometry/material helpers

- `enclosingParts` — the `Set<string>` of part ids treated as "casing": these
  ghost out in x-ray and get their hollow geometry substituted (and clipped)
  in cutaway. Update this set to match your new part ids.
- `mechanismColors` — a `Record<partId, hexColor>` used to tint moving/
  internal parts while inspecting. Update per your new mechanism parts.
- `hollowBox`/`hollowCylinder` — build a genuinely hollow version of a box or
  cylinder shell (so clipping doesn't expose a solid block); reusable as-is
  for any box/cylinder-shaped casing.
- `clipGeometry`/`sectionEdges` — generic half-space mesh clipping and
  cut-plane rim-outline generation; reusable as-is regardless of equipment.

## 4. `packs/model/manual-content.ts` — manual-sourced content

Three arrays, all referencing `Part` ids and **PDF page numbers** (not printed
page numbers — see §5):

- `manualSections: {title, page, label}[]` — the manual reader's
  table-of-contents sidebar.
- `maintenanceTopics: {id, title, frequency, summary, details: string[],
  page, reference, parts: string[]}[]` — rendered as cards by
  `MaintenanceGuide` in `ServiceGuides.tsx`; `parts` renders clickable chips
  that jump into the 3D model, `page`/`reference` link to the manual.
- `troubleGroups: {id, title, description, checks: {cause, action,
  parts: string[], page}[]}[]` — rendered as the symptom list + cause
  accordion by `TroubleshootingGuide`.

Replace these with content transcribed from your equipment's actual manual,
keyed to your new `parts.ts` ids and your new PDF's page numbers.

## 5. The manual PDF and `public/manual-index.json`

`public/Centrac_B_IOM.pdf` is the source document, rendered in-browser by
`packs/model/ManualReader.tsx` via `pdfjs-dist` (worker/fonts/wasm files
under `public/pdfjs/`, copied from that package — keep them in sync with the
`pdfjs-dist` version in `package.json`).

`public/manual-index.json` powers full-text search in the reader. **There is
no generator script in this repo** — `ManualReader.tsx` only fetches and
validates it at runtime (`Array<{page, printed, text}>`, checked with a
`typeof` guard on load). Its format, reverse-engineered from that guard and
current contents:

```json
[
  { "page": 1, "printed": "Cover", "text": "Instruction Manual Centrac B Metering Pump ..." },
  { "page": 2, "printed": "—",     "text": "THIS PAGE INTENTIONALLY BLANK" }
]
```

- `page` — the PDF page number (1-based, matches `pdf.getPage(page)` and
  every `page:` reference in `manual-content.ts`).
- `printed` — the page number as printed on the page itself (front matter is
  often unnumbered or roman-numeraled, hence `"Cover"` / `"—"` / `"i"`), shown
  in the reader's status bar and search results.
- `text` — that page's extracted plain text, used for substring search and
  the excerpt shown under each search hit.

To regenerate for a new manual: extract text per page (`pdfjs-dist`'s
`getTextContent()` in a small Node script, or `pdftotext -layout` per page)
into this shape, and fill `printed` by hand for any pages whose printed
numbering doesn't match the PDF page index.

## 6. `constants.ts` — `PM_CHECKLIST` and `TROUBLESHOOTING_MATRIX`

These are the **plant-wide** (not Centrac-B-specific) checklist and symptom
matrix — they cover the rest of the equipment register, filtered by
`assetTypes`. Field shapes (from `types.ts`):

```ts
type PmFieldType = 'reading' | 'checkitem' | 'select' | 'note';
interface PmField {
  id: string; type: PmFieldType; label: string; unit?: string;
  min?: number; max?: number; warnLow?: number; warnHigh?: number;
  options?: string[]; placeholder?: string;
}
interface PmTask {
  id: string; label: string; category: string;
  assetTypes?: EquipmentType[]; // omitted/empty = facility-wide
  hint?: string;
  fields?: PmField[]; // omitted = simple checkbox task
}
interface TroubleshootingEntry {
  symptom: string; category: string; cause: string; recommendation: string;
  assetTypes?: EquipmentType[]; // omitted = applies to every asset type
  severity?: 'monitor' | 'action' | 'urgent';
  escalate?: string; // shown when severity warrants notifying someone
}
```

Extend these arrays for your new equipment type: add `PmTask`s tagged with
your `EquipmentType` for rounds, and `TroubleshootingEntry`s tagged the same
way for the plant symptom matrix. Nothing here needs to change if you're just
reskinning the Centrac B model — this content is independent of the 3D model
and manual-content files.

## 7. Equipment types

`types.ts` defines the closed set:

```ts
export type EquipmentType =
  | 'metering_pump' | 'centrifugal_pump' | 'sump_pump' | 'well_pump'
  | 'tank' | 'basin' | 'other';
```

plus `EQUIPMENT_TYPE_LABELS` (display labels) and `EQUIPMENT_TYPES` (the array
used to populate the "Type" select in the Assets tab). To add a new equipment
class (e.g. `'chlorinator'`):

1. Add it to the `EquipmentType` union, `EQUIPMENT_TYPE_LABELS`, and
   `EQUIPMENT_TYPES` in `types.ts`.
2. Add a case for it in `packs/hydraulics/HydraulicsPack.tsx`'s `switch`
   (point it at a new or existing checks component — it currently falls back
   to `MeteringChecks` for anything unmatched, and has an explicit `'other'`
   "no specific checks yet" panel).
3. Tag any new `PM_CHECKLIST`/`TROUBLESHOOTING_MATRIX` entries with it.

The Centrac B 3D model and manual guide are hard-coded to the
`metering_pump` framing (`packs/troubleshooting/TroubleshootingPack.tsx` and
`packs/maintenance/MaintenancePack.tsx` default to the "Centrac B" view when
the active asset is a `metering_pump`) — if you're modeling a different
primary piece of equipment, update those defaults too.

## 8. Branding

- **App header** (`App.tsx`) — the `Box` icon badge, "Centrac B" / "Field
  Toolkit" title block, and the `TABS` array (icons from `lucide-react`,
  labels, tab order).
- **`vite.config.ts`** — the `VitePWA` `manifest` block: `name`, `short_name`,
  `description`, `background_color`, `theme_color`, and `icons`. Also
  `index.html`'s `<title>` and `theme-color` meta tag.
- **Icons** — `public/icon.svg` is the source (a 512×512 rounded square with
  "CB" lettering); `npm run icons` (`scripts/gen-icons.mjs`, uses `sharp`)
  renders it down to `public/pwa-192.png` and `public/pwa-512.png`. Replace
  `icon.svg` and rerun that script rather than hand-editing the PNGs.

## 9. The base path for GitHub Pages

`vite.config.ts` hardcodes `base: '/Centrac-B-v2/'`, and the PWA manifest's
`start_url`/`scope` are set to match. If you fork this into a repo with a
different name (a GitHub Pages **project** site is served at
`https://<user>.github.io/<repo>/`), update all three to your new repo name —
or to `'/'` if you're deploying to a custom domain or a user/org root site.
`vite.config.singlefile.ts` already uses a relative `base: './'` and doesn't
need changes.

## Checklist

- [ ] `packs/model/parts.ts` — new `Part[]`, ids decided
- [ ] `packs/model/pumpScene.ts` — geometry (procedural or GLTFLoader) built,
      one `group(...)` per part id, animation ported or rewritten
- [ ] `packs/model/inspection.ts` — `enclosingParts` / `mechanismColors`
      updated for the new part ids
- [ ] `packs/model/manual-content.ts` — `manualSections`, `maintenanceTopics`,
      `troubleGroups` transcribed from the real manual
- [ ] `public/<your>.pdf` + `public/manual-index.json` — PDF swapped, index
      regenerated in the `{page, printed, text}[]` format
- [ ] `packs/model/ManualReader.tsx` — `PDF_URL` (and any hardcoded page
      count / manual size / part-number text) updated
- [ ] `constants.ts` — `PM_CHECKLIST` / `TROUBLESHOOTING_MATRIX` extended for
      the new equipment
- [ ] `types.ts` — new `EquipmentType`(s) added if needed, plus the
      `HydraulicsPack` switch case
- [ ] Branding — `App.tsx` header, `vite.config.ts` manifest, `index.html`,
      `public/icon.svg` + regenerated PNGs
- [ ] `vite.config.ts` `base` (and manifest `start_url`/`scope`) match the
      new repo/deployment path
- [ ] `npx tsc --noEmit`, `npm test`, `npm run build` all pass
- [ ] `model.css`'s "App shell integration" block (the `.cb-model` /
      `.explorer-embed` rules) still present after any styling changes

## Accuracy and liability

Every fact in `manual-content.ts`, `constants.ts`, and `parts.ts` should trace
back to the actual manual for your equipment — part numbers, intervals,
pressures, and procedures are transcribed reading notes, not independently
verified engineering judgment, and the app says so in-context (see the
"About this guide" / "Sources & references" copy in `ServiceGuides.tsx` and
`ModelPack.tsx`). Don't invent values to fill a gap; leave a field out or note
the ambiguity, the way `parts.ts` does for the relief-valve part number that
depends on an unresolved pressure configuration.

The 3D model is explicitly **illustrative, not dimensional** — geometry,
clearances, gear tooth counts, and motion timing are built for
comprehension, not manufacturing accuracy or CAD-grade fidelity (see the
`.model-note` badge and the "About this reconstruction" copy in
`ModelPack.tsx`). Carry that same disclaimer into any fork rather than
implying the model represents true part dimensions or clearances.
