import { describe, it, expect } from 'vitest';
import { compileReport } from './report';
import { Equipment, LogEntry } from '../types';

// This test round-trips the EXACT save shape TaskForm.tsx writes for a structured
// maintenance task (see packs/maintenance/TaskForm.tsx handleSave) through the
// report compiler, plus a hydraulics check and a troubleshoot entry saved via
// their own packs' shapes — proving the Task-4 save contract survives Task-6 compilation.

const equipment: Equipment[] = [{ id: 'eq-1', tag: 'MP-1', type: 'metering_pump', createdAt: 0 }];

const date = '2026-07-20';
const timestamp = new Date(2026, 6, 20, 10, 0).getTime();

const maintenanceEntry: LogEntry = {
  id: 'log-maint-cl',
  equipmentId: null,
  kind: 'maintenance',
  inputs: {
    taskId: 'pm-cl-analyzers',
    label: 'Chlorine Analyzer Verification',
    values: { analyzerMgL: 2.1, grabMgL: 2.0 },
  },
  outputs: {
    done: true,
    date,
    readings: {
      analyzerMgL: { value: 2.1, status: 'pass' },
      grabMgL: { value: 2.0, status: 'pass' },
    },
    worstStatus: 'pass',
  },
  timestamp,
};

const hydraulicsEntry: LogEntry = {
  id: 'log-hydraulics-mp1',
  equipmentId: 'eq-1',
  kind: 'hydraulics',
  inputs: { drawdown: { mL: 100, sec: 60 }, dosing: { mgd: 1, ppm: 2, density: 8.34 } },
  outputs: { drawdownGph: 1.585, requiredGph: 1.0 },
  timestamp,
};

const troubleshootEntry: LogEntry = {
  id: 'log-troubleshoot-mp1',
  equipmentId: 'eq-1',
  kind: 'troubleshoot',
  inputs: { symptom: 'Pump short-cycling', category: 'Hydraulics' },
  outputs: { cause: 'Worn check valve', recommendation: 'Replace check valve' },
  timestamp,
};

describe('report compiler integration: TaskForm save shape', () => {
  const report = compileReport(
    [maintenanceEntry, hydraulicsEntry, troubleshootEntry],
    equipment,
    date,
    [],
  );

  it('matches the maintenance entry to its PmTask in rounds.completed', () => {
    expect(report.rounds.completed).toHaveLength(1);
    expect(report.rounds.completed[0].task.id).toBe('pm-cl-analyzers');
    expect(report.rounds.completed[0].entry.id).toBe('log-maint-cl');
  });

  it('keeps the readings from the TaskForm save shape intact', () => {
    const { entry } = report.rounds.completed[0];
    const outputs = entry.outputs as { readings: Record<string, { value: number; status: string }> };
    expect(outputs.readings.analyzerMgL).toEqual({ value: 2.1, status: 'pass' });
    expect(outputs.readings.grabMgL).toEqual({ value: 2.0, status: 'pass' });
  });

  it('routes the hydraulics entry into checks', () => {
    expect(report.checks).toHaveLength(1);
    expect(report.checks[0].id).toBe('log-hydraulics-mp1');
  });

  it('routes the troubleshoot entry into issues', () => {
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0].id).toBe('log-troubleshoot-mp1');
  });
});
