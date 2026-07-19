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
