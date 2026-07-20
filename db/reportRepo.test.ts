import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { reportRepo } from './reportRepo';

beforeEach(async () => {
  await db.reports.clear();
});

describe('reportRepo', () => {
  it('returns undefined for a missing date', async () => {
    const result = await reportRepo.get('2026-07-20');
    expect(result).toBeUndefined();
  });

  it('upserts a record then gets it back', async () => {
    await reportRepo.upsert({
      date: '2026-07-20',
      operator: 'jdoe',
      remarks: 'all normal',
      excludedLogIds: ['log-1'],
    });
    const result = await reportRepo.get('2026-07-20');
    expect(result).toEqual({
      date: '2026-07-20',
      operator: 'jdoe',
      remarks: 'all normal',
      excludedLogIds: ['log-1'],
    });
  });

  it('overwrites the record on a second upsert for the same date', async () => {
    await reportRepo.upsert({
      date: '2026-07-20',
      operator: 'jdoe',
      remarks: 'all normal',
      excludedLogIds: ['log-1'],
    });
    await reportRepo.upsert({
      date: '2026-07-20',
      operator: 'asmith',
      remarks: 'revised remarks',
      excludedLogIds: ['log-2', 'log-3'],
    });
    const result = await reportRepo.get('2026-07-20');
    expect(result).toEqual({
      date: '2026-07-20',
      operator: 'asmith',
      remarks: 'revised remarks',
      excludedLogIds: ['log-2', 'log-3'],
    });
  });
});
