import { PM_CHECKLIST } from '../constants';
import { Equipment, LogEntry, PmTask } from '../types';

/** YYYY-MM-DD in LOCAL time (not UTC) — matters for correctness across night shifts. */
export function localDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface CompiledReport {
  date: string;
  rounds: {
    completed: Array<{ task: PmTask; entry: LogEntry }>;
    skipped: PmTask[];
  };
  checks: LogEntry[];
  calibrations: LogEntry[];
  issues: LogEntry[];
}

/** Facility-wide tasks plus tasks whose assetTypes intersect the equipment register, in PM_CHECKLIST order. */
export function visibleTasks(equipment: Equipment[]): PmTask[] {
  const presentTypes = new Set(equipment.map(e => e.type));
  return PM_CHECKLIST.filter(t => {
    if (!t.assetTypes || t.assetTypes.length === 0) return true;
    return t.assetTypes.some(at => presentTypes.has(at));
  });
}

/** Compile a report by querying logs for a given date, grouped by kind, with skipped-task detection. */
export function compileReport(
  logs: LogEntry[],
  equipment: Equipment[],
  date: string,
  excludedIds: string[],
): CompiledReport {
  const excluded = new Set(excludedIds);
  const dayLogs = logs.filter(e => localDateKey(e.timestamp) === date && !excluded.has(e.id));

  const tasksById = new Map(PM_CHECKLIST.map(t => [t.id, t]));

  const completed: Array<{ task: PmTask; entry: LogEntry }> = [];
  const checks: LogEntry[] = [];
  const calibrations: LogEntry[] = [];
  const issues: LogEntry[] = [];

  for (const entry of dayLogs) {
    switch (entry.kind) {
      case 'maintenance': {
        const taskId = entry.inputs.taskId;
        if (typeof taskId === 'string') {
          const task = tasksById.get(taskId);
          if (task) completed.push({ task, entry });
        }
        break;
      }
      case 'hydraulics':
        checks.push(entry);
        break;
      case 'dosing':
        calibrations.push(entry);
        break;
      case 'troubleshoot':
        issues.push(entry);
        break;
    }
  }

  const completedIds = new Set(completed.map(c => c.task.id));
  const skipped = visibleTasks(equipment).filter(t => !completedIds.has(t.id));

  return {
    date,
    rounds: { completed, skipped },
    checks,
    calibrations,
    issues,
  };
}
