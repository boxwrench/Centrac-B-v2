
import { TroubleshootingEntry, PmTask } from './types';

export const TROUBLESHOOTING_MATRIX: TroubleshootingEntry[] = [
  // ---- Metering (Centrac B feed) pumps ----
  {
    category: 'Noise',
    symptom: 'Cogging at Low Speed',
    cause: 'VFD likely in V/Hz mode.',
    recommendation: 'Switch VFD to Sensorless Vector Control (SVC) mode for low-speed torque stability.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Noise',
    symptom: 'Knock at Reversal',
    cause: 'Mechanical Backlash (Scotch Yoke)',
    recommendation: 'Inspect drive mechanism for wear. Check Scotch Yoke slide block and crosshead alignment.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Performance',
    symptom: 'Heat Test Fail (High Temp)',
    cause: 'Internal Relief Valve Bypassing',
    recommendation: 'Verify relief valve setting. Inspect valve seat for debris or scoring.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Performance',
    symptom: 'Low Flow / Inaccuracy',
    cause: 'Low Back Pressure',
    recommendation: 'Ensure system discharge pressure is at least 35 PSI. Install a Back Pressure Valve if required.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Suction',
    symptom: 'Heavy Knocking in Suction Line',
    cause: 'High Acceleration Head (Inertia)',
    recommendation: 'Increase suction pipe diameter, shorten the line, or install a suction stabilizer.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Suction',
    symptom: 'Pump Struggles to Prime',
    cause: 'Excessive Suction Lift',
    recommendation: 'Reduce vertical lift or check for air leaks in the suction piping assembly.',
    assetTypes: ['metering_pump']
  },
  {
    category: 'Hydraulics',
    symptom: 'Loud Bang at Start of Stroke',
    cause: 'Gas Accumulation / Vapor Lock',
    recommendation: 'Bleed the hydraulic system using the manual air vent valve. Check HPD diaphragm for rupture.',
    assetTypes: ['metering_pump']
  },

  // ---- Centrifugal (transfer/process water) pumps ----
  {
    category: 'Cavitation',
    symptom: 'Rattling / Gravel Noise When Running',
    cause: 'Cavitation — NPSH available below required.',
    recommendation: 'Raise suction level, shorten/enlarge suction pipe, clean the suction strainer, or throttle discharge to reduce flow. Compare NPSHa vs NPSHr on the Checks tab.',
    assetTypes: ['centrifugal_pump']
  },
  {
    category: 'Flow',
    symptom: 'No Flow After Start',
    cause: 'Pump lost prime / air-bound casing.',
    recommendation: 'Re-prime the pump, vent air from the casing, verify suction valve is open and foot valve is holding.',
    assetTypes: ['centrifugal_pump']
  },
  {
    category: 'Flow',
    symptom: 'Low Flow or Low Discharge Pressure',
    cause: 'Worn impeller/wear rings, partially closed valve, or wrong rotation.',
    recommendation: 'Confirm motor rotation, open discharge valve fully, inspect impeller and wear rings for wear or clogging.',
    assetTypes: ['centrifugal_pump']
  },
  {
    category: 'Seals',
    symptom: 'Leakage at the Shaft',
    cause: 'Failed mechanical seal or worn packing.',
    recommendation: 'Replace the mechanical seal (check for dry-run damage) or adjust/repack the gland. Verify seal flush is present.',
    assetTypes: ['centrifugal_pump']
  },
  {
    category: 'Vibration',
    symptom: 'High Vibration / Bearing Noise',
    cause: 'Misalignment, imbalance, or worn bearings.',
    recommendation: 'Check coupling alignment and baseplate bolts, inspect bearings, and confirm the pump is not running far off its best-efficiency point.',
    assetTypes: ['centrifugal_pump']
  },
  {
    category: 'Motor',
    symptom: 'Motor Overheats / Trips on Overload',
    cause: 'Operating past end of curve (overload) or high specific gravity.',
    recommendation: 'Throttle discharge to move back up the curve, verify fluid SG, and compare brake horsepower on the Checks tab against the motor nameplate.',
    assetTypes: ['centrifugal_pump']
  },

  // ---- Sump / lift-station pumps ----
  {
    category: 'Cycling',
    symptom: 'Pump Starts and Stops Rapidly',
    cause: 'Short cycling — float spacing too tight or oversized pump.',
    recommendation: 'Increase the gap between start and stop floats (more drawdown volume) or fit a smaller/variable-speed pump. Keep starts within the motor limit on the Checks tab.',
    assetTypes: ['sump_pump']
  },
  {
    category: 'Level',
    symptom: 'Sump Overflows / Level Keeps Rising',
    cause: 'Pump undersized for inflow, clogged impeller, or stuck check valve.',
    recommendation: 'Confirm pump capacity exceeds inflow, clear rags/debris from the impeller, and verify the discharge check valve opens.',
    assetTypes: ['sump_pump']
  },
  {
    category: 'Level',
    symptom: 'Pump Runs but Will Not Shut Off',
    cause: 'Stuck start float or debris holding the float up.',
    recommendation: 'Free or replace the float switch, clear debris, and confirm the stop level is reachable.',
    assetTypes: ['sump_pump']
  },
  {
    category: 'Start',
    symptom: 'Pump Will Not Start',
    cause: 'Failed float, tripped breaker, or seized/clogged pump.',
    recommendation: 'Check float continuity, reset the breaker/overload, and confirm the impeller turns freely (lockout/tagout first).',
    assetTypes: ['sump_pump']
  },
  {
    category: 'Flow',
    symptom: 'Runs but Pumps Little or Nothing',
    cause: 'Clogged impeller/discharge or air-locked volute.',
    recommendation: 'Clear the impeller and discharge line, and provide a small vent/weep hole to prevent air-locking.',
    assetTypes: ['sump_pump']
  },

  // ---- Basins / tanks ----
  {
    category: 'Level',
    symptom: 'High Level / Approaching Overflow',
    cause: 'Inflow exceeds outflow or downstream restriction.',
    recommendation: 'Increase pump-out or open the outlet, check downstream for blockage, and verify freeboard on the Checks tab.',
    assetTypes: ['basin', 'tank']
  },
  {
    category: 'Solids',
    symptom: 'Sludge / Solids Accumulation',
    cause: 'Low velocity, poor mixing, or long detention time.',
    recommendation: 'Restore mixing/aeration, schedule desludging, and confirm detention time is not excessive for the process.',
    assetTypes: ['basin', 'tank']
  },
  {
    category: 'Odor',
    symptom: 'Septic Odor / Rotten-Egg Smell',
    cause: 'Anaerobic conditions from stagnation or low DO.',
    recommendation: 'Increase aeration/mixing, reduce detention time, and consider chemical addition to control sulfides.',
    assetTypes: ['basin', 'tank']
  },
  {
    category: 'Process',
    symptom: 'Excessive Foaming on Surface',
    cause: 'Surfactants, filamentous growth, or over-aeration.',
    recommendation: 'Reduce aeration if over-mixed, apply antifoam/water spray, and investigate influent for surfactant loading.',
    assetTypes: ['basin', 'tank']
  },
  {
    category: 'Performance',
    symptom: 'Poor Settling / Carryover to Effluent',
    cause: 'Surface overflow rate too high (hydraulic overload).',
    recommendation: 'Reduce flow or bring another basin online; compare the surface overflow rate on the Checks tab to the design loading.',
    assetTypes: ['basin']
  }
];

