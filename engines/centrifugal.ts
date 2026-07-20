import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult } from '../types';

/**
 * Centrifugal (transfer/process water) pump checks.
 *
 * Field-oriented: all head values are derived from gauge readings the operator
 * can take at the pump, rather than requiring a full system curve. Velocity-head
 * differences between the suction and discharge gauges are assumed negligible,
 * which is standard practice for a quick field performance check.
 */
export interface CentrifugalInputs {
  Q: number;          // flow, gpm
  P_suction: number;  // suction gauge pressure, PSI (negative = vacuum/lift)
  P_discharge: number; // discharge gauge pressure, PSI
  SG: number;         // specific gravity of the fluid
  NPSHr: number;      // NPSH required from the pump curve, ft
  efficiency: number; // pump efficiency, percent (from curve at this flow)
}

export interface CentrifugalResult {
  tdh: number;        // total dynamic head, ft
  npsha: number;      // NPSH available, ft
  npshMargin: CalculationResult; // NPSHa - NPSHr, ft, with pass/fail
  whp: number;        // water horsepower
  bhp: number;        // brake horsepower
}

/** Total dynamic head from suction/discharge gauges. TDH(ft) = (Pd - Ps) * 2.31 / SG. */
export function totalDynamicHead(P_discharge: number, P_suction: number, SG: number): number {
  if (SG <= 0) return 0;
  return ((P_discharge - P_suction) * CONVERSION_FACTORS.FT_PER_PSI) / SG;
}

/**
 * NPSH available at the suction flange, from the suction gauge reading.
 * NPSHa(ft) = (P_atm + P_suction_gauge - P_vapor) * 2.31 / SG.
 */
export function npshAvailable(P_suction: number, SG: number): number {
  if (SG <= 0) return 0;
  const absPsi =
    CONVERSION_FACTORS.ATM_PRESSURE_PSIA + P_suction - CONVERSION_FACTORS.VAPOR_PRESSURE_PSIA;
  return (absPsi * CONVERSION_FACTORS.FT_PER_PSI) / SG;
}

/** Water horsepower. WHP = Q(gpm) * TDH(ft) * SG / 3960. */
export function waterHorsepower(Q: number, tdh: number, SG: number): number {
  return (Q * tdh * SG) / CONVERSION_FACTORS.WHP_CONSTANT;
}

/** Brake horsepower at the shaft. BHP = WHP / efficiency. */
export function brakeHorsepower(whp: number, efficiencyPercent: number): number {
  if (efficiencyPercent <= 0) return 0;
  return whp / (efficiencyPercent / 100);
}

export function evaluateCentrifugal(i: CentrifugalInputs): CentrifugalResult {
  const tdh = totalDynamicHead(i.P_discharge, i.P_suction, i.SG);
  const npsha = npshAvailable(i.P_suction, i.SG);
  const margin = npsha - i.NPSHr;
  const requiredMargin = Math.max(
    CONVERSION_FACTORS.NPSH_MIN_MARGIN_FT,
    i.NPSHr * CONVERSION_FACTORS.NPSH_MARGIN_FRACTION,
  );

  let status: CalculationResult['status'];
  let message: string;
  if (margin <= 0) {
    status = 'fail';
    message =
      'CAVITATION: NPSH available is below NPSH required. The pump will cavitate — expect noise, ' +
      'vibration, and impeller damage. Raise suction pressure, lower lift, or reduce flow.';
  } else if (margin < requiredMargin) {
    status = 'warning';
    message = `LOW MARGIN: only ${margin.toFixed(1)} ft above NPSHr (want ≥ ${requiredMargin.toFixed(
      1,
    )} ft). The pump is close to cavitation; watch suction conditions.`;
  } else {
    status = 'pass';
    message = `OK: ${margin.toFixed(1)} ft of NPSH margin above required.`;
  }

  const whp = waterHorsepower(i.Q, tdh, i.SG);
  const bhp = brakeHorsepower(whp, i.efficiency);

  return {
    tdh,
    npsha,
    npshMargin: { value: margin, unit: 'ft', status, message },
    whp,
    bhp,
  };
}
