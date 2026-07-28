
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
  },

  // ---- Chemical feed / metering ----
  {
    category: 'Chemical Feed',
    symptom: 'Hypochlorite Feed Erratic / Pump Loses Suction (Gas-Binding)',
    cause: 'Off-gassing sodium hypochlorite forms oxygen bubbles in the pump head and suction line, especially in warm/aged solution.',
    recommendation: 'Install/verify a degassing valve at the pump head, shorten and slope the suction line up to the tank with no high points, keep stock below 10% strength and rotate stock (use oldest first), and relocate the day tank out of direct sun/heat if practical.',
    assetTypes: ['metering_pump'],
    severity: 'action'
  },
  {
    category: 'Chemical Feed',
    symptom: 'Pump Loses Prime During Normal Operation',
    cause: 'Degassing solution or a suction leak is letting gas accumulate faster than the pump can purge it.',
    recommendation: 'Bleed the pump head manually, inspect suction tubing and fittings for micro-leaks (a leak that pulls air in but not liquid out), and check that the foot valve/strainer is fully submerged with adequate tank level.',
    assetTypes: ['metering_pump'],
    severity: 'action'
  },
  {
    category: 'Chemical Feed',
    symptom: 'Reduced or Zero Flow — Crystallization in Line/Injection Quill',
    cause: 'Scale (calcium carbonate) or salt crystals have built up in the discharge tubing or at the injection quill tip, especially where hypochlorite mixes with hard water.',
    recommendation: 'Remove and soak the injection quill in dilute acid solution (per manufacturer guidance) to dissolve scale, flush the discharge line, and consider a self-cleaning or ceramic-ball check valve at the injection point to reduce recurrence.',
    assetTypes: ['metering_pump'],
    severity: 'action'
  },
  {
    category: 'Chemical Feed',
    symptom: 'Chemical Continues to Feed With Pump Stopped (Siphoning)',
    cause: 'Elevation difference between the day tank and injection point lets gravity siphon chemical through the pump even when it is not running.',
    recommendation: 'Install/verify an anti-siphon (back-pressure) valve on the discharge line, confirm the injection point is above the tank liquid level or a proper vacuum breaker is in place, and check the pump\'s internal check valves for wear that lets flow pass through.',
    assetTypes: ['metering_pump'],
    severity: 'action'
  },
  {
    category: 'Chemical Feed',
    symptom: 'Inconsistent Dose Despite Stable Pump Setting',
    cause: 'Chemical in the day tank has degraded (hypochlorite losing strength with age/heat) or stratified (denser, more concentrated solution settled at the bottom).',
    recommendation: 'Verify actual solution strength by titration rather than assuming label strength, mix/recirculate the tank before drawing suction, keep the tank out of direct sun, and shorten resupply intervals if degradation is consistently outpacing usage.',
    assetTypes: ['metering_pump'],
    severity: 'monitor'
  },

  // ---- Electrical (all pump types) ----
  {
    category: 'Electrical',
    symptom: 'Motor Will Not Start',
    cause: 'Tripped breaker, tripped thermal overload, or a failed/miswired contactor.',
    recommendation: 'Lockout/tagout, check and reset the breaker, verify the overload has not tripped (reset if cooled) and reads the correct full-load amps, and inspect the contactor coil and contacts for continuity and pitting.',
    assetTypes: ['metering_pump', 'centrifugal_pump', 'sump_pump', 'well_pump'],
    severity: 'action'
  },
  {
    category: 'Electrical',
    symptom: 'VFD Trips on Fault',
    cause: 'Overcurrent, overvoltage/undervoltage, overtemperature, or ground fault detected by the drive.',
    recommendation: 'Record the fault code before clearing it, check incoming line voltage and motor cable insulation, verify drive cooling fan/vents are clear, and confirm motor and drive parameters (FLA, acceleration ramp) match the nameplate before restarting.',
    assetTypes: ['metering_pump', 'centrifugal_pump', 'sump_pump', 'well_pump'],
    severity: 'action'
  },
  {
    category: 'Electrical',
    symptom: 'Motor Runs Hot to the Touch or Trips on Thermal Protection',
    cause: 'Overload (mechanical binding or process overload), single-phasing, poor ventilation, or undersized/loose conductors.',
    recommendation: 'Verify amp draw on all legs against nameplate FLA, check for phase imbalance, clear motor cooling vents of debris, and confirm connections are torqued and not corroded.',
    assetTypes: ['metering_pump', 'centrifugal_pump', 'sump_pump', 'well_pump'],
    severity: 'action'
  },
  {
    category: 'Electrical',
    symptom: 'Pump Is Physically Running but SCADA/HMI Shows It Off',
    cause: 'Failed or miswired run-status auxiliary contact, a communications fault to the RTU/PLC, or a blown control-circuit fuse feeding the status input.',
    recommendation: 'Verify actual pump operation in the field, check the run-status contact wiring and control fuse, and confirm the I/O point and communications link at the RTU/PLC. Do not rely on SCADA status alone until confirmed — log actual run state manually in the interim.',
    assetTypes: ['metering_pump', 'centrifugal_pump', 'sump_pump', 'well_pump'],
    severity: 'action'
  },

  // ---- Analyzers (facility) ----
  {
    category: 'Analyzer',
    symptom: 'Analyzer Reading Drifts From Grab Sample Result',
    cause: 'Sensor fouling, calibration drift, or an aging reagent/electrode losing accuracy.',
    recommendation: 'Pull a grab sample and compare against the analyzer immediately, clean the sensor/flow cell per manufacturer procedure, and recalibrate. If drift recurs quickly, replace the sensor or reagent.',
    severity: 'monitor'
  },
  {
    category: 'Analyzer',
    symptom: 'No Sample Flow to Analyzer',
    cause: 'Plugged sample line/strainer, closed or failed sample solenoid, or an air-bound sample pump.',
    recommendation: 'Check the sample line for kinks or plugging, clean or replace the inline strainer, verify the sample solenoid/pump is energized and primed, and confirm the sample tap is not isolated.',
    severity: 'action'
  },
  {
    category: 'Analyzer',
    symptom: 'Analyzer Alarms for Low Reagent',
    cause: 'Reagent bottle/cartridge depleted or nearing end of service life.',
    recommendation: 'Replace the reagent per the analyzer schedule (do not run past empty), record installation date, and verify the analyzer resumes normal readings and passes a check standard after replacement.',
    severity: 'monitor'
  },
  {
    category: 'Analyzer',
    symptom: 'Flowmeter Reads Zero or Erratic',
    cause: 'Empty pipe, entrained air, fouled electrodes (magmeter), or a lost/noisy signal from the transmitter.',
    recommendation: 'Confirm the line is full and air is bled, inspect and clean electrodes/sensor per meter type, check transmitter wiring and grounding, and re-zero the meter with the line valved off and full per manufacturer procedure.',
    severity: 'action'
  },

  // ---- Wells ----
  {
    category: 'Well',
    symptom: 'Sand or Turbidity in Discharge at Startup',
    cause: 'Well screen or gravel pack disturbance, or a damaged screen letting formation material into the casing.',
    recommendation: 'Let the well settle before use if disturbance is recent, inspect the screen/pack for damage if turbidity persists beyond startup, and consider redevelopment. Track sand production over time — increasing trend signals screen failure.',
    assetTypes: ['well_pump'],
    severity: 'action'
  },
  {
    category: 'Well',
    symptom: 'Declining Specific Capacity (More Drawdown for Same Yield)',
    cause: 'Well screen/gravel pack fouling (biofouling, incrustation) or aquifer-level decline.',
    recommendation: 'Compare current specific capacity (gpm per foot of drawdown) against the baseline test, check static water level trends in the area, and schedule well rehabilitation (chemical treatment or mechanical redevelopment) if fouling is indicated.',
    assetTypes: ['well_pump'],
    severity: 'monitor'
  },
  {
    category: 'Well',
    symptom: 'Air in Discharge / Cascading Water Noise in Casing',
    cause: 'Pump setting too close to the drawdown water level, or a loose column/drop pipe joint drawing air.',
    recommendation: 'Verify pump bowl/intake setting depth against current pumping water level and lower if margin is inadequate, and inspect column pipe joints and check valve for leaks that allow air entrainment.',
    assetTypes: ['well_pump'],
    severity: 'action'
  },
  {
    category: 'Well',
    symptom: 'Positive Total Coliform (or E. coli) Sample Result',
    cause: 'Well seal/casing breach, cross-connection, sampling tap contamination, or a genuine source-water contamination event.',
    recommendation: 'Resample immediately from the original tap and collect repeat/upstream-downstream samples per the coliform rule; inspect the wellhead seal, vents, and casing for breach; verify chlorine residual is present and adequate at the point of sample.',
    assetTypes: ['well_pump'],
    severity: 'urgent',
    escalate: 'Notify the primary operator and the state drinking water program immediately; collect repeat/upstream-downstream samples per the coliform rule.'
  },

  // ---- Storage tanks ----
  {
    category: 'Storage',
    symptom: 'Tank Overflow Event',
    cause: 'Level control/altitude valve failure, stuck float, or a SCADA setpoint/communication error that failed to stop fill.',
    recommendation: 'Stop the fill source immediately, inspect and test the level control/altitude valve and float switch, verify SCADA setpoints and alarm thresholds, and document the event volume and duration.',
    assetTypes: ['tank'],
    severity: 'action'
  },
  {
    category: 'Storage',
    symptom: 'Freezing / Ice Damage to Tank Appurtenances',
    cause: 'Inadequate insulation or heat tracing on vents, overflow piping, or exposed risers during cold weather.',
    recommendation: 'Inspect vents and overflow for ice blockage (a blocked vent can collapse a tank), verify heat trace/insulation is functional before the next cold snap, and clear ice obstructions carefully without damaging the screen/vent.',
    assetTypes: ['tank'],
    severity: 'action'
  },
  {
    category: 'Storage',
    symptom: 'Interior Coating Failure / Corrosion Visible',
    cause: 'Coating breakdown from age, poor surface prep at original application, or cathodic protection system failure.',
    recommendation: 'Document the extent and location of failure during the next inspection/cleaning, check cathodic protection anode condition and rectifier output if equipped, and schedule recoating before base metal loss becomes structural.',
    assetTypes: ['tank'],
    severity: 'monitor'
  },
  {
    category: 'Storage',
    symptom: 'Signs of Contamination After a Suspected Tank Breach',
    cause: 'Roof/vent/hatch breach, animal or debris intrusion, or vandalism allowing contaminants to enter finished water storage.',
    recommendation: 'Take the tank offline if possible and isolate it from the distribution system, collect samples for bacteriological and chemical analysis, inspect and secure the breach point (hatch, vent, roof), and increase chlorine residual monitoring downstream.',
    assetTypes: ['tank'],
    severity: 'urgent',
    escalate: 'Notify the primary operator and the state drinking water program immediately; isolate the tank from the distribution system and evaluate the need for a boil-water advisory.'
  },

  // ---- System-level (facility) ----
  {
    category: 'Distribution',
    symptom: 'Low or No Chlorine Residual in Distribution System',
    cause: 'Under-dosing at the plant/booster, excessive chlorine demand (biofilm, main breaks, stagnant dead-ends), or a feed system failure.',
    recommendation: 'Verify chemical feed system is operating and dosing correctly, check residual at multiple points to isolate the affected area, flush dead-end mains and low-residual zones, and increase feed rate or booster chlorination if demand has increased.',
    severity: 'urgent',
    escalate: 'Notify the primary operator and the state drinking water program immediately; investigate the cause and re-establish adequate residual throughout the affected area, per the disinfectant residual requirements.'
  },
  {
    category: 'Distribution',
    symptom: 'Customer Low-Pressure Complaints',
    cause: 'High demand exceeding system capacity, a closed/partially closed valve, main break, or a failing booster pump.',
    recommendation: 'Check system pressure at the affected area and compare to normal, verify all system valves are in normal position, inspect for main breaks in the vicinity, and confirm booster pump(s) are running and at expected discharge pressure.',
    severity: 'action'
  },
  {
    category: 'Distribution',
    symptom: 'Dirty or Discolored Water Complaints',
    cause: 'Main break or repair stirring up sediment, hydraulic disturbance (fire flow, valve operation) resuscitating iron/manganese deposits, or unidirectional flushing not yet complete.',
    recommendation: 'Flush the affected main(s) at a hydrant until water runs clear, check for recent nearby main work or high-demand events that could explain the disturbance, and sample for turbidity/iron if discoloration persists after flushing.',
    severity: 'action'
  },
  {
    category: 'Distribution',
    symptom: 'Air in Mains / Sputtering at Customer Taps',
    cause: 'Air entrainment from a recent main break repair, pump startup, or an air-release valve that is stuck closed and not venting during filling.',
    recommendation: 'Open hydrants/blow-offs at high points to bleed air from the main, inspect and exercise air-release valves along the affected main, and fill new or repaired mains slowly to minimize air entrapment.',
    severity: 'monitor'
  },
  {
    category: 'Distribution',
    symptom: 'Water Hammer / Banging in Mains or at Valves',
    cause: 'Rapid valve closure, pump start/stop without soft-start/stop, or a check valve slamming shut on flow reversal.',
    recommendation: 'Operate valves slowly (especially large main valves), verify VFD/soft-starter ramp settings on pumps, and inspect check valves for proper closure timing; consider a surge/air-relief valve at chronic locations.',
    severity: 'monitor'
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
  // PM rounds thresholds
  MIN_CL_RESIDUAL_MGL: 0.2,   // minimum detectable/target residual
  MRDL_CL_MGL: 4.0,           // EPA max residual disinfectant level
  ANALYZER_DRIFT_LIMIT_MGL: 0.2, // analyzer vs grab-sample tolerance
  CATCH_TOLERANCE_PCT: 10,    // pump catch vs expected GPH
  MIN_DAYS_OF_SUPPLY: 7,      // chemical reorder warning threshold
};