/**
 * Preventive-maintenance rounds, from the EPA routine O&M task list for drinking
 * water systems. Tasks tagged with assetTypes appear when a matching asset is
 * active; untagged tasks are facility-wide. Presented as one flat list (no cadence
 * grouping) split only by scope (facility vs. active asset).
 */
export const PM_CHECKLIST: PmTask[] = [
  // ---- Facility-wide ----
  { id: 'pm-flow-meter', category: 'Readings', label: 'Check water flow meter readings.' },
  { id: 'pm-chem-usage-other', category: 'Readings', label: 'Record daily chemical solution usage.' },
  { id: 'pm-cl-analyzers', category: 'Instrumentation', label: 'Check and record chlorine residual analyzers.' },
  { id: 'pm-instrument-io', category: 'Instrumentation', label: 'Check instrumentation for proper signal input/output.' },
  { id: 'pm-security', category: 'Security', label: 'Complete a security check (locks, hatches, doors, windows, vents, lighting, alarms, fences, well caps/seals).' },
  { id: 'pm-backup-power', category: 'Safety', label: 'Ensure backup power source is ready to operate when needed.' },
  { id: 'pm-test-equipment', category: 'Instrumentation', label: 'Inspect chlorine and fluoride testing equipment.' },
  { id: 'pm-clean-rooms', category: 'Housekeeping', label: 'Clean pump rooms and grounds.' },
  { id: 'pm-plumbing-leaks', category: 'Housekeeping', label: 'Inspect all pump room plumbing for leaks.' },
  { id: 'pm-control-panels', category: 'Controls', label: 'Inspect, clean, and repair control panels for pumps, valves, and filters.' },
  { id: 'pm-safety-inventory', category: 'Safety', label: 'Inventory safety equipment and maintain repair logs.' },
  { id: 'pm-heater', category: 'Building', label: 'Inspect heater operation.' },

  // ---- Chemical / metering-pump system ----
  { id: 'pm-feed-pump-inspect', category: 'Chemical Feed', label: 'Inspect chemical feed pumps for proper operation.', assetTypes: ['metering_pump'] },
  { id: 'pm-feed-pump-catch', category: 'Chemical Feed', label: 'Perform a pump catch and calibrate chemical feed pumps.', assetTypes: ['metering_pump'], hint: 'Use the Dosing tab for the catch-column calc.' },
  { id: 'pm-feed-lines-tanks', category: 'Chemical Feed', label: 'Inspect and clean chemical feed lines and solution tanks.', assetTypes: ['metering_pump', 'tank'] },
  { id: 'pm-relief-valves', category: 'Valves', label: 'Check pressure relief valves and back pressure valves.', assetTypes: ['metering_pump', 'centrifugal_pump'], hint: 'The Checks tab flags low back pressure.' },

  // ---- Tanks / storage ----
  { id: 'pm-chem-tanks-usage', category: 'Tanks', label: 'Check chemical solution tanks and record amounts used (e.g., chlorine, fluoride).', assetTypes: ['tank'] },
  { id: 'pm-storage-levels', category: 'Tanks', label: 'Check and record water levels in storage tanks (local and SCADA).', assetTypes: ['tank'] },
  { id: 'pm-chem-levels', category: 'Tanks', label: 'Check and record chemical levels in chemical tanks (local and SCADA).', assetTypes: ['tank'] },

  // ---- Booster / well pumps (centrifugal) ----
  { id: 'pm-booster-inspect', category: 'Pumps', label: 'Inspect booster pump stations (vibration, heat, seals, controls).', assetTypes: ['centrifugal_pump'] },
  { id: 'pm-well-pump-inspect', category: 'Pumps', label: 'Inspect well pumps, motors, and controls for defects, unusual sounds/vibrations, and intact seals.', assetTypes: ['centrifugal_pump'] },

  // ---- Sump pumps ----
  { id: 'pm-sump-check', category: 'Pumps', label: 'Check all sump pumps for proper operation.', assetTypes: ['sump_pump'] },
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
  DERATING_LOSS_RATE: 0.008, // 0.8% per 100 psi
  // Centrifugal / general pump hydraulics
  FT_PER_PSI: 2.31, // feet of head per PSI at SG 1.0
  ATM_PRESSURE_PSIA: 14.7, // standard atmospheric pressure at sea level
  VAPOR_PRESSURE_PSIA: 0.36, // water vapor pressure ~70 F
  WHP_CONSTANT: 3960, // gpm * ft / 3960 = water horsepower (at SG 1.0)
  NPSH_MIN_MARGIN_FT: 2, // minimum acceptable NPSH margin (ft)
  NPSH_MARGIN_FRACTION: 0.1, // preferred margin as a fraction of NPSHr
  // Sump pumps
  DEFAULT_MAX_STARTS_PER_HOUR: 10, // typical motor start limit
  // Basins / tanks
  GAL_PER_CUFT: 7.48052,
  MIN_FREEBOARD_FT: 1.0,
  MINUTES_PER_DAY: 1440,
};
