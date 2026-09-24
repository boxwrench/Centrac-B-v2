import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import DosingPack from '../dosing/DosingPack';
import HydraulicsPack from '../hydraulics/HydraulicsPack';

type CalcsView = 'dosing' | 'checks';

/** Calibration/dosing math and equipment performance checks, merged under one tab. */
const CalcsPack: React.FC = () => {
  const { activeAsset } = useActiveAsset();
  const [view, setView] = useState<CalcsView>(() =>
    !activeAsset || activeAsset.type === 'metering_pump' ? 'dosing' : 'checks',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculators"
        subtitle="Calibration, dosing and equipment performance checks, saved to the active asset."
      >
        <Segmented
          label="Calculator view"
          value={view}
          onChange={setView}
          options={[
            { id: 'dosing', label: 'Dosing & calibration' },
            { id: 'checks', label: 'Equipment checks' },
          ]}
        />
      </PageHeader>
      {view === 'dosing' ? <DosingPack /> : <HydraulicsPack />}
    </div>
  );
};

export default CalcsPack;
