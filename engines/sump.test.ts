import { describe, it, expect } from 'vitest';
import { netPumpDownRate, pumpDownTime, fillTime, evaluateSump } from './sump';

describe('sump pump checks', () => {
  it('computes net pump-down rate', () => {
    expect(netPumpDownRate(50, 20)).toBe(30);
  });

  it('computes pump-down and fill times', () => {
    expect(pumpDownTime(100, 50, 20)).toBeCloseTo(3.3333, 3);
    expect(fillTime(100, 20)).toBe(5);
  });

  it('returns Infinity pump-down when inflow meets or exceeds capacity', () => {
    expect(pumpDownTime(100, 20, 25)).toBe(Infinity);
  });

  it('passes a well-sized, slow-cycling sump', () => {
    const r = evaluateSump({ Q_pump: 50, Q_in: 20, drawVolume: 100 });
    expect(r.capacity.status).toBe('pass');
    expect(r.cycling.status).toBe('pass');
    expect(r.cyclesPerHour).toBeCloseTo(7.2, 1);
  });

  it('warns on short cycling when float spacing is too tight', () => {
    const r = evaluateSump({ Q_pump: 50, Q_in: 20, drawVolume: 20 });
    expect(r.cycling.status).toBe('warning');
    expect(r.cyclesPerHour).toBeCloseTo(36, 0);
  });

  it('fails capacity when the pump cannot keep up with inflow', () => {
    const r = evaluateSump({ Q_pump: 20, Q_in: 25, drawVolume: 100 });
    expect(r.capacity.status).toBe('fail');
    expect(r.cycling.status).toBe('fail');
  });

  it('respects a custom starts-per-hour limit', () => {
    const r = evaluateSump({ Q_pump: 50, Q_in: 20, drawVolume: 100, maxStartsPerHour: 6 });
    expect(r.cycling.status).toBe('warning'); // 7.2/hr now exceeds 6/hr
  });
});
