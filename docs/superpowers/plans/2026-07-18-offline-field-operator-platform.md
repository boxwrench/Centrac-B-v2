# Offline Field-Operator Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Centrac B dashboard into a genuinely-offline, installable PWA where a plant operator manages a local equipment list and saves each dosing/hydraulics/troubleshooting result against a real asset.

**Architecture:** Split buried component math into pure `engines/`, put all IndexedDB access behind typed repos in `db/`, and make each tool a self-contained `packs/<name>/`. Shared UI primitives live in `components/ui/`. Data is local-first (Dexie/IndexedDB), zero backend. A PWA service worker precaches the app shell so it runs in airplane mode.

**Tech Stack:** React 19, TypeScript ~5.8, Vite 6, Tailwind (build-time), Dexie (IndexedDB), vite-plugin-pwa (Workbox), Vitest, @fontsource fonts.

## Global Constraints

- Node >= 20 (required for `crypto.randomUUID`, Vite 6).
- No runtime network/CDN calls — app must fully load and run offline after first visit.
- `base: '/Centrac-B-v2/'` in `vite.config.ts` is retained; PWA `scope` and `start_url` must equal `/Centrac-B-v2/`.
- Local-first, single device: persistence is IndexedDB via Dexie only; no backend, no sync (deferred).
- `db/` is the ONLY module allowed to import Dexie / touch IndexedDB. UI and engines never touch it directly.
- `engines/` are pure functions: no React, no I/O; they depend only on `constants.ts` and `types.ts`.
- New tools are added as `packs/<name>/` without editing existing engines, repos, or packs (additive growth).
- Dexie uses versioned `.stores()` migrations from v1 (schema will evolve).
- All formulas and numeric constants come verbatim from `constants.ts` — do not re-derive or change values.

---

### Task 1: Offline asset foundation (kill the CDN, self-host everything)

Replace CDN Tailwind + Google Fonts with build-time equivalents and remove the unused Gemini wiring, so the app has zero runtime network dependencies.

**Files:**
- Modify: `package.json` (deps)
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.css`
- Modify: `index.html`
- Modify: `index.tsx`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a build with self-hosted CSS/fonts; `index.css` imported globally; no `process.env.API_KEY` defines.

- [ ] **Step 1: Install build-time CSS + font dependencies**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer tailwindcss-animate
npm install @fontsource/inter @fontsource/jetbrains-mono
```

- [ ] **Step 2: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './{components,packs,state}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

- [ ] **Step 3: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Create `index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
}
```

- [ ] **Step 5: Rewrite `index.html` (remove CDN script, Google Fonts link, inline style)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#2563eb">
    <title>Centrac B Field Operator</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>
```

- [ ] **Step 6: Update `index.tsx` to import fonts + global CSS**

Add these imports at the top of `index.tsx`, above the existing React imports:

```ts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './index.css';
```

- [ ] **Step 7: Update `vite.config.ts` (remove Gemini defines/env)**

```ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Centrac-B-v2/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 8: Verify build succeeds and no CDN/Gemini references remain**

Run: `npm run build`
Expected: build completes with no errors.

Run: `grep -rniE "cdn.tailwindcss|fonts.googleapis|GEMINI|API_KEY" index.html vite.config.ts index.tsx`
Expected: no matches.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tailwind.config.js postcss.config.js index.css index.html index.tsx vite.config.ts
git commit -m "build: self-host Tailwind + fonts, drop CDN and Gemini wiring"
```

---

### Task 2: Vitest setup

Add a test runner so engines and repos can be developed test-first.

**Files:**
- Modify: `package.json` (devDeps + `test` script)
- Create: `vitest.config.ts`
- Create: `engines/smoke.test.ts` (temporary sanity test, deleted at end of task)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest in Node environment.

- [ ] **Step 1: Install Vitest + fake IndexedDB**

```bash
npm install -D vitest fake-indexeddb
```

- [ ] **Step 2: Add the `test` script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create a temporary smoke test `engines/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm engines/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest runner"
```

---

### Task 3: Hydraulics engine (pure)

Extract the Suction (acceleration head / vacuum) and Discharge (peak flow / back pressure / derating) math out of the components into pure, tested functions.

**Files:**
- Modify: `types.ts` (extend `CalculationResult` status)
- Create: `engines/hydraulics.ts`
- Test: `engines/hydraulics.test.ts`

**Interfaces:**
- Consumes: `CONVERSION_FACTORS` from `constants.ts`; `CalculationResult` from `types.ts`.
- Produces:
  - `interface SuctionInputs { L:number; N:number; Q:number; SG:number; D:number; H_lift:number }`
  - `interface SuctionResult { Ha:number; Ls:number; total:CalculationResult }`
  - `interface DischargeInputs { Q_set:number; P_d:number }`
  - `interface DischargeResult { peakFlow:number; backPressure:CalculationResult; deratingLossPercent:number; actualFlow:number }`
  - `accelerationHead(i:SuctionInputs):number`, `staticLiftLoss(H_lift:number, SG:number):number`, `vacuumDemand(i:SuctionInputs):SuctionResult`
  - `peakFlow(Q_set:number):number`, `deratingLossPercent(P_d:number):number`, `dischargePerformance(i:DischargeInputs):DischargeResult`

- [ ] **Step 1: Extend `CalculationResult` in `types.ts` to allow `'neutral'`**

Replace the existing `CalculationResult` interface with:

```ts
export interface CalculationResult {
  value: number;
  unit: string;
  status?: 'pass' | 'fail' | 'warning' | 'neutral';
  message?: string;
}
```

- [ ] **Step 2: Write the failing test `engines/hydraulics.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  accelerationHead,
  staticLiftLoss,
  vacuumDemand,
  peakFlow,
  deratingLossPercent,
  dischargePerformance,
} from './hydraulics';

describe('suction hydraulics', () => {
  it('computes acceleration head from API 675 formula', () => {
    expect(accelerationHead({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 }))
      .toBeCloseTo(15.57, 2);
  });

  it('returns 0 acceleration head when pipe diameter is 0 (guard)', () => {
    expect(accelerationHead({ L: 10, N: 144, Q: 50, SG: 1, D: 0, H_lift: 2 })).toBe(0);
  });

  it('computes static lift loss', () => {
    expect(staticLiftLoss(2, 1)).toBeCloseTo(0.866, 3);
  });

  it('fails when total vacuum demand exceeds the 12 PSI limit', () => {
    const r = vacuumDemand({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 });
    expect(r.total.status).toBe('fail');
    expect(r.total.value).toBeCloseTo(16.43, 2);
  });

  it('passes when total vacuum demand is within limits', () => {
    const r = vacuumDemand({ L: 2, N: 60, Q: 10, SG: 1, D: 1, H_lift: 1 });
    expect(r.total.status).toBe('pass');
  });
});

