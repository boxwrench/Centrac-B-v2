import { describe, it, expect } from 'vitest';
import {
  basinVolumeGal,
  detentionTimeHr,
  surfaceOverflowRate,
  evaluateBasin,
} from './basin';

describe('basin hydraulics', () => {
  it('computes working volume in gallons', () => {
    expect(basinVolumeGal(20, 10, 8)).toBeCloseTo(11968.83, 2);
  });

  it('computes hydraulic detention time in hours', () => {
    expect(detentionTimeHr(11968.83, 50)).toBeCloseTo(3.9896, 3);
  });

  it('returns Infinity detention time at zero flow', () => {
    expect(detentionTimeHr(11968.83, 0)).toBe(Infinity);
  });

  it('computes surface overflow rate in gpd/ft^2', () => {
    expect(surfaceOverflowRate(50, 20, 10)).toBeCloseTo(360, 6);
  });

  it('passes with adequate freeboard', () => {
    const r = evaluateBasin({ length: 20, width: 10, waterDepth: 8, wallHeight: 10, Q_gpm: 50 });
    expect(r.freeboard.status).toBe('pass');
    expect(r.detentionTimeHr).toBeCloseTo(3.9896, 3);
  });

  it('warns when freeboard is below the minimum', () => {
    const r = evaluateBasin({ length: 20, width: 10, waterDepth: 9.5, wallHeight: 10, Q_gpm: 50 });
    expect(r.freeboard.status).toBe('warning');
  });

  it('fails when the operating level reaches the top of the wall', () => {
    const r = evaluateBasin({ length: 20, width: 10, waterDepth: 10, wallHeight: 10, Q_gpm: 50 });
    expect(r.freeboard.status).toBe('fail');
  });
});
