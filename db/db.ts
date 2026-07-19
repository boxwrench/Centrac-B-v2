import Dexie, { Table } from 'dexie';
import { Equipment, LogEntry } from '../types';

export class CentracDB extends Dexie {
  equipment!: Table<Equipment, string>;
  logEntries!: Table<LogEntry, string>;

  constructor() {
    super('centrac-b');
    // v1 — initial schema. Bump version + add a new .version() block to migrate.
    this.version(1).stores({
      equipment: 'id, tag, type, createdAt',
      logEntries: 'id, equipmentId, kind, timestamp',
    });
  }
}

export const db = new CentracDB();
