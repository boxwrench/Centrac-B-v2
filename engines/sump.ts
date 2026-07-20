import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult } from '../types';

/**
 * Sump / lift-station pump checks.
 *
 * A sump pump cycles between a start float (high) and a stop float (low). The
 * volume between those floats is the "drawdown volume". These checks confirm the
 * pump can keep up with inflow and is not short-cycling (which burns out motors).
 */
export interface SumpInputs {
  Q_pump: number;   // pump capacity, gpm
  Q_in: number;     // inflow to the sump, gpm
  drawVolume: number; // volume between start and stop floats, gallons
  maxStartsPerHour?: number; // motor start limit; defaults to 10
}

export interface SumpResult {
  pumpDownTime: number; // minutes to draw the sump down (running)
  fillTime: number;     // minutes to refill from stop to start float
  cycleTime: number;    // minutes for a full off/on cycle
  cyclesPerHour: number;
  capacity: CalculationResult; // can the pump keep up with inflow?
  cycling: CalculationResult;  // short-cycling check
}

/** Net pump-down rate = pump capacity minus inflow (gpm). */
export function netPumpDownRate(Q_pump: number, Q_in: number): number {
  return Q_pump - Q_in;
}

/** Minutes to pump the drawdown volume down while inflow continues. */
export function pumpDownTime(drawVolume: number, Q_pump: number, Q_in: number): number {
  const net = netPumpDownRate(Q_pump, Q_in);
  if (net <= 0) return Infinity; // pump cannot overcome inflow
  return drawVolume / net;
}

/** Minutes to refill from the stop float to the start float (pump off). */
export function fillTime(drawVolume: number, Q_in: number): number {
  if (Q_in <= 0) return Infinity; // never refills
  return drawVolume / Q_in;
}

export function evaluateSump(i: SumpInputs): SumpResult {
  const maxStarts = i.maxStartsPerHour ?? CONVERSION_FACTORS.DEFAULT_MAX_STARTS_PER_HOUR;
  const down = pumpDownTime(i.drawVolume, i.Q_pump, i.Q_in);
  const fill = fillTime(i.drawVolume, i.Q_in);
  const cycle = down + fill;
  const cyclesPerHour = cycle > 0 && isFinite(cycle) ? 60 / cycle : 0;

  const keepsUp = netPumpDownRate(i.Q_pump, i.Q_in) > 0;
  const capacity: CalculationResult = {
    value: netPumpDownRate(i.Q_pump, i.Q_in),
    unit: 'gpm net',
    status: keepsUp ? 'pass' : 'fail',
    message: keepsUp
      ? 'OK: pump capacity exceeds inflow — the sump will draw down.'
      : 'UNDERSIZED: inflow meets or exceeds pump capacity. The pump will run continuously and the sump will overflow.',
  };

  let cyclingStatus: CalculationResult['status'];
  let cyclingMsg: string;
  if (!keepsUp) {
    cyclingStatus = 'fail';
    cyclingMsg = 'Pump cannot draw the sump down, so it never completes a normal cycle.';
  } else if (cyclesPerHour > maxStarts) {
    cyclingStatus = 'warning';
    cyclingMsg = `SHORT CYCLING: ${cyclesPerHour.toFixed(1)} starts/hour exceeds the ${maxStarts}/hour limit. ` +
      'Widen the float spacing (more drawdown volume) or fit a larger pump to reduce motor wear.';
  } else {
    cyclingStatus = 'pass';
    cyclingMsg = `OK: ${cyclesPerHour.toFixed(1)} starts/hour is within the ${maxStarts}/hour limit.`;
  }

  return {
    pumpDownTime: down,
    fillTime: fill,
    cycleTime: cycle,
    cyclesPerHour,
    capacity,
    cycling: { value: cyclesPerHour, unit: 'starts/hr', status: cyclingStatus, message: cyclingMsg },
  };
}
