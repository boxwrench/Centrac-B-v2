import { CONVERSION_FACTORS } from '../constants';
import { CalculationResult } from '../types';

export interface SuctionInputs {
  L: number;
  N: number;
  Q: number;
  SG: number;
  D: number;
  H_lift: number;
}

export interface SuctionResult {
  Ha: number;
  Ls: number;
  total: CalculationResult;
}

export function accelerationHead(i: SuctionInputs): number {
  const { L, N, Q, SG, D } = i;
  if (D <= 0) return 0;
  return (L * N * Q * SG) / (Math.pow(D, 2) * CONVERSION_FACTORS.API675_CONSTANT);
}

export function staticLiftLoss(H_lift: number, SG: number): number {
  return H_lift * CONVERSION_FACTORS.WATER_PSI_PER_FOOT * SG;
}

export function vacuumDemand(i: SuctionInputs): SuctionResult {
  const Ha = accelerationHead(i);
  const Ls = staticLiftLoss(i.H_lift, i.SG);
  const total = Ha + Ls;
  const isFail = total > CONVERSION_FACTORS.VACUUM_LIMIT_PSI;
  return {
    Ha,
    Ls,
    total: {
      value: total,
      unit: 'PSI',
      status: isFail ? 'fail' : 'pass',
      message: isFail
        ? 'CRITICAL FAIL: Vacuum demand exceeds the 12 PSI limit of the HPD return spring. Cavitation or knocking will occur.'
        : 'PASS: Vacuum demand is within the mechanical limits of the Centrac B pump.',
    },
  };
}

export interface DischargeInputs {
  Q_set: number;
  P_d: number;
}

export interface DischargeResult {
  peakFlow: number;
  backPressure: CalculationResult;
  deratingLossPercent: number;
  actualFlow: number;
}

export function peakFlow(Q_set: number): number {
  return Q_set * Math.PI;
}

export function deratingLossPercent(P_d: number): number {
  if (P_d <= CONVERSION_FACTORS.DERATING_THRESHOLD_PSI) return 0;
  const deltaP = P_d - CONVERSION_FACTORS.DERATING_THRESHOLD_PSI;
  return (deltaP / 100) * CONVERSION_FACTORS.DERATING_LOSS_RATE * 100;
}

export function dischargePerformance(i: DischargeInputs): DischargeResult {
  const { Q_set, P_d } = i;
  const ok = P_d >= CONVERSION_FACTORS.MIN_BACK_PRESSURE_PSI;
  const loss = deratingLossPercent(P_d);
  return {
    peakFlow: peakFlow(Q_set),
    backPressure: {
      value: P_d,
      unit: 'PSI',
      status: ok ? 'pass' : 'warning',
      message: ok
        ? 'Back pressure is sufficient to seat check valve balls.'
        : 'Low back pressure! Ball valves may float, causing inaccuracy.',
    },
    deratingLossPercent: loss,
    actualFlow: Q_set * (1 - loss / 100),
  };
}
