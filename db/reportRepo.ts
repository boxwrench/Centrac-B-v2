import { db } from './db';
import { ReportRecord } from '../types';

export const reportRepo = {
  async get(date: string): Promise<ReportRecord | undefined> {
    return db.reports.get(date);
  },

  async upsert(record: ReportRecord): Promise<void> {
    await db.reports.put(record);
  },
};
