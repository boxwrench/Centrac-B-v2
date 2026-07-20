import Dexie, { Table } from 'dexie';
import { Equipment, LogEntry, ReportRecord } from '../types';

export class CentracDB extends Dexie {
  equipment!: Table<Equipment, string>;
  logEntries!: Table<LogEntry, string>;
  reports!: Table<ReportRecord, string>;

  constructor() {
    super('centrac-b');
    // v1 — initial schema. Bump version + add a new .version() block to migrate.
    this.version(1).stores({
      equipment: 'id, tag, type, createdAt',
      logEntries: 'id, equipmentId, kind, timestamp',
    });
    // v2 — adds reports table (per-day review state). v1 tables re-listed unchanged.
    this.version(2).stores({
      equipment: 'id, tag, type, createdAt',
      logEntries: 'id, equipmentId, kind, timestamp',
      reports: 'date',
    });
  }
}

export const db = new CentracDB();