/**
 * Preventive-maintenance rounds, from the EPA routine O&M task list for drinking
 * water systems. Tasks tagged with assetTypes appear when a matching asset is
 * active; untagged tasks are facility-wide. Presented as one flat list (no cadence
 * grouping) split only by scope (facility vs. active asset).
 */
export const PM_CHECKLIST: PmTask[] = [
  // ---- Facility-wide ----
  {
    id: 'pm-flow-meter', category: 'Readings', label: 'Check water flow meter readings.',
    fields: [
      { id: 'meterReading', type: 'reading', label: 'Meter reading', unit: 'gal' },
    ],
  },
  {
    id: 'pm-chem-usage-other', category: 'Readings', label: 'Record daily chemical solution usage.',
    fields: [
      { id: 'amountUsed', type: 'reading', label: 'Amount used', unit: 'gal' },
      { id: 'chemical', type: 'note', label: 'Chemical' },
    ],
  },
  {
    id: 'pm-cl-analyzers', category: 'Instrumentation', label: 'Check and record chlorine residual analyzers.',
    fields: [
      { id: 'analyzerMgL', type: 'reading', label: 'Analyzer residual', unit: 'mg/L', min: CONVERSION_FACTORS.MIN_CL_RESIDUAL_MGL, max: CONVERSION_FACTORS.MRDL_CL_MGL },
      { id: 'grabMgL', type: 'reading', label: 'Grab sample residual', unit: 'mg/L', min: CONVERSION_FACTORS.MIN_CL_RESIDUAL_MGL, max: CONVERSION_FACTORS.MRDL_CL_MGL },
    ],
  },
  {
    id: 'pm-instrument-io', category: 'Instrumentation', label: 'Check instrumentation for proper signal input/output.',
    fields: [
      { id: 'signalsVerified', type: 'checkitem', label: 'Signals verified' },
      { id: 'instrumentsChecked', type: 'note', label: 'Instruments checked' },
    ],
  },
  {
    id: 'pm-security', category: 'Security', label: 'Complete a security check (locks, hatches, doors, windows, vents, lighting, alarms, fences, well caps/seals).',
    fields: [
      { id: 'locks', type: 'checkitem', label: 'Locks' },
      { id: 'hatches', type: 'checkitem', label: 'Hatches' },
      { id: 'doorsWindows', type: 'checkitem', label: 'Doors and windows' },
      { id: 'ventsScreens', type: 'checkitem', label: 'Vents and screens' },
      { id: 'lighting', type: 'checkitem', label: 'Lighting' },
      { id: 'alarms', type: 'checkitem', label: 'Alarms' },
      { id: 'fencing', type: 'checkitem', label: 'Fencing' },
      { id: 'wellCaps', type: 'checkitem', label: 'Well caps / seals' },
    ],
  },
  {
    id: 'pm-backup-power', category: 'Safety', label: 'Ensure backup power source is ready to operate when needed.',
    fields: [
      { id: 'started', type: 'checkitem', label: 'Started' },
      { id: 'transfer', type: 'select', label: 'Transfer switch', options: ['auto-transfer OK', 'manual only', 'failed'] },
      { id: 'runHours', type: 'reading', label: 'Run hours', unit: 'hr' },
      { id: 'fuelPct', type: 'reading', label: 'Fuel', unit: '%', min: 25 },
    ],
  },
  {
    id: 'pm-test-equipment', category: 'Instrumentation', label: 'Inspect chlorine and fluoride testing equipment.',
    fields: [
      { id: 'reagentsInDate', type: 'checkitem', label: 'Reagents in date' },
      { id: 'standardsPass', type: 'checkitem', label: 'Standards pass' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
  { id: 'pm-clean-rooms', category: 'Housekeeping', label: 'Clean pump rooms and grounds.' },
  {
    id: 'pm-plumbing-leaks', category: 'Housekeeping', label: 'Inspect all pump room plumbing for leaks.',
    fields: [
      { id: 'noLeaksFound', type: 'checkitem', label: 'No leaks found' },
      { id: 'leakLocation', type: 'note', label: 'Leak location' },
    ],
  },
  {
    id: 'pm-control-panels', category: 'Controls', label: 'Inspect, clean, and repair control panels for pumps, valves, and filters.',
    fields: [
      { id: 'panelsClean', type: 'checkitem', label: 'Panels clean' },
      { id: 'indicatorsWork', type: 'checkitem', label: 'Indicators work' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
  {
    id: 'pm-safety-inventory', category: 'Safety', label: 'Inventory safety equipment and maintain repair logs.',
    fields: [
      { id: 'inventoryComplete', type: 'checkitem', label: 'Inventory complete' },
      { id: 'itemsNeeded', type: 'note', label: 'Items needed' },
    ],
  },
  {
    id: 'pm-heater', category: 'Building', label: 'Inspect heater operation.',
    fields: [
      { id: 'heaterRuns', type: 'checkitem', label: 'Heater runs' },
    ],
  },

  // ---- Chemical / metering-pump system ----
  {
    id: 'pm-feed-pump-inspect', category: 'Chemical Feed', label: 'Inspect chemical feed pumps for proper operation.', assetTypes: ['metering_pump'],
    fields: [
      { id: 'noLeaks', type: 'checkitem', label: 'No leaks' },
      { id: 'primeHolds', type: 'checkitem', label: 'Prime holds' },
      { id: 'outputSteady', type: 'checkitem', label: 'Output steady' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
  {
    id: 'pm-feed-pump-catch', category: 'Chemical Feed', label: 'Perform a pump catch and calibrate chemical feed pumps.', assetTypes: ['metering_pump'], hint: 'Use the Dosing tab for the catch-column calc.',
    fields: [
      { id: 'mL', type: 'reading', label: 'Catch volume', unit: 'mL' },
      { id: 'sec', type: 'reading', label: 'Catch time', unit: 'sec' },
      { id: 'expectedGph', type: 'reading', label: 'Expected rate', unit: 'GPH', placeholder: 'from dosing calc' },
    ],
  },
  {
    id: 'pm-feed-lines-tanks', category: 'Chemical Feed', label: 'Inspect and clean chemical feed lines and solution tanks.', assetTypes: ['metering_pump', 'tank'],
    fields: [
      { id: 'linesClear', type: 'checkitem', label: 'Lines clear' },
      { id: 'tanksClean', type: 'checkitem', label: 'Tanks clean' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
  {
    id: 'pm-relief-valves', category: 'Valves', label: 'Check pressure relief valves and back pressure valves.', assetTypes: ['metering_pump', 'centrifugal_pump'], hint: 'The Checks tab flags low back pressure.',
    fields: [
      { id: 'setPressure', type: 'reading', label: 'Set pressure', unit: 'PSI' },
      { id: 'valveTag', type: 'note', label: 'Valve tag' },
    ],
  },

  // ---- Tanks / storage ----
  {
    id: 'pm-chem-tanks-usage', category: 'Tanks', label: 'Check chemical solution tanks and record amounts used (e.g., chlorine, fluoride).', assetTypes: ['tank'],
    fields: [
      { id: 'levelGal', type: 'reading', label: 'Tank level', unit: 'gal' },
      { id: 'addedGal', type: 'reading', label: 'Amount added', unit: 'gal', placeholder: '0 if none' },
      { id: 'chemical', type: 'note', label: 'Chemical' },
    ],
  },
  {
    id: 'pm-storage-levels', category: 'Tanks', label: 'Check and record water levels in storage tanks (local and SCADA).', assetTypes: ['tank'],
    fields: [
      { id: 'levelFt', type: 'reading', label: 'Water level', unit: 'ft' },
      { id: 'source', type: 'select', label: 'Reading source', options: ['local', 'SCADA', 'both'] },
    ],
  },
  {
    id: 'pm-chem-levels', category: 'Tanks', label: 'Check and record chemical levels in chemical tanks (local and SCADA).', assetTypes: ['tank'],
    fields: [
      { id: 'levelGal', type: 'reading', label: 'Chemical level', unit: 'gal' },
      { id: 'source', type: 'select', label: 'Reading source', options: ['local', 'SCADA', 'both'] },
    ],
  },

  // ---- Booster / well pumps (centrifugal) ----
  {
    id: 'pm-booster-inspect', category: 'Pumps', label: 'Inspect booster pump stations (vibration, heat, seals, controls).', assetTypes: ['centrifugal_pump'],
    fields: [
      { id: 'vibrationNormal', type: 'checkitem', label: 'Vibration normal' },
      { id: 'tempNormal', type: 'checkitem', label: 'Temperature normal' },
      { id: 'sealsDry', type: 'checkitem', label: 'Seals dry' },
      { id: 'controlsRespond', type: 'checkitem', label: 'Controls respond' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
  {
    id: 'pm-well-pump-inspect', category: 'Pumps', label: 'Inspect well pumps, motors, and controls for defects, unusual sounds/vibrations, and intact seals.', assetTypes: ['well_pump'],
    fields: [
      { id: 'amps', type: 'reading', label: 'Amps', unit: 'A' },
      { id: 'pumpingRate', type: 'reading', label: 'Pumping rate', unit: 'gpm' },
      { id: 'waterLevelFt', type: 'reading', label: 'Water level', unit: 'ft' },
      { id: 'sealsIntact', type: 'checkitem', label: 'Seals intact' },
      { id: 'noUnusualNoise', type: 'checkitem', label: 'No unusual noise' },
    ],
  },

  // ---- Sump pumps ----
  {
    id: 'pm-sump-check', category: 'Pumps', label: 'Check all sump pumps for proper operation.', assetTypes: ['sump_pump'],
    fields: [
      { id: 'floatTestPass', type: 'checkitem', label: 'Float test pass' },
      { id: 'pumpRuns', type: 'checkitem', label: 'Pump runs' },
      { id: 'note', type: 'note', label: 'Note' },
    ],
  },
];
