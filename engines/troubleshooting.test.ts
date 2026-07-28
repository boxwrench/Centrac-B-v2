import { describe, it, expect } from 'vitest';
import { TROUBLESHOOTING_MATRIX } from '../constants';
import { EQUIPMENT_TYPES } from '../types';

describe('TROUBLESHOOTING_MATRIX', () => {
  it('has at least 45 entries', () => {
    expect(TROUBLESHOOTING_MATRIX.length).toBeGreaterThanOrEqual(45);
  });

  it('every entry with assetTypes only references valid EquipmentType values', () => {
    const validTypes = new Set(EQUIPMENT_TYPES);
    const offenders = TROUBLESHOOTING_MATRIX.filter(
      (e) => e.assetTypes && e.assetTypes.some((t) => !validTypes.has(t))
    );
    expect(offenders).toEqual([]);
  });

  it('every entry with severity "urgent" has non-empty escalate text', () => {
    const urgentWithoutEscalate = TROUBLESHOOTING_MATRIX.filter(
      (e) => e.severity === 'urgent' && (!e.escalate || e.escalate.trim().length === 0)
    );
    expect(urgentWithoutEscalate).toEqual([]);
  });

  it('has at least one urgent entry (non-vacuous check)', () => {
    const urgentEntries = TROUBLESHOOTING_MATRIX.filter((e) => e.severity === 'urgent');
    expect(urgentEntries.length).toBeGreaterThan(0);
  });

  it('every entry with a severity uses a valid severity value', () => {
    const validSeverities = new Set(['monitor', 'action', 'urgent']);
    const offenders = TROUBLESHOOTING_MATRIX.filter(
      (e) => e.severity !== undefined && !validSeverities.has(e.severity)
    );
    expect(offenders).toEqual([]);
  });
});
