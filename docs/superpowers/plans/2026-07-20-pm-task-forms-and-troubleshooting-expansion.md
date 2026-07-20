# PM Task Forms, Troubleshooting Expansion & Daily Reporting — Scope & Plan

Date: 2026-07-20 · Status: PROPOSED (nothing built yet)

## 1. Where the app stands

Five tabs, all anchored to the Equipment Register: Assets (6 types), Dosing
(metering-pump calibration), Checks (asset-aware calculators for metering,
centrifugal, sump, basin/tank), Maintenance (22 EPA PM tasks as a flat
checkbox list), Troubleshooting (23 symptom entries, filtered by asset type).
Pure-function engines with tests, Dexie/IndexedDB persistence, portable
single-file build alongside the PWA build.

**Strengths:** clean pack architecture, everything logs to the asset's history,
offline-first holds together.

**Weakest link (matches your instinct):** the Maintenance tab records only
*that* a task was done, not *what was found*. "Check and record water levels"
gives the operator nowhere to record the level. The EPA list says
"record" in 6 of the 22 tasks and the app can't. That data is also exactly what
sanitary surveys and compliance reviews ask to see.

## 2. Proposal A — every PM task becomes a form

### Task form framework (the enabling work)

Rather than 22 hand-built forms, define a small form schema and one renderer:

| Field type | Behaviour | Example |
|---|---|---|
| `reading` | Number + unit, optional min/max band → pass/warn/fail | Chlorine residual 0.2–4.0 mg/L |
| `checkitem` | Pass/fail toggle per named item | "Seals intact", "No unusual noise" |
| `select` | One of listed options | Generator test: "auto-transfer OK / manual only / failed" |
| `note` | Free text | Leak location |
| `calc` | Embeds an existing engine inline | Drawdown catch column inside the pump-catch task |

Each task in `PM_CHECKLIST` gains a `fields` array. Completing a task saves a
`maintenance` log entry whose `inputs`/`outputs` hold the structured readings —
the DB schema needs no migration. Tasks with no fields stay one-tap checkboxes.

### Per-task specs (the 22 tasks)

**Readings-driven (get real forms):**

1. *Flow meter readings* — meter reading (gal/MG); auto-computes production
   since last entry.
2. *Chemical tank amounts used* — level now; usage derived from last reading;
   **compare against expected usage from the Dosing engine** — a silent
   feed-pump failure shows up as actual ≠ expected. This is the highest-value
   calculator in the plan.
3. *Other chemical usage* — same generic form.
4. *Storage tank water levels* — level ft/% with low/high bands; optional
   tank geometry → gallons.
5. *Chemical tank levels* — level + derived **days-of-supply**
   (level ÷ recent usage rate) with a reorder warning band.
6. *Chlorine residual analyzers* — analyzer value vs grab sample; drift
   |Δ| band; MRDL 4.0 mg/L and min-residual bands.
7. *Pump catch & calibrate* — embeds the existing drawdown calc; compares
   result to expected GPH with a ±10% tolerance → pass/fail.
8. *Backup power* — started? auto-transfer? run-hours, fuel %.
9. *Well pumps* — amps, pumping rate, water level; optional
   **specific-capacity** calc (gpm/ft drawdown) to trend well decline.
10. *Relief & back-pressure valves* — measured set pressure vs spec band.

**Inspection-driven (pass/fail item lists + note):** feed pumps, booster
stations (vibration/heat/seals/controls), instrumentation I/O, security
(the parenthetical items become individual toggles), testing equipment,
plumbing leaks, sump pumps (float test; link to Sump checks), feed
lines/tanks, control panels, safety inventory, heater.

**Simple (stay checkbox + optional note):** clean rooms/grounds.

### UI changes

Task row tap → expands (accordion) to its form; Save logs and collapses.
Done-today state and the daily counter stay. Each task row shows its last
recorded value inline ("Last: 2.1 mg/L · yesterday") — turns rounds into
trend awareness with zero extra work.

## 3. Proposal B — troubleshooting expansion (~25 new entries)

Current coverage is mechanical/hydraulic per asset. Field reality includes:

- **Chemical feed systems** (metering_pump): gas-binding on sodium
  hypochlorite (off-gassing vapor-locks the head — most common feed failure),
  loss of prime from degassing, crystallization/scaling in lines and
  injection quills, siphoning through the pump, degraded/stratified chemical.
- **Electrical/controls** (all pumps): motor won't start (breaker/overload/
  contactor chain), VFD fault codes, motor runs hot/trips, pump runs but
  SCADA shows off (signal loss).
