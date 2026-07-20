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
    await new Promise((r) => setTimeout(r, 5));
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

  describe('lastMaintenanceByTask', () => {
    it('returns the newest of two entries for the same taskId', async () => {
      const a = await logRepo.add({
        equipmentId: 'eq-1',
        kind: 'maintenance',
        inputs: { taskId: 'pm-x' },
        outputs: {},
      });
      await new Promise((r) => setTimeout(r, 5));
      const b = await logRepo.add({
        equipmentId: 'eq-1',
        kind: 'maintenance',
        inputs: { taskId: 'pm-x' },
        outputs: {},
      });
      const result = await logRepo.lastMaintenanceByTask('pm-x', 'eq-1');
      expect(result?.id).toBe(b.id);
      expect(a.id).not.toBe(b.id);
    });

    it('returns undefined for an unknown taskId', async () => {
      await logRepo.add({
        equipmentId: 'eq-1',
        kind: 'maintenance',
        inputs: { taskId: 'pm-x' },
        outputs: {},
      });
      const result = await logRepo.lastMaintenanceByTask('pm-unknown', 'eq-1');
      expect(result).toBeUndefined();
    });

    it('scopes by equipmentId', async () => {
      await logRepo.add({
        equipmentId: 'eq-1',
        kind: 'maintenance',
        inputs: { taskId: 'pm-x' },
        outputs: {},
      });
      const facility = await logRepo.add({
        equipmentId: null,
        kind: 'maintenance',
        inputs: { taskId: 'pm-x' },
        outputs: {},
      });
      const nullResult = await logRepo.lastMaintenanceByTask('pm-x', null);
      expect(nullResult?.id).toBe(facility.id);
      const eqResult = await logRepo.lastMaintenanceByTask('pm-x', 'eq-2');
      expect(eqResult).toBeUndefined();
    });
  });
});
