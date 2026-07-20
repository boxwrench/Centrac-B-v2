import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult, PmField } from '../types';

type Status = 'pass' | 'fail' | 'warning' | 'neutral';

/**
 * Evaluate a numeric reading against a PmField's bounds.
 * Order: fail bounds (min/max) first, then warn bounds (warnLow/warnHigh),
 * then pass if any bound was defined, else neutral.
 */
export function readingStatus(value: number, f: PmField): Status {
  if (f.min !== undefined && value < f.min) return 'fail';
  if (f.max !== undefined && value > f.max) return 'fail';
  if (f.warnLow !== undefined && value < f.warnLow) return 'warning';
  if (f.warnHigh !== undefined && value > f.warnHigh) return 'warning';
  if (
    f.min !== undefined ||
    f.max !== undefined ||
    f.warnLow !== undefined ||
    f.warnHigh !== undefined
  ) {
    return 'pass';
  }
  return 'neutral';
}

/** Gallons used since the previous reading, accounting for any logged addition. Clamps at 0. */
export function usageSince(prevLevel: number, currentLevel: number, added: number = 0): number {
  const used = prevLevel - currentLevel + added;
  return used < 0 ? 0 : used;
}

/** Days of supply remaining at the current average daily use. Infinity when use <= 0. */
export function daysOfSupply(currentGal: number, avgDailyUseGal: number): number {
  if (avgDailyUseGal <= 0) return Infinity;
  return currentGal / avgDailyUseGal;
}

/** Analyzer vs grab-sample drift, evaluated against the analyzer drift limit. */
export function analyzerDrift(analyzer: number, grab: number): CalculationResult {
  const diff = Math.abs(analyzer - grab);
  const status: Status = diff <= CONVERSION_FACTORS.ANALYZER_DRIFT_LIMIT_MGL ? 'pass' : 'warning';
  return { value: diff, unit: 'mg/L', status };
}

/** Pump catch actual vs expected GPH, evaluated as % error against tolerance. */
export function catchVerdict(
  actualGph: number,
  expectedGph: number,
  tolerancePct: number = CONVERSION_FACTORS.CATCH_TOLERANCE_PCT,
): CalculationResult {
  if (expectedGph <= 0) {
    return { value: 0, unit: '%', status: 'warning', message: 'No expected rate to compare against.' };
  }
  const pctError = (Math.abs(actualGph - expectedGph) / expectedGph) * 100;
  const status: Status = pctError <= tolerancePct ? 'pass' : 'fail';
  return { value: pctError, unit: '%', status };
}

/** Specific capacity in gpm per ft of drawdown. 0 when drawdown <= 0. */
export function specificCapacity(gpm: number, drawdownFt: number): number {
  if (drawdownFt <= 0) return 0;
  return gpm / drawdownFt;
}

/** Worst status among a set, ranked fail > warning > pass > neutral. */
export function worstStatus(statuses: Status[]): Status {
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.includes('pass')) return 'pass';
  return 'neutral';
}
