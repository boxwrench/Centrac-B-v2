import { describe, it, expect } from 'vitest';
import {
  readingStatus,
  usageSince,
  daysOfSupply,
  analyzerDrift,
  catchVerdict,
  specificCapacity,
  worstStatus,
} from './rounds';
import { PmField } from '../types';

describe('readingStatus', () => {
  const band: PmField = { id: 'r', type: 'reading', label: 'Residual', min: 0.2, max: 4.0 };

  it('pass within band', () => {
    expect(readingStatus(2.1, band)).toBe('pass');
  });

  it('fail below min', () => {
    expect(readingStatus(0.1, band)).toBe('fail');
  });

  it('fail above max', () => {
    expect(readingStatus(4.5, band)).toBe('fail');
  });

  it('warn-only band: above warnHigh is warning', () => {
    const warnBand: PmField = { id: 'w', type: 'reading', label: 'Temp', warnHigh: 8 };
    expect(readingStatus(9, warnBand)).toBe('warning');
  });

  it('warn-only band: at/below warnHigh is pass', () => {
    const warnBand: PmField = { id: 'w', type: 'reading', label: 'Temp', warnHigh: 8 };
    expect(readingStatus(5, warnBand)).toBe('pass');
  });

  it('no bounds at all is neutral', () => {
    const noBand: PmField = { id: 'n', type: 'reading', label: 'Note field' };
    expect(readingStatus(5, noBand)).toBe('neutral');
  });
});

describe('usageSince', () => {
  it('computes gallons used', () => {
    expect(usageSince(500, 480)).toBe(20);
  });

  it('clamps at 0 when level rose without a logged addition', () => {
    expect(usageSince(480, 500)).toBe(0);
  });

  it('adds logged chemical addition to usage', () => {
    expect(usageSince(500, 480, 100)).toBe(120);
  });
});

describe('daysOfSupply', () => {
  it('computes days remaining', () => {
    expect(daysOfSupply(100, 20)).toBe(5);
  });

  it('is Infinity when average daily use is zero', () => {
    expect(daysOfSupply(100, 0)).toBe(Infinity);
  });
});

describe('analyzerDrift', () => {
  it('pass when within drift limit', () => {
    expect(analyzerDrift(2.1, 2.0).status).toBe('pass');
  });

  it('warning when exceeding drift limit', () => {
    expect(analyzerDrift(2.5, 2.0).status).toBe('warning');
  });
});

describe('catchVerdict', () => {
  it('pass when within tolerance', () => {
    expect(catchVerdict(4.9, 5.0).status).toBe('pass');
  });

  it('fail when exceeding tolerance, value is % error', () => {
    const r = catchVerdict(4.0, 5.0);
    expect(r.value).toBeCloseTo(20, 5);
    expect(r.status).toBe('fail');
  });

  it('warning when no expected rate given', () => {
    expect(catchVerdict(5.0, 0).status).toBe('warning');
  });
});

describe('specificCapacity', () => {
  it('computes gpm per ft of drawdown', () => {
    expect(specificCapacity(100, 20)).toBe(5);
  });

  it('is 0 when drawdown is 0', () => {
    expect(specificCapacity(100, 0)).toBe(0);
  });
});

describe('worstStatus', () => {
  it('warning beats pass', () => {
    expect(worstStatus(['pass', 'warning', 'pass'])).toBe('warning');
  });

  it('fail beats warning', () => {
    expect(worstStatus(['warning', 'fail'])).toBe('fail');
  });

  it('empty array is neutral', () => {
    expect(worstStatus([])).toBe('neutral');
  });
});
