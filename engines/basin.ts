import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult } from '../types';

/**
 * Basin / tank hydraulic checks (rectangular).
 *
 * Confirms detention time, surface overflow rate, and freeboard for a process
 * basin (equalization, contact, clarifier, wet well). Volumes use the operating
 * water level; freeboard compares that level to the physical wall height.
 */
export interface BasinInputs {
  length: number;     // ft
  width: number;      // ft
  waterDepth: number; // operating water level, ft
  wallHeight: number; // top of wall, ft
  Q_gpm: number;      // flow through the basin, gpm
}

export interface BasinResult {
  volumeGal: number;
  detentionTimeHr: number;      // hydraulic detention/retention time
  surfaceOverflowRate: number;  // gpd per ft^2
  freeboard: CalculationResult; // wall height - water depth
}

/** Basin working volume in gallons. */
export function basinVolumeGal(length: number, width: number, waterDepth: number): number {
  return length * width * waterDepth * CONVERSION_FACTORS.GAL_PER_CUFT;
}

/** Hydraulic detention time in hours = volume / flow. */
export function detentionTimeHr(volumeGal: number, Q_gpm: number): number {
  if (Q_gpm <= 0) return Infinity;
  return volumeGal / (Q_gpm * 60);
}

/** Surface overflow rate (gpd/ft^2) = daily flow / surface area. */
export function surfaceOverflowRate(Q_gpm: number, length: number, width: number): number {
  const area = length * width;
  if (area <= 0) return 0;
  return (Q_gpm * CONVERSION_FACTORS.MINUTES_PER_DAY) / area;
}

export function evaluateBasin(i: BasinInputs): BasinResult {
  const volumeGal = basinVolumeGal(i.length, i.width, i.waterDepth);
  const dt = detentionTimeHr(volumeGal, i.Q_gpm);
  const sor = surfaceOverflowRate(i.Q_gpm, i.length, i.width);
  const fb = i.wallHeight - i.waterDepth;

  let status: CalculationResult['status'];
  let message: string;
  if (fb <= 0) {
    status = 'fail';
    message =
      'OVERFLOW: the operating level is at or above the top of the wall. Reduce inflow or increase drawdown immediately.';
  } else if (fb < CONVERSION_FACTORS.MIN_FREEBOARD_FT) {
    status = 'warning';
    message = `LOW FREEBOARD: only ${fb.toFixed(2)} ft to the top of the wall (want ≥ ${CONVERSION_FACTORS.MIN_FREEBOARD_FT.toFixed(
      1,
    )} ft). Risk of splash-out or overflow during surges.`;
  } else {
    status = 'pass';
    message = `OK: ${fb.toFixed(2)} ft of freeboard to the top of the wall.`;
  }

  return {
    volumeGal,
    detentionTimeHr: dt,
    surfaceOverflowRate: sor,
    freeboard: { value: fb, unit: 'ft', status, message },
  };
}