- **Analyzers/instrumentation** (facility): residual analyzer drift vs grab,
  no sample flow, reagent depletion, flowmeter reading zero/erratic.
- **Wells** (centrifugal until a `well_pump` type exists): sand/turbidity on
  start, declining specific capacity, air/cascading water, positive coliform.
- **Storage tanks**: overflow events, freezing, coating failure/corrosion,
  contamination signs after security breach.
- **System-level symptoms** (facility): low/no chlorine residual in
  distribution, low pressure complaints, dirty/discolored water, air in mains,
  water hammer.

Schema additions: optional `severity` ('monitor' | 'action' | 'urgent') and
`escalate` text ("call your primary operator / state drinking-water program
if...") — matters for symptoms with public-health consequences (no residual,
positive coliform, contamination).

## 4. Proposal C — daily report (decided 2026-07-20)

A new **Report** tab that compiles each day's activity from every other tab
into a single reviewable, printable daily/shift report.

**Model (decided):** auto-compile + review edit. The report auto-gathers
everything logged in the selected day — PM rounds with their readings, check
results, dosing calibrations, troubleshooting fixes — grouped by section.
During review the operator can exclude individual entries and add free-text
remarks. No extra taps during the day; curation happens once.

**Header (decided):** plant/system name, date, operator name (remembered on
device via localStorage), and a printed signature/date line, matching how
paper logs are kept for sanitary surveys.

**Export (decided):** printable PDF via a print stylesheet — the review screen
IS the report; Print → Save as PDF. Zero libraries, works offline in the
single-file build. CSV/HTML export deferred to a later phase.

**Report sections:**

1. Header: system name, date, operator, weather/note field.
2. PM rounds: tasks completed (n/22) with recorded readings; skipped tasks
   listed by name — an honest report shows what *wasn't* done.
3. Readings summary: chlorine residuals, tank levels, flow-meter production,
   chemical usage vs expected — each with pass/warn/fail badge.
4. Equipment checks: any Checks-tab results saved that day, per asset.
5. Calibrations: pump catches with tolerance verdicts.
6. Issues & fixes: troubleshooting entries logged, with severity.
7. Remarks + signature block.

**Mechanics:** a report is a *query*, not a stored copy — compiled on demand
from the existing log store (every entry already has kind + timestamp +
equipmentId + structured outputs). Exclusions and remarks are stored per-day in
a small `reports` table (date-keyed) so a reviewed report re-renders
identically later. Past days are reviewable via a date picker, which subsumes
the "rounds history view" idea below.

**Dependency:** the report is only as good as what's recorded — with today's
checkbox-only rounds, section 3 would be empty. Phase 1 (task forms) must land
first; the report then inherits structured readings for free.

## 5. Also recommended (gaps you didn't name)

1. **`well_pump` asset type** — Proposal A #9 and the well troubleshooting
   really want it; folding wells under centrifugal was a stopgap.
2. **Data backup (JSON)** — distinct from reporting: a full dump/restore of
   the local DB, insurance against a lost or broken tablet.
3. **Trending (later)** — sparklines for any repeated reading (residuals,
   tank levels, specific capacity). Deferred; needs no schema work thanks to
   structured readings.

## 6. Suggested build order

| Phase | Scope | Size |
|---|---|---|
| 1 | Form framework + the 6 "record" tasks (flow, 2× chem usage, 2× levels, residuals) | M |
| 2 | **Report tab**: daily compile, review/exclude/remarks, print stylesheet, signature block | M |
| 3 | Remaining forms: pump catch w/ tolerance, backup power, wells (+ `well_pump` type), valves, inspection checklists | M |
| 4 | Troubleshooting expansion + severity/escalation | S |
| 5 | JSON backup/restore; CSV export; trending sparklines | S–M |

Phase 1 before Phase 2 is the only hard ordering (the report needs readings to
show). Phases 3–5 are independently shippable in any order.

## 7. Open decisions

1. Approve the accordion-form UI on the Maintenance tab, or prefer a
   full-screen form per task?
2. Add `well_pump` as an asset type in Phase 3?
3. Default pass bands (residual min, catch tolerance ±10%, starts/hr) —
   hard-coded defaults first, or editable settings from day one?
4. Report tab name and placement — "Report" after Maintenance, or first tab
   of the day (some operators start by opening yesterday's report)?
5. System/plant name for the report header — hard-code, or a one-time
   settings field?

## Decision log

- 2026-07-20: Report model = auto-compile + review edit; period = daily/shift
  (monthly & custom range deferred); export = printable PDF via print CSS;
  header carries operator name + signature line.
