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

  async remove(id: string): Promise<void> {
    await db.logEntries.delete(id);
  },

  async lastMaintenanceByTask(taskId: string, equipmentId: string | null): Promise<LogEntry | undefined> {
    const all = await this.listAll();
    return all.find(
      (e) => e.kind === 'maintenance' && e.inputs.taskId === taskId && e.equipmentId === equipmentId
    );
  },
};
