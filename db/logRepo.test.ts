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
