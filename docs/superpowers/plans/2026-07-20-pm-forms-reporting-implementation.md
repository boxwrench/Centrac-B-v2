# PM Task Forms, Daily Report & Troubleshooting Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every EPA PM task that says "record" gets a structured form (readings with pass bands, pass/fail inspection items, embedded calculators) whose data lands in the log store; a new Report tab auto-compiles any day's activity into a reviewable, printable (PDF via print) daily report with operator sign-off; the troubleshooting matrix grows ~25 field-reality entries with severity/escalation.

**Scope source:** `docs/superpowers/plans/2026-07-20-pm-task-forms-and-troubleshooting-expansion.md` (Proposals A, B, C).

**Decisions adopted (from that doc's §7 open items):**
- Accordion forms inside the Maintenance tab (not full-screen).
- `well_pump` becomes a first-class asset type (Task 10).
- Pass bands are hard-coded defaults in `constants.ts` (editable settings deferred).
- Report tab is named "Report", placed after Maintenance.
- Plant name + operator name are one-time device settings stored in localStorage, editable from the Report header.

**Architecture:** Unchanged. New math goes in pure `engines/` with tests; the only DB change is a Dexie **v2 migration adding a `reports` table** (per-day exclusions/remarks — reports themselves are compiled on demand from `logEntries`, never copied). PM form definitions are data (`fields` on `PM_CHECKLIST` entries); one generic `TaskForm` renderer replaces per-task UI. Print export is a Tailwind `print:` variant stylesheet — zero libraries, works in the single-file build.

**Tech Stack:** unchanged (React 19, TS ~5.8, Vite 6, Tailwind 3, Dexie 4, Vitest).

## Global Constraints

- All constraints from `2026-07-18-offline-field-operator-platform.md` still apply: `db/` is the only Dexie importer; `engines/` are pure (no React/IO); packs are additive; formulas/constants live in `constants.ts`.
- Dexie migration MUST be additive: keep the `version(1)` block, add `version(2)`. Never edit v1.
- Existing `maintenance` log entries (checkbox-only, `outputs: { done: true, date }`) must keep working: a task with no `fields` still saves/renders exactly as today, and old entries render in history and reports without error.
- Log entry shape for completed form tasks: `inputs: { taskId, label, values: Record<fieldId, number|string|boolean> }`, `outputs: { done: true, date, readings: Record<fieldId, {value:number, status:string}>, worstStatus }`. `taskId` stays where `MaintenancePack.toggle` already puts it so done-today detection is untouched.
- No runtime network calls. Everything must work in `npm run build:single` output opened from `file://`.
- Repo `node_modules` is Windows-installed; all `npm test`/`npm run build` verification steps run on the dev machine, not in a Linux sandbox.
- Commit after every task with the message given in its final step.

## Phase → Task map

| Phase (scope doc §6) | Tasks below |
|---|---|
| 1 — form framework + 6 "record" tasks | 1, 2, 3, 4 |
| 2 — Report tab | 5, 6, 7, 8 |
| 3 — remaining forms + `well_pump` | 9, 10 |
| 4 — troubleshooting expansion | 11 |
| Final verification | 12 |

---

### Task 1: PM form schema + rounds engine (pure)

Field schema types, threshold constants, and the pure evaluation/derivation math every form uses.

**Files:**
- Modify: `types.ts` (add `PmFieldType`, `PmField`; extend `PmTask` with `fields?`)
- Modify: `constants.ts` (add threshold constants)
- Create: `engines/rounds.ts`
- Test: `engines/rounds.test.ts`

**Interfaces:**
- Consumes: `CalculationResult` from `types.ts`, `CONVERSION_FACTORS` from `constants.ts`.
- Produces:
  - `type PmFieldType = 'reading' | 'checkitem' | 'select' | 'note'`
  - `interface PmField { id:string; type:PmFieldType; label:string; unit?:string; min?:number; max?:number; warnLow?:number; warnHigh?:number; options?:string[]; placeholder?:string }`
  - `PmTask.fields?: PmField[]`
  - `readingStatus(value:number, f:PmField): 'pass'|'fail'|'warning'|'neutral'`
  - `usageSince(prevLevel:number, currentLevel:number, added?:number): number` (gal used; clamps at 0)
  - `daysOfSupply(currentGal:number, avgDailyUseGal:number): number` (Infinity when use ≤ 0)
  - `analyzerDrift(analyzer:number, grab:number): CalculationResult` (|Δ| vs drift limit)
  - `catchVerdict(actualGph:number, expectedGph:number, tolerancePct?:number): CalculationResult` (% error vs tolerance)
  - `specificCapacity(gpm:number, drawdownFt:number): number` (0 when drawdown ≤ 0)
  - `worstStatus(statuses:Array<'pass'|'fail'|'warning'|'neutral'>): 'pass'|'fail'|'warning'|'neutral'` (fail > warning > pass > neutral)

- [ ] **Step 1: Add constants to `CONVERSION_FACTORS` in `constants.ts`**

```ts
  // PM rounds thresholds
  MIN_CL_RESIDUAL_MGL: 0.2,   // minimum detectable/target residual
  MRDL_CL_MGL: 4.0,           // EPA max residual disinfectant level
  ANALYZER_DRIFT_LIMIT_MGL: 0.2, // analyzer vs grab-sample tolerance
  CATCH_TOLERANCE_PCT: 10,    // pump catch vs expected GPH
  MIN_DAYS_OF_SUPPLY: 7,      // chemical reorder warning threshold
```

- [ ] **Step 2: Add form schema types to `types.ts`**

Add `PmFieldType`/`PmField` as specified above, and `fields?: PmField[]` to `PmTask`.

- [ ] **Step 3: Write the failing test `engines/rounds.test.ts`**

Cover at minimum, with these exact expectations:

```ts
// readingStatus with residual band {min:0.2, max:4.0}
readingStatus(2.1, band) === 'pass'
readingStatus(0.1, band) === 'fail'
readingStatus(4.5, band) === 'fail'
// warn-only band {warnHigh: 8}: 9 → 'warning', 5 → 'pass'
// no bounds at all → 'neutral'
usageSince(500, 480) === 20
usageSince(480, 500) === 0            // refilled without logging addition — clamp
usageSince(500, 480, 100) === 120     // added chemical counts
daysOfSupply(100, 20) === 5
daysOfSupply(100, 0) === Infinity
analyzerDrift(2.1, 2.0).status === 'pass'      // |0.1| ≤ 0.2
analyzerDrift(2.5, 2.0).status === 'warning'   // |0.5| > 0.2
catchVerdict(4.9, 5.0).status === 'pass'       // 2% ≤ 10%
expect(catchVerdict(4.0, 5.0).value).toBeCloseTo(20, 5); catchVerdict(4.0, 5.0).status === 'fail'
catchVerdict(5.0, 0).status === 'warning'      // no expected rate → cannot judge
specificCapacity(100, 20) === 5
specificCapacity(100, 0) === 0
worstStatus(['pass','warning','pass']) === 'warning'
worstStatus(['warning','fail']) === 'fail'
worstStatus([]) === 'neutral'
```

- [ ] **Step 4: Run to verify FAIL** — `npx vitest run engines/rounds.test.ts` (cannot resolve `./rounds`).

- [ ] **Step 5: Implement `engines/rounds.ts`** (pure; imports only `constants.ts`/`types.ts`). `readingStatus` order: fail bounds first, then warn bounds, then pass if any bound defined, else neutral.

- [ ] **Step 6: Run to verify PASS**, then `npx vitest run` (whole suite still green).

- [ ] **Step 7: Commit** — `feat: PM form schema and rounds engine with thresholds`

---

### Task 2: Last-reading lookup in the log repo

The forms show "Last: 2.1 mg/L · yesterday" and usage math needs the previous level. Give the repo an efficient query.

**Files:**
- Modify: `db/logRepo.ts`
- Test: extend `db/logRepo.test.ts`

**Interfaces:**
- Produces: `logRepo.lastMaintenanceByTask(taskId:string, equipmentId:string|null): Promise<LogEntry|undefined>` — newest `maintenance` entry whose `inputs.taskId` matches; when `equipmentId` is non-null it must also match; `null` matches facility entries.

- [ ] **Step 1: Write failing tests** — add three cases: returns newest of two entries for the same taskId; returns undefined for unknown taskId; scopes by equipmentId (an `eq-1` entry is not returned for `null` scope and vice versa).
- [ ] **Step 2: Verify FAIL**, implement (filter over `listAll()` — fine at single-device scale), **verify PASS**.
- [ ] **Step 3: Commit** — `feat: last-reading lookup for PM task history`

---

### Task 3: Field definitions for the six "record" tasks

Pure data change: attach `fields` arrays to the 6 tasks whose EPA text says "record". No UI yet.

**Files:**
- Modify: `constants.ts` (PM_CHECKLIST entries)
- Test: extend the PM integrity check into a real test file `engines/pmChecklist.test.ts`

**Field specs (use these ids verbatim — reports and history key on them):**

| Task id | Fields |
|---|---|
| `pm-flow-meter` | `reading` (id `meterReading`, unit `gal`) |
| `pm-chem-tanks-usage` | `reading` (`levelGal`, unit `gal`), `reading` (`addedGal`, unit `gal`, placeholder "0 if none"), `note` (`chemical`) |
| `pm-chem-usage-other` | `reading` (`amountUsed`, unit `gal`), `note` (`chemical`) |
| `pm-storage-levels` | `reading` (`levelFt`, unit `ft`), `select` (`source`, options `['local','SCADA','both']`) |
| `pm-chem-levels` | `reading` (`levelGal`, unit `gal`), `select` (`source`, options `['local','SCADA','both']`) |
| `pm-cl-analyzers` | `reading` (`analyzerMgL`, unit `mg/L`, min `MIN_CL_RESIDUAL_MGL`, max `MRDL_CL_MGL`), `reading` (`grabMgL`, unit `mg/L`, min/max same) |

- [ ] **Step 1: Write `engines/pmChecklist.test.ts`** asserting: 22 tasks; unique task ids; unique field ids within each task; every `assetTypes` value is in `EQUIPMENT_TYPES`; the six ids above have the exact field ids listed; `select` fields have ≥2 options; `reading` fields have a unit.
- [ ] **Step 2: Verify FAIL** (fields missing), add the `fields` arrays, **verify PASS**.
- [ ] **Step 3: Commit** — `feat: structured field definitions for EPA record tasks`

---

### Task 4: Generic TaskForm renderer + accordion Maintenance UI

One component renders any `PmField[]`; tapping a task with fields expands it instead of instantly checking it.

**Files:**
- Create: `packs/maintenance/TaskForm.tsx`
- Modify: `packs/maintenance/MaintenancePack.tsx`

**Interfaces:**
- Consumes: `PmField`, `PmTask`, `readingStatus`/`worstStatus`/`usageSince`/`daysOfSupply`/`analyzerDrift` from `engines/rounds`, `logRepo.lastMaintenanceByTask`.
- Produces: `TaskForm: React.FC<{ task: PmTask; scopeEquipmentId: string|null; onSaved: () => void }>`.

**Behaviour spec:**
1. Renders each field by type: `reading` → numeric input with unit suffix and live status chip (colors as in `InfoCard`); `checkitem` → pass/fail toggle pair; `select` → styled `<select>`; `note` → text input.
2. Above the fields, show last recorded values via `lastMaintenanceByTask` ("Last: 2.1 mg/L · Jul 19"); omit when none.
3. Derived inline results (only where relevant, computed from engine functions): `pm-chem-tanks-usage` → usage since last reading (`usageSince`) and days-of-supply vs `MIN_DAYS_OF_SUPPLY`; `pm-cl-analyzers` → `analyzerDrift(analyzer, grab)` card; `pm-flow-meter` → production since last reading.
4. Save button writes ONE `maintenance` log entry per the Global Constraints shape (`values`, `readings` with per-field status, `worstStatus`), then `onSaved()` collapses the row. The done-today checkbox behaviour, counter, and uncheck-to-delete flow are unchanged.
5. Tasks WITHOUT `fields` keep today's exact one-tap toggle. Tasks WITH fields expand on tap (accordion, one open at a time); a completed form task shows its `worstStatus` color on the row and its recorded values in a compact summary line.
6. Follow existing pack styling conventions (cards, labels, focus rings — copy from `MaintenancePack`/`checkKit`).

- [ ] **Step 1: Build `TaskForm.tsx`** per the spec.
- [ ] **Step 2: Integrate accordion behaviour into `MaintenancePack.tsx`** (state: `openTaskId: string|null`).
- [ ] **Step 3: Verify manually** — `npm run dev`: complete `pm-cl-analyzers` with 2.1/2.0 → pass chips, saved row turns green with summary; enter 5.0 analyzer → fail chip + red row; uncheck → entry removed; a no-field task (`pm-clean-rooms`) still one-tap toggles; Assets-tab history shows the readings JSON.
- [ ] **Step 4: Run `npx vitest run` and `npx tsc --noEmit -p tsconfig.json`** — green/clean.
- [ ] **Step 5: Commit** — `feat: accordion task forms with live reading evaluation`

---

### Task 5: Device settings (plant + operator name)

**Files:**
- Create: `state/settings.ts`
- Test: `state/settings.test.ts` (jsdom, mirror `activeAsset.test.ts` structure)

**Interfaces:**
- Produces: `SETTINGS_KEYS = { plantName:'centrac-b.plantName', operatorName:'centrac-b.operatorName' }`, `readSetting(key):string`, `writeSetting(key, value):void` — try/catch-guarded localStorage like `ActiveAssetContext` helpers; empty string when unset.

- [ ] **Step 1: Failing test** (round-trip, empty default, overwrite). **Step 2: Implement, PASS.** **Step 3: Commit** — `feat: device settings for plant and operator name`

---

### Task 6: Report engine (pure compile)

A report is a query. Given a day's logs + the equipment list + PM_CHECKLIST, produce grouped sections and the skipped-task list.

**Files:**
- Create: `engines/report.ts`
- Test: `engines/report.test.ts`

**Interfaces:**
- Consumes: `LogEntry`, `Equipment`, `PmTask`, `PM_CHECKLIST`.
- Produces:
  - `localDateKey(ts:number): string` — `YYYY-MM-DD` in LOCAL time (not UTC — night-shift correctness).
  - `interface CompiledReport { date:string; rounds:{ completed: Array<{task:PmTask; entry:LogEntry}>; skipped: PmTask[] }; checks:LogEntry[]; calibrations:LogEntry[]; issues:LogEntry[] }`
  - `visibleTasks(equipment:Equipment[]): PmTask[]` — facility tasks + tasks whose `assetTypes` intersect the types present in the register.
  - `compileReport(logs:LogEntry[], equipment:Equipment[], date:string, excludedIds:string[]): CompiledReport` — filters to `localDateKey(timestamp) === date` and id ∉ excluded; groups by kind (`maintenance`→rounds via `inputs.taskId` matched to PM_CHECKLIST, unknown taskIds dropped; `hydraulics`→checks; `dosing`→calibrations; `troubleshoot`→issues); `skipped = visibleTasks − completed task ids`.

- [ ] **Step 1: Failing test.** Fixtures: equipment `[{type:'metering_pump'},{type:'tank'}]`; logs spanning two dates including one maintenance entry per date, one hydraulics, one dosing, one troubleshoot, one excluded-by-id maintenance entry. Assert: date filtering; exclusion; grouping counts; `visibleTasks` includes facility + metering + tank tasks but no sump/centrifugal tasks; `skipped` = visible − the one completed; `localDateKey` of a timestamp constructed with `new Date(2026, 6, 20, 23, 30)` is `'2026-07-20'`.
- [ ] **Step 2: Implement, PASS, whole suite green.**
- [ ] **Step 3: Commit** — `feat: pure report compiler with skipped-task detection`

---

### Task 7: Dexie v2 + report repo (per-day review state)

**Files:**
- Modify: `types.ts` (add `ReportRecord`)
- Modify: `db/db.ts` (v2 migration)
- Create: `db/reportRepo.ts`
- Test: `db/reportRepo.test.ts`

**Interfaces:**
- Produces:
  - `interface ReportRecord { date:string; operator?:string; remarks?:string; excludedLogIds:string[] }`
  - `db.reports!: Table<ReportRecord, string>` added via a NEW `this.version(2).stores({...v1 tables unchanged..., reports: 'date'})` block (keep v1 block verbatim).
  - `reportRepo.get(date):Promise<ReportRecord|undefined>`, `reportRepo.upsert(record):Promise<void>` (`db.reports.put`).

- [ ] **Step 1: Failing test** (get-missing → undefined; upsert then get; upsert twice overwrites). **Step 2: Implement, PASS** — verify `db/equipmentRepo.test.ts` and `db/logRepo.test.ts` still pass (migration didn't break v1 tables). **Step 3: Commit** — `feat: dexie v2 reports table and repo`

---

### Task 8: Report tab (review UI + print/PDF export)

**Files:**
- Create: `packs/report/ReportPack.tsx`
- Modify: `types.ts` (`AppTab.REPORT = 'report'`)
- Modify: `App.tsx` (tab "Report" after Maintenance; add `print:hidden` to header, nav, footer)
- Modify: `index.css` (print margins: `@media print { @page { margin: 0.5in; } }`)

**Behaviour spec:**
1. Date picker (default today; any past date re-renders that day identically thanks to stored exclusions/remarks).
2. Header block: plant name + operator name (inline-editable, persisted via Task 5 settings; operator also copied into the day's `ReportRecord`), date, report title "Daily Operating Report".
3. Sections from `compileReport`: Rounds (n of visible done; each completed task with its readings and status colors; **skipped tasks listed by name** under "Not completed"); Equipment Checks (per-asset, tag + key outputs); Calibrations; Issues & Fixes; Remarks (textarea → `ReportRecord.remarks`).
4. Review mode: each entry row has an exclude toggle (eye icon); excluded entries drop from the report and persist in `ReportRecord.excludedLogIds`; a subtle "n excluded" control restores visibility of excluded rows for re-inclusion. Exclude toggles and editors get `print:hidden`.
5. Signature block at the bottom (always printed): "Operator signature: ____________  Date: ________".
6. "Print / Save as PDF" button calls `window.print()`. With header/nav/footer hidden, the printed page is just the report.
7. Empty day renders every section with an honest "none recorded" line — never a blank page.

- [ ] **Step 1: Build `ReportPack.tsx`** per spec (load logs via `logRepo.listAll()` + `compileReport`; equipment from `useActiveAsset`).
- [ ] **Step 2: Wire the tab** in `types.ts`/`App.tsx`; add `print:hidden` to non-report chrome.
- [ ] **Step 3: Verify manually** — dev server: log a mix of entries, open Report: counts correct, skipped list correct; exclude an entry, switch dates and back → exclusion persisted; print preview shows only the report with signature line; empty yesterday renders "none recorded".
- [ ] **Step 4: `npx tsc --noEmit` clean; `npx vitest run` green.**
- [ ] **Step 5: Commit** — `feat: daily report tab with review, exclusions, and print export`

---

### Task 9: Remaining PM forms (phase 3 forms)

Attach fields to the rest of the checklist. Same renderer, data-only except the pump-catch embedded calculator.

**Files:**
- Modify: `constants.ts` (fields on remaining tasks)
- Modify: `packs/maintenance/TaskForm.tsx` (embedded drawdown calc for `pm-feed-pump-catch`)
- Test: extend `engines/pmChecklist.test.ts`

**Field specs:**

| Task id | Fields |
|---|---|
| `pm-feed-pump-catch` | `reading` (`mL`, unit `mL`), `reading` (`sec`, unit `sec`), `reading` (`expectedGph`, unit `GPH`, placeholder "from dosing calc") — form computes `drawdownGph(mL,sec)` and `catchVerdict(actual, expected)` inline and stores both in `readings` |
| `pm-backup-power` | `checkitem` (`started`), `select` (`transfer`, options `['auto-transfer OK','manual only','failed']`), `reading` (`runHours`, unit `hr`), `reading` (`fuelPct`, unit `%`, min 25) |
| `pm-relief-valves` | `reading` (`setPressure`, unit `PSI`), `note` (`valveTag`) |
| `pm-well-pump-inspect` | `reading` (`amps`, unit `A`), `reading` (`pumpingRate`, unit `gpm`), `reading` (`waterLevelFt`, unit `ft`), `checkitem` (`sealsIntact`), `checkitem` (`noUnusualNoise`) — form computes `specificCapacity(rate, drawdown)` inline when both present |
| `pm-feed-pump-inspect` | `checkitem` × (`noLeaks`, `primeHolds`, `outputSteady`), `note` |
| `pm-booster-inspect` | `checkitem` × (`vibrationNormal`, `tempNormal`, `sealsDry`, `controlsRespond`), `note` |
| `pm-instrument-io` | `checkitem` × (`signalsVerified`), `note` (`instrumentsChecked`) |
| `pm-security` | `checkitem` × (`locks`, `hatches`, `doorsWindows`, `ventsScreens`, `lighting`, `alarms`, `fencing`, `wellCaps`) |
| `pm-test-equipment` | `checkitem` × (`reagentsInDate`, `standardsPass`), `note` |
| `pm-plumbing-leaks` | `checkitem` (`noLeaksFound`), `note` (`leakLocation`) |
| `pm-sump-check` | `checkitem` (`floatTestPass`, `pumpRuns`), `note` |
| `pm-feed-lines-tanks` | `checkitem` (`linesClear`, `tanksClean`), `note` |
| `pm-control-panels` | `checkitem` (`panelsClean`, `indicatorsWork`), `note` |
| `pm-safety-inventory` | `checkitem` (`inventoryComplete`), `note` (`itemsNeeded`) |
| `pm-heater` | `checkitem` (`heaterRuns`) |
| `pm-clean-rooms` | (none — stays one-tap) |

- [ ] **Step 1: Extend the integrity test** (unique field ids per task; the table above's ids present verbatim; `pm-clean-rooms` has no fields). Verify FAIL.
- [ ] **Step 2: Add the data; implement the two inline calculators in `TaskForm` (catch verdict, specific capacity). Verify PASS + manual check of `pm-feed-pump-catch`** (100 mL / 60 s → 1.59 GPH; expected 1.6 → pass).
- [ ] **Step 3: Commit** — `feat: structured forms for all remaining PM tasks`

---

### Task 10: `well_pump` asset type

**Files:**
- Modify: `types.ts` (add to `EquipmentType`, `EQUIPMENT_TYPES`, `EQUIPMENT_TYPE_LABELS` → "Well Pump")
- Modify: `constants.ts` (retag `pm-well-pump-inspect` to `['well_pump']`; well troubleshooting entries from Task 11 use it)
- Create: `packs/hydraulics/WellChecks.tsx` (inputs: static level ft, pumping level ft, rate gpm → drawdown, `specificCapacity`, trend note; reuse `checkKit`)
- Modify: `packs/hydraulics/HydraulicsPack.tsx` (case `well_pump` → `WellChecks`)

- [ ] **Step 1: Implement all four changes.** Existing assets are untouched (additive enum).
- [ ] **Step 2: Verify** — integrity test still green (labels map is `Record<EquipmentType,…>`, so `tsc` enforces completeness); manual: create a Well Pump asset → Checks shows well panel, Maintenance shows well task.
- [ ] **Step 3: Commit** — `feat: well_pump asset type with specific-capacity checks`

---

### Task 11: Troubleshooting expansion (+ severity/escalation)

**Files:**
- Modify: `types.ts` (`TroubleshootingEntry` gains `severity?: 'monitor'|'action'|'urgent'`; `escalate?: string`)
- Modify: `constants.ts` (~25 new entries)
- Modify: `packs/troubleshooting/TroubleshootingPack.tsx` (severity badge on rows — amber `action`, red `urgent`; escalate text rendered as a highlighted "Escalate if…" block in the detail pane)
- Test: extend `engines/pmChecklist.test.ts` or new `engines/troubleshooting.test.ts` (≥45 total entries; all assetTypes valid; every `urgent` entry has `escalate` text)

**Content to add (symptom → cause → recommendation, abbreviated here; write full operator-grade text):** chemical feed/metering — hypochlorite gas-binding (urgent-adjacent `action`), loss of prime from degassing, crystallization in lines/injection quill, siphoning through pump, degraded/stratified chemical; electrical (all pump types) — motor won't start (breaker/overload/contactor), VFD fault trips, motor runs hot, runs-but-SCADA-shows-off; analyzers (facility) — drift vs grab, no sample flow, reagent depletion, flowmeter zero/erratic; wells (`well_pump`) — sand/turbidity at start, declining specific capacity, air/cascading water, positive coliform sample (`urgent`, escalate: notify primary operator + state drinking water program); storage tanks — overflow event, freezing/ice damage, coating failure/corrosion, contamination signs after breach (`urgent`, escalate); system-level (facility) — low/no distribution residual (`urgent`, escalate), low pressure complaints, dirty/discolored water, air in mains, water hammer.

- [ ] **Step 1: Failing count/validity test → add types + entries → PASS.**
- [ ] **Step 2: Severity badge + escalate block in the pack; manual check with a `well_pump` and no asset selected (facility entries visible).**
- [ ] **Step 3: Commit** — `feat: expand troubleshooting matrix with severity and escalation`

---

### Task 12: Final verification

- [ ] **Step 1:** `npx vitest run` — entire suite green.
- [ ] **Step 2:** `npx tsc --noEmit -p tsconfig.json` — clean.
- [ ] **Step 3:** `npm run build` and `npm run build:single` — both succeed; open `dist-single/index.html` from `file://`: complete a form task, review the Report tab, print preview shows report-only output.
- [ ] **Step 4:** Regression pass: v1→v2 data survives (open with pre-existing IndexedDB data; old checkbox-only maintenance entries render in history and reports).
- [ ] **Step 5:** Commit any stragglers — `chore: phase 1-4 verification pass`
