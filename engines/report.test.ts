import { describe, it, expect } from 'vitest';
import { localDateKey, visibleTasks, compileReport } from './report';
import { PM_CHECKLIST } from '../constants';
import { Equipment, LogEntry } from '../types';

const equipment: Equipment[] = [
  { id: 'eq-1', tag: 'MP-1', type: 'metering_pump', createdAt: 0 },
  { id: 'eq-2', tag: 'TK-1', type: 'tank', createdAt: 0 },
];

const day1 = new Date(2026, 6, 20, 9, 0).getTime();
const day2 = new Date(2026, 6, 19, 9, 0).getTime();

const logs: LogEntry[] = [
  // maintenance entry on target date (facility task)
  {
    id: 'log-maint-1',
    equipmentId: null,
    kind: 'maintenance',
    inputs: { taskId: 'pm-flow-meter' },
    outputs: {},
    timestamp: day1,
  },
  // maintenance entry on the OTHER date
  {
    id: 'log-maint-2',
    equipmentId: null,
    kind: 'maintenance',
    inputs: { taskId: 'pm-storage-levels' },
    outputs: {},
    timestamp: day2,
  },
  // hydraulics check on target date
  {
    id: 'log-hydraulics-1',
    equipmentId: 'eq-1',
    kind: 'hydraulics',
    inputs: {},
    outputs: {},
    timestamp: day1,
  },
  // dosing calibration on target date
  {
    id: 'log-dosing-1',
    equipmentId: 'eq-1',
    kind: 'dosing',
    inputs: {},
    outputs: {},
    timestamp: day1,
  },
  // troubleshoot issue on target date
  {
    id: 'log-troubleshoot-1',
    equipmentId: 'eq-2',
    kind: 'troubleshoot',
    inputs: {},
    outputs: {},
    timestamp: day1,
  },
  // maintenance entry on target date, but excluded by id
  {
    id: 'log-maint-excluded',
    equipmentId: null,
    kind: 'maintenance',
    inputs: { taskId: 'pm-security' },
    outputs: {},
    timestamp: day1,
  },
];

describe('localDateKey', () => {
  it('returns YYYY-MM-DD in local time (not UTC)', () => {
    const ts = new Date(2026, 6, 20, 23, 30).getTime();
    expect(localDateKey(ts)).toBe('2026-07-20');
  });
});

describe('visibleTasks', () => {
  const tasks = visibleTasks(equipment);

  it('includes facility-wide tasks', () => {
    expect(tasks.some(t => t.id === 'pm-flow-meter')).toBe(true);
  });

  it('includes metering_pump tasks', () => {
    expect(tasks.some(t => t.id === 'pm-feed-pump-inspect')).toBe(true);
  });

  it('includes tank tasks', () => {
    expect(tasks.some(t => t.id === 'pm-storage-levels')).toBe(true);
  });

  it('excludes sump_pump-only tasks (no sump pump in register)', () => {
    expect(tasks.some(t => t.id === 'pm-sump-check')).toBe(false);
  });

  it('excludes centrifugal_pump-only tasks (no centrifugal pump in register)', () => {
    expect(tasks.some(t => t.id === 'pm-booster-inspect')).toBe(false);
  });

  it('preserves PM_CHECKLIST order', () => {
    const ids = tasks.map(t => t.id);
    const expectedOrder = PM_CHECKLIST.filter(t => ids.includes(t.id)).map(t => t.id);
    expect(ids).toEqual(expectedOrder);
  });
});

describe('compileReport', () => {
  const report = compileReport(logs, equipment, '2026-07-20', ['log-maint-excluded']);

  it('filters logs to the target date', () => {
    const allIds = [
      ...report.rounds.completed.map(r => r.entry.id),
      ...report.checks.map(e => e.id),
      ...report.calibrations.map(e => e.id),
      ...report.issues.map(e => e.id),
    ];
    expect(allIds).not.toContain('log-maint-2');
  });

  it('excludes entries in excludedIds', () => {
    const allIds = [
      ...report.rounds.completed.map(r => r.entry.id),
      ...report.checks.map(e => e.id),
      ...report.calibrations.map(e => e.id),
      ...report.issues.map(e => e.id),
    ];
    expect(allIds).not.toContain('log-maint-excluded');
  });

  it('groups hydraulics into checks', () => {
    expect(report.checks.length).toBe(1);
    expect(report.checks[0].id).toBe('log-hydraulics-1');
  });

  it('groups dosing into calibrations', () => {
    expect(report.calibrations.length).toBe(1);
    expect(report.calibrations[0].id).toBe('log-dosing-1');
  });

  it('groups troubleshoot into issues', () => {
    expect(report.issues.length).toBe(1);
    expect(report.issues[0].id).toBe('log-troubleshoot-1');
  });

  it('groups maintenance into rounds.completed, matched to PM_CHECKLIST', () => {
    expect(report.rounds.completed.length).toBe(1);
    expect(report.rounds.completed[0].task.id).toBe('pm-flow-meter');
    expect(report.rounds.completed[0].entry.id).toBe('log-maint-1');
  });

  it('skipped = visibleTasks minus completed task ids', () => {
    const visible = visibleTasks(equipment);
    const completedIds = new Set(report.rounds.completed.map(r => r.task.id));
    const expectedSkipped = visible.filter(t => !completedIds.has(t.id));
    expect(report.rounds.skipped.map(t => t.id)).toEqual(expectedSkipped.map(t => t.id));
    expect(report.rounds.skipped.some(t => t.id === 'pm-flow-meter')).toBe(false);
  });

  it('sets the date field', () => {
    expect(report.date).toBe('2026-07-20');
  });
});
