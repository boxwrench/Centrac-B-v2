
import { TroubleshootingEntry } from './types';

export const TROUBLESHOOTING_MATRIX: TroubleshootingEntry[] = [
  {
    category: 'Noise',
    symptom: 'Cogging at Low Speed',
    cause: 'VFD likely in V/Hz mode.',
    recommendation: 'Switch VFD to Sensorless Vector Control (SVC) mode for low-speed torque stability.'
  },
  {
    category: 'Noise',
    symptom: 'Knock at Reversal',
    cause: 'Mechanical Backlash (Scotch Yoke)',
    recommendation: 'Inspect drive mechanism for wear. Check Scotch Yoke slide block and crosshead alignment.'
  },
  {
    category: 'Performance',
    symptom: 'Heat Test Fail (High Temp)',
    cause: 'Internal Relief Valve Bypassing',
    recommendation: 'Verify relief valve setting. Inspect valve seat for debris or scoring.'
  },
  {
    category: 'Performance',
    symptom: 'Low Flow / Inaccuracy',
    cause: 'Low Back Pressure',
    recommendation: 'Ensure system discharge pressure is at least 35 PSI. Install a Back Pressure Valve if required.'
  },
  {
    category: 'Suction',
    symptom: 'Heavy Knocking in Suction Line',
    cause: 'High Acceleration Head (Inertia)',
    recommendation: 'Increase suction pipe diameter, shorten the line, or install a suction stabilizer.'
  },
  {
    category: 'Suction',
    symptom: 'Pump Struggles to Prime',
    cause: 'Excessive Suction Lift',
    recommendation: 'Reduce vertical lift or check for air leaks in the suction piping assembly.'
  },
  {
    category: 'Hydraulics',
    symptom: 'Loud Bang at Start of Stroke',
    cause: 'Gas Accumulation / Vapor Lock',
    recommendation: 'Bleed the hydraulic system using the manual air vent valve. Check HPD diaphragm for rupture.'
  }
];

export const CONVERSION_FACTORS = {
  WATER_PSI_PER_FOOT: 0.433,
  API675_CONSTANT: 18500,
  DRAWDOWN_GPH_FACTOR: 0.951,
  WATER_LB_PER_GAL: 8.34,
  HOURS_PER_DAY: 24,
  VACUUM_LIMIT_PSI: 12,
  MIN_BACK_PRESSURE_PSI: 35,
  DERATING_THRESHOLD_PSI: 200,
  DERATING_LOSS_RATE: 0.008 // 0.8% per 100 psi
};
