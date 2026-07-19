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
    const entries = await db.logEntries.orderBy('timestamp').toArray();
    return entries.reverse();
  },

  async listByEquipment(equipmentId: string | null): Promise<LogEntry[]> {
    const all = await this.listAll();
    return all.filter((e) => e.equipmentId === equipmentId);
  },
};