describe('discharge hydraulics', () => {
  it('computes sinusoidal peak flow', () => {
    expect(peakFlow(50)).toBeCloseTo(157.08, 2);
  });

  it('has no derating at or below 200 PSI', () => {
    expect(deratingLossPercent(200)).toBe(0);
  });

  it('derates 0.8% per 100 PSI above 200 PSI', () => {
    expect(deratingLossPercent(300)).toBeCloseTo(0.8, 3);
    expect(deratingLossPercent(400)).toBeCloseTo(1.6, 3);
  });

  it('flags low back pressure below 35 PSI as a warning', () => {
    expect(dischargePerformance({ Q_set: 50, P_d: 20 }).backPressure.status).toBe('warning');
    expect(dischargePerformance({ Q_set: 50, P_d: 150 }).backPressure.status).toBe('pass');
  });

  it('reduces actual flow by the derating loss', () => {
    expect(dischargePerformance({ Q_set: 50, P_d: 300 }).actualFlow).toBeCloseTo(49.6, 2);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run engines/hydraulics.test.ts`
Expected: FAIL — cannot resolve `./hydraulics`.

- [ ] **Step 4: Implement `engines/hydraulics.ts`**

```ts
import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult } from '../types';

export interface SuctionInputs {
  L: number;
  N: number;
  Q: number;
  SG: number;
  D: number;
  H_lift: number;
}

export interface SuctionResult {
  Ha: number;
  Ls: number;
  total: CalculationResult;
}

export function accelerationHead(i: SuctionInputs): number {
  const { L, N, Q, SG, D } = i;
  if (D <= 0) return 0;
  return (L * N * Q * SG) / (Math.pow(D, 2) * CONVERSION_FACTORS.API675_CONSTANT);
}

export function staticLiftLoss(H_lift: number, SG: number): number {
  return H_lift * CONVERSION_FACTORS.WATER_PSI_PER_FOOT * SG;
}

export function vacuumDemand(i: SuctionInputs): SuctionResult {
  const Ha = accelerationHead(i);
  const Ls = staticLiftLoss(i.H_lift, i.SG);
  const total = Ha + Ls;
  const isFail = total > CONVERSION_FACTORS.VACUUM_LIMIT_PSI;
  return {
    Ha,
    Ls,
    total: {
      value: total,
      unit: 'PSI',
      status: isFail ? 'fail' : 'pass',
      message: isFail
        ? 'CRITICAL FAIL: Vacuum demand exceeds the 12 PSI limit of the HPD return spring. Cavitation or knocking will occur.'
        : 'PASS: Vacuum demand is within the mechanical limits of the Centrac B pump.',
    },
  };
}

export interface DischargeInputs {
  Q_set: number;
  P_d: number;
}

export interface DischargeResult {
  peakFlow: number;
  backPressure: CalculationResult;
  deratingLossPercent: number;
  actualFlow: number;
}

export function peakFlow(Q_set: number): number {
  return Q_set * Math.PI;
}

export function deratingLossPercent(P_d: number): number {
  if (P_d <= CONVERSION_FACTORS.DERATING_THRESHOLD_PSI) return 0;
  const deltaP = P_d - CONVERSION_FACTORS.DERATING_THRESHOLD_PSI;
  return (deltaP / 100) * CONVERSION_FACTORS.DERATING_LOSS_RATE * 100;
}

export function dischargePerformance(i: DischargeInputs): DischargeResult {
  const { Q_set, P_d } = i;
  const ok = P_d >= CONVERSION_FACTORS.MIN_BACK_PRESSURE_PSI;
  const loss = deratingLossPercent(P_d);
  return {
    peakFlow: peakFlow(Q_set),
    backPressure: {
      value: P_d,
      unit: 'PSI',
      status: ok ? 'pass' : 'warning',
      message: ok
        ? 'Back pressure is sufficient to seat check valve balls.'
        : 'Low back pressure! Ball valves may float, causing inaccuracy.',
    },
    deratingLossPercent: loss,
    actualFlow: Q_set * (1 - loss / 100),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run engines/hydraulics.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 6: Commit**

```bash
git add types.ts engines/hydraulics.ts engines/hydraulics.test.ts
git commit -m "feat: extract pure hydraulics engine with tests"
```

---

### Task 4: Dosing engine (pure)

Extract the drawdown-calibration and chemical-dosing math into pure, tested functions.

**Files:**
- Create: `engines/dosing.ts`
- Test: `engines/dosing.test.ts`

**Interfaces:**
- Consumes: `CONVERSION_FACTORS` from `constants.ts`.
- Produces:
  - `drawdownGph(mL:number, sec:number):number`
  - `interface DosingInputs { mgd:number; ppm:number; density:number }`
  - `dosingGph(i:DosingInputs):number`

- [ ] **Step 1: Write the failing test `engines/dosing.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { drawdownGph, dosingGph } from './dosing';

describe('dosing engine', () => {
  it('converts drawdown volume/time to GPH', () => {
    expect(drawdownGph(100, 60)).toBeCloseTo(1.585, 3);
  });

  it('returns 0 GPH when time is 0 (guard)', () => {
    expect(drawdownGph(100, 0)).toBe(0);
  });

  it('converts plant flow + dosage to required pump GPH', () => {
    expect(dosingGph({ mgd: 1, ppm: 2, density: 8.34 })).toBeCloseTo(0.0833, 4);
  });

  it('returns 0 GPH when density is 0 (guard)', () => {
    expect(dosingGph({ mgd: 1, ppm: 2, density: 0 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run engines/dosing.test.ts`
Expected: FAIL — cannot resolve `./dosing`.

- [ ] **Step 3: Implement `engines/dosing.ts`**

```ts
import { CONVERSION_FACTORS } from '../constants';

export function drawdownGph(mL: number, sec: number): number {
  if (sec <= 0) return 0;
  return (mL / sec) * CONVERSION_FACTORS.DRAWDOWN_GPH_FACTOR;
}

export interface DosingInputs {
  mgd: number;
  ppm: number;
  density: number;
}

export function dosingGph(i: DosingInputs): number {
  if (i.density <= 0) return 0;
  return (
    (i.mgd * i.ppm * CONVERSION_FACTORS.WATER_LB_PER_GAL) /
    (i.density * CONVERSION_FACTORS.HOURS_PER_DAY)
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run engines/dosing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engines/dosing.ts engines/dosing.test.ts
git commit -m "feat: extract pure dosing engine with tests"
```

---

### Task 5: Data types + Dexie DB + equipment repo

Define the persisted data model, open the versioned Dexie database, and expose a typed equipment repository. `db/` is the only place that touches IndexedDB.

**Files:**
- Modify: `types.ts` (add `Equipment`, `LogEntry`, related types)
- Create: `db/id.ts`
- Create: `db/db.ts`
- Create: `db/equipmentRepo.ts`
- Test: `db/equipmentRepo.test.ts`

**Interfaces:**
- Consumes: nothing external.
- Produces:
  - `type EquipmentType = 'metering_pump' | 'tank' | 'other'`
  - `interface Equipment { id:string; tag:string; type:EquipmentType; make?:string; model?:string; nameplate?:Record<string,string>; location?:string; createdAt:number }`
  - `type LogKind = 'dosing' | 'hydraulics' | 'troubleshoot'`
  - `interface LogEntry { id:string; equipmentId:string|null; kind:LogKind; inputs:Record<string,unknown>; outputs:Record<string,unknown>; note?:string; timestamp:number }`
  - `newId():string`
  - `db` (Dexie instance with `equipment` and `logEntries` tables)
  - `equipmentRepo.add(input:Omit<Equipment,'id'|'createdAt'>):Promise<Equipment>`, `.list():Promise<Equipment[]>`, `.get(id:string):Promise<Equipment|undefined>`, `.update(id:string, changes:Partial<Equipment>):Promise<void>`

- [ ] **Step 1: Add the data model to `types.ts`**

Append to `types.ts`:

```ts
export type EquipmentType = 'metering_pump' | 'tank' | 'other';

export interface Equipment {
  id: string;
  tag: string;
  type: EquipmentType;
  make?: string;
  model?: string;
  nameplate?: Record<string, string>;
  location?: string;
  createdAt: number;
}

export type LogKind = 'dosing' | 'hydraulics' | 'troubleshoot';

export interface LogEntry {
  id: string;
  equipmentId: string | null;
  kind: LogKind;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  note?: string;
  timestamp: number;
}
```

- [ ] **Step 2: Install Dexie**

```bash
npm install dexie
```

- [ ] **Step 3: Create `db/id.ts`**

```ts
export function newId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 4: Create `db/db.ts`**

```ts
import Dexie, { Table } from 'dexie';
import { Equipment, LogEntry } from '../types';

export class CentracDB extends Dexie {
  equipment!: Table<Equipment, string>;
  logEntries!: Table<LogEntry, string>;

  constructor() {
    super('centrac-b');
    // v1 — initial schema. Bump version + add a new .version() block to migrate.
    this.version(1).stores({
      equipment: 'id, tag, type, createdAt',
      logEntries: 'id, equipmentId, kind, timestamp',
    });
  }
}

export const db = new CentracDB();
```

- [ ] **Step 5: Write the failing test `db/equipmentRepo.test.ts`**

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { equipmentRepo } from './equipmentRepo';

beforeEach(async () => {
  await db.equipment.clear();
});

describe('equipmentRepo', () => {
  it('adds equipment with a generated id and createdAt', async () => {
    const eq = await equipmentRepo.add({ tag: 'Chlorine Pump 1', type: 'metering_pump' });
    expect(eq.id).toBeTruthy();
    expect(eq.createdAt).toBeGreaterThan(0);
    expect(eq.tag).toBe('Chlorine Pump 1');
  });

  it('lists equipment newest-first', async () => {
    const a = await equipmentRepo.add({ tag: 'A', type: 'metering_pump' });
    const b = await equipmentRepo.add({ tag: 'B', type: 'tank' });
    const list = await equipmentRepo.list();
    expect(list.map((e) => e.id)).toEqual([b.id, a.id]);
  });

  it('gets equipment by id', async () => {
    const eq = await equipmentRepo.add({ tag: 'Pump', type: 'metering_pump' });
    expect((await equipmentRepo.get(eq.id))?.tag).toBe('Pump');
  });

  it('updates equipment fields', async () => {
    const eq = await equipmentRepo.add({ tag: 'Old', type: 'metering_pump' });
    await equipmentRepo.update(eq.id, { tag: 'New' });
    expect((await equipmentRepo.get(eq.id))?.tag).toBe('New');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run db/equipmentRepo.test.ts`
Expected: FAIL — cannot resolve `./equipmentRepo`.

- [ ] **Step 7: Implement `db/equipmentRepo.ts`**

```ts
import { db } from './db';
import { newId } from './id';
import { Equipment } from '../types';

export const equipmentRepo = {
  async add(input: Omit<Equipment, 'id' | 'createdAt'>): Promise<Equipment> {
    const equipment: Equipment = { ...input, id: newId(), createdAt: Date.now() };
    await db.equipment.add(equipment);
    return equipment;
  },

  async list(): Promise<Equipment[]> {
    return db.equipment.orderBy('createdAt').reverse().toArray();
  },

  async get(id: string): Promise<Equipment | undefined> {
    return db.equipment.get(id);
  },

  async update(id: string, changes: Partial<Equipment>): Promise<void> {
    await db.equipment.update(id, changes);
  },
};
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run db/equipmentRepo.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add types.ts package.json package-lock.json db/id.ts db/db.ts db/equipmentRepo.ts db/equipmentRepo.test.ts
git commit -m "feat: add Dexie data layer and equipment repository"
```

---

### Task 6: Log repository

Store calculation results as log entries, queryable by equipment (including unassigned).

**Files:**
- Create: `db/logRepo.ts`
- Test: `db/logRepo.test.ts`

**Interfaces:**
- Consumes: `db` from `db/db.ts`, `newId` from `db/id.ts`, `LogEntry` from `types.ts`.
- Produces:
  - `logRepo.add(input:Omit<LogEntry,'id'|'timestamp'>):Promise<LogEntry>`
  - `logRepo.listByEquipment(equipmentId:string|null):Promise<LogEntry[]>` (newest-first)
  - `logRepo.listAll():Promise<LogEntry[]>` (newest-first)

- [ ] **Step 1: Write the failing test `db/logRepo.test.ts`**

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { logRepo } from './logRepo';

beforeEach(async () => {
  await db.logEntries.clear();
});

describe('logRepo', () => {
  it('adds a log entry with generated id and timestamp', async () => {
    const entry = await logRepo.add({
      equipmentId: 'eq-1',
      kind: 'dosing',
      inputs: { mgd: 1 },
      outputs: { gph: 0.08 },
    });
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('lists entries for a specific equipment id, newest-first', async () => {
    const a = await logRepo.add({ equipmentId: 'eq-1', kind: 'dosing', inputs: {}, outputs: {} });
    const b = await logRepo.add({ equipmentId: 'eq-1', kind: 'hydraulics', inputs: {}, outputs: {} });
    await logRepo.add({ equipmentId: 'eq-2', kind: 'dosing', inputs: {}, outputs: {} });
    const list = await logRepo.listByEquipment('eq-1');
    expect(list.map((e) => e.id)).toEqual([b.id, a.id]);
  });

  it('lists unassigned (null) entries', async () => {
    const u = await logRepo.add({ equipmentId: null, kind: 'troubleshoot', inputs: {}, outputs: {} });
    await logRepo.add({ equipmentId: 'eq-1', kind: 'dosing', inputs: {}, outputs: {} });
    const list = await logRepo.listByEquipment(null);
    expect(list.map((e) => e.id)).toEqual([u.id]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run db/logRepo.test.ts`
Expected: FAIL — cannot resolve `./logRepo`.

- [ ] **Step 3: Implement `db/logRepo.ts`**

Note: Dexie does not index `null` values, so `listByEquipment` filters in memory rather than using a `where` clause — correct and adequate at single-device scale.

```ts
import { db } from './db';
import { newId } from './id';
import { LogEntry } from '../types';

export const logRepo = {
  async add(input: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    const entry: LogEntry = { ...input, id: newId(), timestamp: Date.now() };
    await db.logEntries.add(entry);
    return entry;
  },

  async listAll(): Promise<LogEntry[]> {
    return db.logEntries.orderBy('timestamp').reverse().toArray();
  },

  async listByEquipment(equipmentId: string | null): Promise<LogEntry[]> {
    const all = await this.listAll();
    return all.filter((e) => e.equipmentId === equipmentId);
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run db/logRepo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/logRepo.ts db/logRepo.test.ts
git commit -m "feat: add log repository for saved calculation results"
```

---

### Task 7: Active-asset context, online-status hook, and AssetPicker

Provide a global "which asset am I working on" selection (persisted), an honest online indicator, and a header picker UI.

**Files:**
- Create: `state/useOnlineStatus.ts`
- Create: `state/ActiveAssetContext.tsx`
- Create: `components/ui/AssetPicker.tsx`
- Test: `state/activeAsset.test.ts`

**Interfaces:**
- Consumes: `equipmentRepo` (Task 5), `Equipment` type.
- Produces:
  - `useOnlineStatus():boolean`
  - `ActiveAssetProvider` React component; `useActiveAsset():{ activeAssetId:string|null; activeAsset:Equipment|null; setActiveAssetId(id:string|null):void; equipment:Equipment[]; refreshEquipment():Promise<void> }`
  - `AssetPicker` React component (no props)
  - `ACTIVE_ASSET_KEY` localStorage key constant + `readActiveAssetId()`/`writeActiveAssetId(id)` helpers (pure, testable)

- [ ] **Step 1: Write the failing test `state/activeAsset.test.ts`**

The environment directive MUST be line 1. `fake-indexeddb/auto` is imported because importing `ActiveAssetContext` pulls in `equipmentRepo` → the Dexie `db` instance, which needs a global `indexedDB`.

```ts
// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { readActiveAssetId, writeActiveAssetId, ACTIVE_ASSET_KEY } from './ActiveAssetContext';

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

describe('active asset persistence helpers', () => {
  it('returns null when nothing stored', () => {
    expect(readActiveAssetId()).toBeNull();
  });

  it('round-trips an id through localStorage', () => {
    writeActiveAssetId('eq-42');
    expect(localStorage.getItem(ACTIVE_ASSET_KEY)).toBe('eq-42');
    expect(readActiveAssetId()).toBe('eq-42');
  });

  it('clears the id when null is written', () => {
    writeActiveAssetId('eq-42');
    writeActiveAssetId(null);
    expect(readActiveAssetId()).toBeNull();
  });
});
```

- [ ] **Step 2: Add jsdom (provides DOM + localStorage for the directive above)**

Run: `npm install -D jsdom`

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run state/activeAsset.test.ts`
Expected: FAIL — cannot resolve `./ActiveAssetContext`.

- [ ] **Step 4: Create `state/ActiveAssetContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { equipmentRepo } from '../db/equipmentRepo';
import { Equipment } from '../types';

export const ACTIVE_ASSET_KEY = 'centrac-b.activeAssetId';

export function readActiveAssetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ASSET_KEY);
  } catch {
    return null;
  }
}

export function writeActiveAssetId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_ASSET_KEY);
    else localStorage.setItem(ACTIVE_ASSET_KEY, id);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

interface ActiveAssetValue {
  activeAssetId: string | null;
  activeAsset: Equipment | null;
  setActiveAssetId: (id: string | null) => void;
  equipment: Equipment[];
  refreshEquipment: () => Promise<void>;
}

const ActiveAssetContext = createContext<ActiveAssetValue | null>(null);

export const ActiveAssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [activeAssetId, setActiveAssetIdState] = useState<string | null>(() => readActiveAssetId());

  const refreshEquipment = useCallback(async () => {
    setEquipment(await equipmentRepo.list());
  }, []);

  useEffect(() => {
    void refreshEquipment();
  }, [refreshEquipment]);

  const setActiveAssetId = useCallback((id: string | null) => {
    writeActiveAssetId(id);
    setActiveAssetIdState(id);
  }, []);

  const activeAsset = useMemo(
    () => equipment.find((e) => e.id === activeAssetId) ?? null,
    [equipment, activeAssetId],
  );

  const value: ActiveAssetValue = {
    activeAssetId,
    activeAsset,
    setActiveAssetId,
    equipment,
    refreshEquipment,
  };

  return <ActiveAssetContext.Provider value={value}>{children}</ActiveAssetContext.Provider>;
};

export function useActiveAsset(): ActiveAssetValue {
  const ctx = useContext(ActiveAssetContext);
  if (!ctx) throw new Error('useActiveAsset must be used within ActiveAssetProvider');
  return ctx;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run state/activeAsset.test.ts`
Expected: PASS.

- [ ] **Step 6: Create `state/useOnlineStatus.ts`**

```ts
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
}
```

- [ ] **Step 7: Create `components/ui/AssetPicker.tsx`**

```tsx
import React from 'react';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const AssetPicker: React.FC = () => {
  const { equipment, activeAssetId, setActiveAssetId } = useActiveAsset();

  return (
    <select
      aria-label="Active asset"
      value={activeAssetId ?? ''}
      onChange={(e) => setActiveAssetId(e.target.value === '' ? null : e.target.value)}
      className="bg-slate-800 text-slate-100 text-sm rounded-lg border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Unassigned</option>
      {equipment.map((eq) => (
        <option key={eq.id} value={eq.id}>
          {eq.tag}
        </option>
      ))}
    </select>
  );
};

export default AssetPicker;
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json state/ActiveAssetContext.tsx state/useOnlineStatus.ts state/activeAsset.test.ts components/ui/AssetPicker.tsx
git commit -m "feat: active-asset context, online-status hook, asset picker"
```

---

### Task 8: App shell rewrite (new navigation + providers)

Replace the four old calculator tabs with the platform navigation (Assets / Dosing / Hydraulics / Troubleshooting), wrap the app in `ActiveAssetProvider`, put the `AssetPicker` and an honest offline badge in the header, and render placeholder panels (packs land in Tasks 9–12).

**Files:**
- Modify: `App.tsx`
- Modify: `types.ts` (`AppTab` enum values)

**Interfaces:**
- Consumes: `ActiveAssetProvider`, `AssetPicker`, `useOnlineStatus`.
- Produces: an `App` rendering four tabs with placeholder content per tab.

- [ ] **Step 1: Update the `AppTab` enum in `types.ts`**

Replace the existing `AppTab` enum with:

```ts
export enum AppTab {
  ASSETS = 'assets',
  DOSING = 'dosing',
  HYDRAULICS = 'hydraulics',
  TROUBLESHOOTING = 'troubleshooting',
}
```

- [ ] **Step 2: Rewrite `App.tsx`**

```tsx
import React, { useState } from 'react';
import { AppTab } from './types';
import { ActiveAssetProvider } from './state/ActiveAssetContext';
import { useOnlineStatus } from './state/useOnlineStatus';
import AssetPicker from './components/ui/AssetPicker';

const TABS: { id: AppTab; label: string }[] = [
  { id: AppTab.ASSETS, label: 'Assets' },
  { id: AppTab.DOSING, label: 'Dosing' },
  { id: AppTab.HYDRAULICS, label: 'Hydraulics' },
  { id: AppTab.TROUBLESHOOTING, label: 'Troubleshooting' },
];

const AppInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ASSETS);
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-xl px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Centrac B Field Operator</h1>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Plant Operator Toolkit v2</p>
          </div>
          <div className="flex items-center gap-3">
            <AssetPicker />
            <span className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-slate-500'}`}></span>
              {online ? 'Online' : 'Offline'} · Works offline
            </span>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-[72px] md:top-[80px] z-40 overflow-x-auto whitespace-nowrap">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-4 md:gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-semibold transition-all border-b-2 outline-none ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
        {activeTab === AppTab.ASSETS && <div className="text-slate-400">Equipment Register — Task 9</div>}
        {activeTab === AppTab.DOSING && <div className="text-slate-400">Dosing — Task 10</div>}
        {activeTab === AppTab.HYDRAULICS && <div className="text-slate-400">Hydraulics — Task 11</div>}
        {activeTab === AppTab.TROUBLESHOOTING && <div className="text-slate-400">Troubleshooting — Task 12</div>}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
          © {new Date().getFullYear()} Centrac B Field Operator · API 675 Reference · Local-First / Offline
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <ActiveAssetProvider>
    <AppInner />
  </ActiveAssetProvider>
);

export default App;
```

- [ ] **Step 3: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`
Then open the served URL. Expected: four tabs render, header shows the asset picker (Unassigned) and an Online/Offline badge; each tab shows its placeholder text. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add App.tsx types.ts
git commit -m "feat: rewrite app shell with platform nav, providers, offline badge"
```

---

### Task 9: Equipment Register pack

Let the operator create equipment, see the list, and view a selected asset's saved-log history. This is the spine every calc attaches to.

**Files:**
- Create: `packs/equipment/EquipmentPack.tsx`
- Modify: `App.tsx` (mount the pack in the Assets tab)

**Interfaces:**
- Consumes: `equipmentRepo`, `logRepo`, `useActiveAsset`, `Equipment`, `EquipmentType`, `LogEntry`.
- Produces: `EquipmentPack` React component (no props).

- [ ] **Step 1: Create `packs/equipment/EquipmentPack.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { equipmentRepo } from '../../db/equipmentRepo';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import { Equipment, EquipmentType, LogEntry } from '../../types';

const TYPES: EquipmentType[] = ['metering_pump', 'tank', 'other'];

const EquipmentPack: React.FC = () => {
  const { equipment, refreshEquipment, activeAssetId, setActiveAssetId } = useActiveAsset();
  const [tag, setTag] = useState('');
  const [type, setType] = useState<EquipmentType>('metering_pump');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (activeAssetId) logRepo.listByEquipment(activeAssetId).then(setHistory);
    else setHistory([]);
  }, [activeAssetId, equipment]);

  const addEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim()) return;
    const created = await equipmentRepo.add({
      tag: tag.trim(),
      type,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
    });
    setTag('');
    setMake('');
    setModel('');
    await refreshEquipment();
    setActiveAssetId(created.id);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Add Equipment</h3>
        <form onSubmit={addEquipment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tag *</label>
            <input value={tag} onChange={(e) => setTag(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Chlorine Pump 1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as EquipmentType)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Make</label>
            <input value={make} onChange={(e) => setMake(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Milton Roy" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Model</label>
            <input value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Centrac B" />
          </div>
          <button type="submit"
            className="md:col-span-4 lg:col-span-1 bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors">
            Add
          </button>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Equipment ({equipment.length})</h3>
        {equipment.length === 0 ? (
          <p className="text-slate-400 text-sm">No equipment yet. Add a pump or tank above.</p>
        ) : (
          <div className="space-y-2">
            {equipment.map((eq: Equipment) => (
              <button key={eq.id} onClick={() => setActiveAssetId(eq.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeAssetId === eq.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">{eq.tag}</span>
                  <span className="text-xs uppercase text-slate-400">{eq.type.replace('_', ' ')}</span>
                </div>
                {(eq.make || eq.model) && (
                  <p className="text-xs text-slate-500">{[eq.make, eq.model].filter(Boolean).join(' · ')}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          History {activeAssetId ? `(${history.length})` : ''}
        </h3>
        {!activeAssetId ? (
          <p className="text-slate-400 text-sm">Select an asset to see its saved results.</p>
        ) : history.length === 0 ? (
          <p className="text-slate-400 text-sm">No saved results for this asset yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold uppercase text-blue-600 text-xs">{h.kind}</span>
                  <span className="text-xs text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <p className="font-mono text-xs text-slate-600 mt-1 break-all">{JSON.stringify(h.outputs)}</p>
                {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EquipmentPack;
```

- [ ] **Step 2: Mount it in `App.tsx`**

Add the import at the top of `App.tsx`:

```tsx
import EquipmentPack from './packs/equipment/EquipmentPack';
```

Replace the Assets placeholder line:

```tsx
        {activeTab === AppTab.ASSETS && <div className="text-slate-400">Equipment Register — Task 9</div>}
```

with:

```tsx
        {activeTab === AppTab.ASSETS && <EquipmentPack />}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`
In the Assets tab: add "Chlorine Pump 1" → it appears in the list, the header picker switches to it, History shows "No saved results yet." Reload the page → the equipment is still there (IndexedDB persistence). Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add packs/equipment/EquipmentPack.tsx App.tsx
git commit -m "feat: equipment register pack with per-asset history"
```

---

### Task 10: Dosing pack (ported + Save to log)

Port the existing Calibration tab onto the platform using the dosing engine, and add "Save to log" writing against the active asset.

**Files:**
- Create: `packs/dosing/DosingPack.tsx`
- Modify: `App.tsx` (mount in Dosing tab)
- Reference (do not import): existing `components/CalibrationTab.tsx` for the original markup.

**Interfaces:**
- Consumes: `drawdownGph`, `dosingGph`, `DosingInputs` (Task 4); `logRepo`; `useActiveAsset`; existing `InfoCard` at `components/InfoCard.tsx`.
- Produces: `DosingPack` React component (no props).

- [ ] **Step 1: Create `packs/dosing/DosingPack.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/InfoCard';
import { drawdownGph, dosingGph } from '../../engines/dosing';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const DosingPack: React.FC = () => {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [drawdown, setDrawdown] = useState({ mL: 100, sec: 60 });
  const [dosing, setDosing] = useState({ mgd: 1, ppm: 2, density: 8.34 });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const gph = useMemo(() => drawdownGph(drawdown.mL, drawdown.sec), [drawdown]);
  const requiredGph = useMemo(() => dosingGph(dosing), [dosing]);

  const save = async () => {
    try {
      await logRepo.add({
        equipmentId: activeAssetId,
        kind: 'dosing',
        inputs: { drawdown, dosing },
        outputs: { drawdownGph: Number(gph.toFixed(2)), requiredGph: Number(requiredGph.toFixed(2)) },
      });
      await refreshEquipment();
      setMsg({ text: `Saved to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose what is on screen; surface a non-blocking notice.
      setMsg({ text: 'Save failed — result is still on screen, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Drawdown (Catch Column) Calibration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Volume Measured (mL)</label>
            <input type="number" value={drawdown.mL}
              onChange={(e) => setDrawdown({ ...drawdown, mL: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Time Elapsed (Seconds)</label>
            <input type="number" value={drawdown.sec}
              onChange={(e) => setDrawdown({ ...drawdown, sec: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="lg:col-span-2">
            <InfoCard title="Calculated Output" value={gph.toFixed(2)} unit="GPH" status="neutral"
              description="GPH = (Volume_mL / Time_sec) * 0.951" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Chemical Dosage to Pump Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Plant Flow (MGD)</label>
            <input type="number" value={dosing.mgd}
              onChange={(e) => setDosing({ ...dosing, mgd: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Target Dosage (PPM)</label>
            <input type="number" value={dosing.ppm}
              onChange={(e) => setDosing({ ...dosing, ppm: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Chem Density (lb/gal)</label>
            <input type="number" value={dosing.density}
              onChange={(e) => setDosing({ ...dosing, density: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div>
            <InfoCard title="Required Pump Rate" value={requiredGph.toFixed(2)} unit="GPH" status="neutral"
              description="GPH = (MGD * PPM * 8.34) / (Density * 24)" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors">
          Save to log{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
};

export default DosingPack;
```

- [ ] **Step 2: Mount it in `App.tsx`**

Add import:

```tsx
import DosingPack from './packs/dosing/DosingPack';
```

Replace the Dosing placeholder line with:

```tsx
        {activeTab === AppTab.DOSING && <DosingPack />}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`. Select an asset in the header. On the Dosing tab, confirm the two calculated values match the old app (100 mL / 60 s → 1.59 GPH; 1 MGD / 2 PPM / 8.34 → 0.08 GPH). Click "Save to log" → confirmation shows; switch to Assets tab → the entry appears under that asset's History. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add packs/dosing/DosingPack.tsx App.tsx
git commit -m "feat: dosing pack using engine, with save-to-log"
```

---

### Task 11: Hydraulics pack (Suction + Discharge merged, + Save to log)

Merge the old Suction and Discharge tabs into one Hydraulics pack driven by the hydraulics engine, with Save to log.

**Files:**
- Create: `packs/hydraulics/HydraulicsPack.tsx`
- Modify: `App.tsx` (mount in Hydraulics tab)
- Reference (do not import): existing `components/SuctionTab.tsx`, `components/DischargeTab.tsx`.

**Interfaces:**
- Consumes: `vacuumDemand`, `dischargePerformance`, `SuctionInputs`, `DischargeInputs` (Task 3); `logRepo`; `useActiveAsset`; `InfoCard`.
- Produces: `HydraulicsPack` React component (no props).

- [ ] **Step 1: Create `packs/hydraulics/HydraulicsPack.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/InfoCard';
import { vacuumDemand, dischargePerformance } from '../../engines/hydraulics';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const numField = (label: string, name: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: string) => (
  <div className="space-y-1" key={name}>
    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
    <input type="number" name={name} step={step} value={value} onChange={onChange}
      className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-blue-500" />
  </div>
);

const HydraulicsPack: React.FC = () => {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [suction, setSuction] = useState({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 });
  const [discharge, setDischarge] = useState({ Q_set: 50, P_d: 150 });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const onSuction = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSuction((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const onDischarge = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDischarge((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const suctionResult = useMemo(() => vacuumDemand(suction), [suction]);
  const dischargeResult = useMemo(() => dischargePerformance(discharge), [discharge]);

  const save = async () => {
    try {
      await logRepo.add({
        equipmentId: activeAssetId,
        kind: 'hydraulics',
        inputs: { suction, discharge },
        outputs: {
          Ha: Number(suctionResult.Ha.toFixed(2)),
          Ls: Number(suctionResult.Ls.toFixed(2)),
          vacuumTotal: Number(suctionResult.total.value.toFixed(2)),
          vacuumStatus: suctionResult.total.status,
          peakFlow: Number(dischargeResult.peakFlow.toFixed(2)),
          actualFlow: Number(dischargeResult.actualFlow.toFixed(2)),
          deratingLossPercent: Number(dischargeResult.deratingLossPercent.toFixed(1)),
        },
      });
      await refreshEquipment();
      setMsg({ text: `Saved to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose what is on screen; surface a non-blocking notice.
      setMsg({ text: 'Save failed — result is still on screen, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Suction &amp; Acceleration Head</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {numField('Pipe Length (L, ft)', 'L', suction.L, onSuction)}
          {numField('Pump Speed (N, SPM)', 'N', suction.N, onSuction)}
          {numField('Flow Rate (Q, GPH)', 'Q', suction.Q, onSuction)}
          {numField('Specific Gravity (SG)', 'SG', suction.SG, onSuction, '0.1')}
          {numField('Pipe Inner Diameter (D, in)', 'D', suction.D, onSuction, '0.01')}
          {numField('Static Lift (H_lift, ft)', 'H_lift', suction.H_lift, onSuction)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Acceleration Head (Ha)" value={suctionResult.Ha.toFixed(2)} unit="PSI"
            description="Pressure loss from fluid inertia at stroke start." />
          <InfoCard title="Static Lift Loss (Ls)" value={suctionResult.Ls.toFixed(2)} unit="PSI"
            description="Loss due to vertical height difference." />
          <InfoCard title="Total Vacuum Demand" value={suctionResult.total.value.toFixed(2)} unit="PSI"
            status={suctionResult.total.status} description={suctionResult.total.message} />
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Discharge &amp; Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {numField('Set Flow Rate (GPH)', 'Q_set', discharge.Q_set, onDischarge)}
          {numField('System Discharge Pressure (PSI)', 'P_d', discharge.P_d, onDischarge)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Calculated Peak Flow" value={dischargeResult.peakFlow.toFixed(2)} unit="GPH"
            description="Size piping/relief for this instantaneous peak, not the average." />
          <InfoCard title="Back Pressure Status" value={discharge.P_d} unit="PSI"
            status={dischargeResult.backPressure.status} description={dischargeResult.backPressure.message} />
          <InfoCard title="Estimated Actual Flow" value={dischargeResult.actualFlow.toFixed(2)} unit="GPH"
            status={dischargeResult.deratingLossPercent > 0 ? 'warning' : 'pass'}
            description={`Includes ${dischargeResult.deratingLossPercent.toFixed(1)}% high-pressure derating loss.`} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors">
          Save to log{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
};

export default HydraulicsPack;
```

- [ ] **Step 2: Mount it in `App.tsx`**

Add import:

```tsx
import HydraulicsPack from './packs/hydraulics/HydraulicsPack';
```

Replace the Hydraulics placeholder line with:

```tsx
        {activeTab === AppTab.HYDRAULICS && <HydraulicsPack />}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`. Hydraulics tab: with defaults, Total Vacuum Demand shows ~16.43 PSI and a red FAIL badge (matches old Suction tab); Peak Flow ~157.08 GPH. Change D to 1.0 → status flips to PASS. Save to log → appears in Assets history. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add packs/hydraulics/HydraulicsPack.tsx App.tsx
git commit -m "feat: hydraulics pack merging suction + discharge, with save-to-log"
```

---

### Task 12: Troubleshooting pack (+ log the fix) and remove old components

Port the matrix into a pack that can log the chosen fix against the active asset, then delete the now-unused legacy tab components.

**Files:**
- Create: `packs/troubleshooting/TroubleshootingPack.tsx`
- Modify: `App.tsx` (mount in Troubleshooting tab)
- Modify: `components/InfoCard.tsx` (move to `components/ui/InfoCard.tsx`) — see step 1
- Delete: `components/SuctionTab.tsx`, `components/DischargeTab.tsx`, `components/CalibrationTab.tsx`, `components/TroubleshootingTab.tsx`

**Interfaces:**
- Consumes: `TROUBLESHOOTING_MATRIX` from `constants.ts`, `TroubleshootingEntry` from `types.ts`, `logRepo`, `useActiveAsset`.
- Produces: `TroubleshootingPack` React component (no props).

- [ ] **Step 1: Consolidate `InfoCard` under `components/ui/`**

Move the file:

```bash
git mv components/InfoCard.tsx components/ui/InfoCard.tsx
```

Update the two import paths that reference it:
- In `packs/dosing/DosingPack.tsx`, change `import InfoCard from '../../components/InfoCard';` to `import InfoCard from '../../components/ui/InfoCard';`
- In `packs/hydraulics/HydraulicsPack.tsx`, change `import InfoCard from '../../components/InfoCard';` to `import InfoCard from '../../components/ui/InfoCard';`

- [ ] **Step 2: Create `packs/troubleshooting/TroubleshootingPack.tsx`**

```tsx
import React, { useState } from 'react';
import { TROUBLESHOOTING_MATRIX } from '../../constants';
import { TroubleshootingEntry } from '../../types';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const TroubleshootingPack: React.FC = () => {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [selected, setSelected] = useState<TroubleshootingEntry | null>(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const items = TROUBLESHOOTING_MATRIX.filter(
    (i) =>
      i.symptom.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  );

  const logFix = async () => {
    if (!selected) return;
    try {
      await logRepo.add({
        equipmentId: activeAssetId,
        kind: 'troubleshoot',
        inputs: { symptom: selected.symptom, category: selected.category },
        outputs: { cause: selected.cause, recommendation: selected.recommendation },
      });
      await refreshEquipment();
      setMsg({ text: `Logged to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose the selection; surface a non-blocking notice.
      setMsg({ text: 'Log failed — selection kept, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <input
        type="text"
        placeholder="Search symptoms or categories (e.g. 'noise', 'prime')..."
        className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {items.map((item, idx) => (
            <button key={idx} onClick={() => setSelected(item)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.symptom === item.symptom ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
              }`}>
              <span className="text-xs font-bold uppercase text-blue-600">{item.category}</span>
              <p className="font-semibold text-slate-800">{item.symptom}</p>
            </button>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-slate-400">No symptoms found.</div>}
        </div>

        <div className="min-h-[300px]">
          {selected ? (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selected Symptom</h4>
                <p className="text-2xl font-bold text-slate-800">{selected.symptom}</p>
              </div>
              <div>
                <h5 className="text-red-600 font-bold uppercase text-sm mb-2">Primary Root Cause</h5>
                <div className="bg-white p-4 rounded-xl border border-red-100 text-slate-700">{selected.cause}</div>
              </div>
              <div>
                <h5 className="text-green-600 font-bold uppercase text-sm mb-2">Recommendation</h5>
                <div className="bg-white p-4 rounded-xl border border-green-100 text-slate-700">{selected.recommendation}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={logFix}
                  className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors">
                  Log this fix{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
                </button>
                {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-400">
              Select a symptom to view diagnostic steps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPack;
```

- [ ] **Step 3: Mount it and delete legacy components in `App.tsx`**

Add import:

```tsx
import TroubleshootingPack from './packs/troubleshooting/TroubleshootingPack';
```

Replace the Troubleshooting placeholder line with:

```tsx
        {activeTab === AppTab.TROUBLESHOOTING && <TroubleshootingPack />}
```

- [ ] **Step 4: Delete the legacy tab components**

```bash
git rm components/SuctionTab.tsx components/DischargeTab.tsx components/CalibrationTab.tsx components/TroubleshootingTab.tsx
```

- [ ] **Step 5: Verify build, tests, and app**

Run: `npm run build`
Expected: build succeeds with no unresolved imports.

Run: `npm test`
Expected: all engine + repo + state tests pass.

Run: `npm run dev` → Troubleshooting tab: search "noise", select a symptom, click "Log this fix", confirm it lands in the active asset's History on the Assets tab. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add App.tsx components/ui/InfoCard.tsx packs/troubleshooting/TroubleshootingPack.tsx packs/dosing/DosingPack.tsx packs/hydraulics/HydraulicsPack.tsx
git commit -m "feat: troubleshooting pack with logged fixes; retire legacy tab components"
```

---

### Task 13: PWA — installable + offline

Add the web app manifest, icons, and a Workbox service worker that precaches the app shell, then verify the app loads with the network disabled.

**Files:**
- Modify: `package.json` (dep + icon-gen script)
- Modify: `vite.config.ts` (add `VitePWA`)
- Create: `public/icon.svg`
- Create: `scripts/gen-icons.mjs`
- Create (generated): `public/pwa-192.png`, `public/pwa-512.png`

**Interfaces:**
- Consumes: the built app from prior tasks.
- Produces: a service worker + manifest; app installable and offline-capable.

- [ ] **Step 1: Install the PWA plugin + an icon rasterizer**

```bash
npm install -D vite-plugin-pwa sharp
```

- [ ] **Step 2: Create `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#2563eb"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="bold" font-size="220" fill="#ffffff">CB</text>
</svg>
```

- [ ] **Step 3: Create `scripts/gen-icons.mjs`**

```js
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(dir, '..', 'public', 'icon.svg'));

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(join(dir, '..', 'public', `pwa-${size}.png`));
  console.log(`generated pwa-${size}.png`);
}
```

- [ ] **Step 4: Add an `icons` script and run it**

Add to `package.json` `"scripts"`:

```json
"icons": "node scripts/gen-icons.mjs"
```

Run: `npm run icons`
Expected: `public/pwa-192.png` and `public/pwa-512.png` are created.

- [ ] **Step 5: Add `VitePWA` to `vite.config.ts`**

```ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Centrac-B-v2/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Centrac B Field Operator',
        short_name: 'Centrac B',
        description: 'Offline plant-operator toolkit for Centrac B metering pumps',
        start_url: '/Centrac-B-v2/',
        scope: '/Centrac-B-v2/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#2563eb',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 6: Build and verify the service worker + manifest are emitted**

Run: `npm run build`
Expected: build output lists `dist/sw.js` and `dist/manifest.webmanifest` (or `dist/Centrac-B-v2/...` under base).

Run: `grep -rl "precache" dist`
Expected: `sw.js` appears (Workbox precache manifest generated).

- [ ] **Step 7: Verify offline behavior in a preview**

Run: `npm run preview`
Open the served URL in Chrome. In DevTools → Application → Service Workers, confirm the worker is activated. Then DevTools → Network → check "Offline" and reload. Expected: the app still loads and all four tabs work; equipment and history are intact (IndexedDB). Uncheck Offline and stop preview.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.ts public/icon.svg public/pwa-192.png public/pwa-512.png scripts/gen-icons.mjs
git commit -m "feat: installable offline PWA (manifest + Workbox service worker)"
```

---

## Task Dependency Summary

```
1 (offline assets) ─┐
2 (vitest) ─────────┤
3 (hydraulics eng) ─┤
4 (dosing eng) ─────┤
5 (db + equip repo)─┤
6 (log repo) ───────┤
7 (context/picker) ─┤
8 (app shell) ──────┼─► 9 (equipment pack)
                    │    ├─► 10 (dosing pack)
                    │    ├─► 11 (hydraulics pack)
                    │    └─► 12 (troubleshooting pack + cleanup)
                    └──────► 13 (PWA)  [after app is stable]
```

Tasks 1–7 are largely independent and can be done in any order; 8 depends on 7; 9–12 depend on 8 and their respective engines/repos; 13 should be last.
