import { describe, it, expect } from 'vitest';
import { drawdownGph, dosingGph } from './dosing';

describe('dosing engine', () => {
  it('converts drawdown volume/time to GPH', () => {
    expect(drawdownGph(100, 60)).toBeCloseTo(1.585, 3);
  });

  it('returns 0 GPH when time is 0 (guard)', () => {
    expect(drawdownGph(100, 0)).toBe(0);
  });

  it('converts plant flow + dosage to required pump GPH', () => {
    expect(dosingGph({ mgd: 1, ppm: 2, density: 8.34 })).toBeCloseTo(0.0833, 4);
  });

  it('returns 0 GPH when density is 0 (guard)', () => {
    expect(dosingGph({ mgd: 1, ppm: 2, density: 0 })).toBe(0);
  });
});
