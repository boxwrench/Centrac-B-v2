import { CONVERSION_FACTORS } from '../constants';

export function drawdownGph(mL: number, sec: number): number {
  if (sec <= 0) return 0;
  return (mL / sec) * CONVERSION_FACTORS.DRAWDOWN_GPH_FACTOR;
}

export interface DosingInputs {
  mgd: number;
  ppm: number;
  density: number;
}

export function dosingGph(i: DosingInputs): number {
  if (i.density <= 0) return 0;
  return (
    (i.mgd * i.ppm * CONVERSION_FACTORS.WATER_LB_PER_GAL) /
    (i.density * CONVERSION_FACTORS.HOURS_PER_DAY)
  );
}
