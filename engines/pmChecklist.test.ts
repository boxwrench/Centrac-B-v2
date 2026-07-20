import { describe, it, expect } from 'vitest';
import { PM_CHECKLIST } from '../constants';
import { EQUIPMENT_TYPES } from '../types';

const RECORD_TASK_FIELD_IDS: Record<string, string[]> = {
  'pm-flow-meter': ['meterReading'],
  'pm-chem-tanks-usage': ['levelGal', 'addedGal', 'chemical'],
  'pm-chem-usage-other': ['amountUsed', 'chemical'],
  'pm-storage-levels': ['levelFt', 'source'],
  'pm-chem-levels': ['levelGal', 'source'],
  'pm-cl-analyzers': ['analyzerMgL', 'grabMgL'],
};

describe('PM_CHECKLIST integrity', () => {
  it('has exactly 22 tasks', () => {
    expect(PM_CHECKLIST.length).toBe(22);
  });

  it('has unique task ids', () => {
    const ids = PM_CHECKLIST.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique field ids within each task', () => {
    for (const task of PM_CHECKLIST) {
      if (!task.fields) continue;
      const fieldIds = task.fields.map((f) => f.id);
      expect(new Set(fieldIds).size, `duplicate field ids in ${task.id}`).toBe(fieldIds.length);
    }
  });

  it('every assetTypes value is a known EquipmentType', () => {
    for (const task of PM_CHECKLIST) {
      if (!task.assetTypes) continue;
      for (const at of task.assetTypes) {
        expect(EQUIPMENT_TYPES, `${task.id} has unknown assetType ${at}`).toContain(at);
      }
    }
  });

  it.each(Object.entries(RECORD_TASK_FIELD_IDS))(
    '%s has the exact field ids %j',
    (taskId, expectedFieldIds) => {
      const task = PM_CHECKLIST.find((t) => t.id === taskId);
      expect(task, `task ${taskId} not found`).toBeDefined();
      expect(task!.fields, `task ${taskId} has no fields`).toBeDefined();
      const actualIds = task!.fields!.map((f) => f.id);
      expect(actualIds).toEqual(expectedFieldIds);
    }
  );

  it('every select field has at least 2 options', () => {
    for (const task of PM_CHECKLIST) {
      if (!task.fields) continue;
      for (const field of task.fields) {
        if (field.type === 'select') {
          expect(field.options, `${task.id}.${field.id} select field missing options`).toBeDefined();
          expect(field.options!.length, `${task.id}.${field.id} needs >=2 options`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('every reading field has a unit', () => {
    for (const task of PM_CHECKLIST) {
      if (!task.fields) continue;
      for (const field of task.fields) {
        if (field.type === 'reading') {
          expect(field.unit, `${task.id}.${field.id} reading field missing unit`).toBeTruthy();
        }
      }
    }
  });
});
