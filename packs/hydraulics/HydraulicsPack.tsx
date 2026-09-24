import React from 'react';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import { EQUIPMENT_TYPE_LABELS } from '../../types';
import MeteringChecks from './MeteringChecks';
import CentrifugalChecks from './CentrifugalChecks';
import SumpChecks from './SumpChecks';
import BasinChecks from './BasinChecks';
import WellChecks from './WellChecks';

/**
 * Asset-aware checks tab. The calculators shown adapt to the type of the active
 * asset: metering pumps get API 675 suction/discharge, centrifugal pumps get
 * TDH/NPSH/horsepower, sump pumps get capacity/cycling, basins get detention
 * time and freeboard. Tanks/other fall back to the basin checks (volume-based).
 */
const HydraulicsPack: React.FC = () => {
  const { activeAsset } = useActiveAsset();
  const type = activeAsset?.type ?? 'metering_pump';

  const banner = activeAsset ? (
    <div className="bg-slate-100 border border-line rounded-xl px-4 py-3 text-sm text-slate-600">
      Showing <span className="font-semibold text-slate-800">{EQUIPMENT_TYPE_LABELS[type]}</span> checks for{' '}
      <span className="font-semibold text-slate-800">{activeAsset.tag}</span>.
    </div>
  ) : (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
      No asset selected — showing metering-pump checks. Pick an asset to see checks for that equipment type.
    </div>
  );

  let panel: React.ReactNode;
  switch (type) {
    case 'centrifugal_pump':
      panel = <CentrifugalChecks />;
      break;
    case 'sump_pump':
      panel = <SumpChecks />;
      break;
    case 'well_pump':
      panel = <WellChecks />;
      break;
    case 'basin':
    case 'tank':
      panel = <BasinChecks />;
      break;
    case 'other':
      panel = (
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line text-slate-600 text-sm">
          No specific checks for this asset type yet. Use Troubleshooting, or reclassify the asset to a pump,
          basin, or tank to run performance checks.
        </div>
      );
      break;
    case 'metering_pump':
    default:
      panel = <MeteringChecks />;
      break;
  }

  return (
    <div className="space-y-6">
      {banner}
      {panel}
    </div>
  );
};

export default HydraulicsPack;
