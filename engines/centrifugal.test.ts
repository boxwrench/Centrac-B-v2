import { describe, it, expect } from 'vitest';
import {
  totalDynamicHead,
  npshAvailable,
  waterHorsepower,
  brakeHorsepower,
  evaluateCentrifugal,
} from './centrifugal';

describe('centrifugal pump hydraulics', () => {
  it('computes total dynamic head from suction/discharge gauges', () => {
    expect(totalDynamicHead(60, 5, 1)).toBeCloseTo(127.05, 2);
  });

  it('scales TDH inversely with specific gravity', () => {
    expect(totalDynamicHead(60, 5, 1.2)).toBeCloseTo(105.875, 2);
  });

  it('computes NPSH available from the suction gauge reading', () => {
    expect(npshAvailable(5, 1)).toBeCloseTo(44.6754, 3);
  });

  it('computes water and brake horsepower', () => {
    const whp = waterHorsepower(100, 127.05, 1);
    expect(whp).toBeCloseTo(3.2083, 3);
    expect(brakeHorsepower(whp, 70)).toBeCloseTo(4.5833, 3);
  });

  it('passes when NPSH margin is comfortable', () => {
    const r = evaluateCentrifugal({ Q: 100, P_suction: 5, P_discharge: 60, SG: 1, NPSHr: 8, efficiency: 70 });
    expect(r.npshMargin.status).toBe('pass');
    expect(r.tdh).toBeCloseTo(127.05, 2);
  });

  it('flags cavitation when NPSHa drops below NPSHr', () => {
    const r = evaluateCentrifugal({ Q: 100, P_suction: -13, P_discharge: 60, SG: 1, NPSHr: 10, efficiency: 70 });
    expect(r.npshMargin.status).toBe('fail');
    expect(r.npshMargin.value).toBeLessThan(0);
  });

  it('warns when NPSH margin is thin (below the preferred fraction of NPSHr)', () => {
    const r = evaluateCentrifugal({ Q: 100, P_suction: 5, P_discharge: 60, SG: 1, NPSHr: 42, efficiency: 70 });
    expect(r.npshMargin.status).toBe('warning');
  });

  it('guards against zero specific gravity', () => {
    expect(totalDynamicHead(60, 5, 0)).toBe(0);
    expect(npshAvailable(5, 0)).toBe(0);
  });
});
