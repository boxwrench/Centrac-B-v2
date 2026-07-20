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
