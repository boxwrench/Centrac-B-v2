import { describe, it, expect } from 'vitest';
import {
  accelerationHead,
  staticLiftLoss,
  vacuumDemand,
  peakFlow,
  deratingLossPercent,
  dischargePerformance,
} from './hydraulics';

describe('suction hydraulics', () => {
  it('computes acceleration head from API 675 formula', () => {
    expect(accelerationHead({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 }))
      .toBeCloseTo(15.57, 2);
  });

  it('returns 0 acceleration head when pipe diameter is 0 (guard)', () => {
    expect(accelerationHead({ L: 10, N: 144, Q: 50, SG: 1, D: 0, H_lift: 2 })).toBe(0);
  });

  it('computes static lift loss', () => {
    expect(staticLiftLoss(2, 1)).toBeCloseTo(0.866, 3);
  });

  it('fails when total vacuum demand exceeds the 12 PSI limit', () => {
    const r = vacuumDemand({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 });
    expect(r.total.status).toBe('fail');
    expect(r.total.value).toBeCloseTo(16.43, 2);
  });

  it('passes when total vacuum demand is within limits', () => {
    const r = vacuumDemand({ L: 2, N: 60, Q: 10, SG: 1, D: 1, H_lift: 1 });
    expect(r.total.status).toBe('pass');
  });
});

describe('discharge hydraulics', () => {
  it('computes sinusoidal peak flow', () => {
    expect(peakFlow(50)).toBeCloseTo(157.08, 2);
  });

  it('has no derating at or below 200 PSI', () => {
    expect(deratingLossPercent(200)).toBe(0);
  });

  it('derates 0.8% per 100 PSI above 200 PSI', () => {
    expect(deratingLossPercent(300)).toBeCloseTo(0.8, 3);
    expect(deratingLossPercent(400)).toBeCloseTo(1.6, 3);
  });

  it('flags low back pressure below 35 PSI as a warning', () => {
    expect(dischargePerformance({ Q_set: 50, P_d: 20 }).backPressure.status).toBe('warning');
    expect(dischargePerformance({ Q_set: 50, P_d: 150 }).backPressure.status).toBe('pass');
  });

  it('reduces actual flow by the derating loss', () => {
    expect(dischargePerformance({ Q_set: 50, P_d: 300 }).actualFlow).toBeCloseTo(49.6, 2);
  });
});
