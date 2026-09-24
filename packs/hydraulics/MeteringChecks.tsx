import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { vacuumDemand, dischargePerformance } from '../../engines/hydraulics';
import { NumField, SaveBar, r2 } from './checkKit';
import { useLogSave } from '../../state/useLogSave';

/** Metering (Centrac B feed) pump checks: API 675 suction + discharge performance. */
const MeteringChecks: React.FC = () => {
  const { save, msg, activeAsset } = useLogSave('hydraulics');
  const [suction, setSuction] = useState({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 });
  const [discharge, setDischarge] = useState({ Q_set: 50, P_d: 150 });

  const onSuction = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSuction((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const onDischarge = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDischarge((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const suctionResult = useMemo(() => vacuumDemand(suction), [suction]);
  const dischargeResult = useMemo(() => dischargePerformance(discharge), [discharge]);

  const onSave = () =>
    save(
      { suction, discharge },
      {
        Ha: r2(suctionResult.Ha),
        Ls: r2(suctionResult.Ls),
        vacuumTotal: r2(suctionResult.total.value),
        vacuumStatus: suctionResult.total.status,
        peakFlow: r2(dischargeResult.peakFlow),
        actualFlow: r2(dischargeResult.actualFlow),
        deratingLossPercent: r2(dischargeResult.deratingLossPercent),
      },
    );

  return (
    <div className="space-y-8">
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Suction &amp; Acceleration Head</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Pipe Length (L, ft)" name="L" value={suction.L} onChange={onSuction} />
          <NumField label="Pump Speed (N, SPM)" name="N" value={suction.N} onChange={onSuction} />
          <NumField label="Flow Rate (Q, GPH)" name="Q" value={suction.Q} onChange={onSuction} />
          <NumField label="Specific Gravity (SG)" name="SG" value={suction.SG} onChange={onSuction} step="0.1" />
          <NumField label="Pipe Inner Diameter (D, in)" name="D" value={suction.D} onChange={onSuction} step="0.01" />
          <NumField label="Static Lift (H_lift, ft)" name="H_lift" value={suction.H_lift} onChange={onSuction} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Acceleration Head (Ha)" value={suctionResult.Ha.toFixed(2)} unit="PSI"
            description="Pressure loss from fluid inertia at stroke start." />
          <InfoCard title="Static Lift Loss (Ls)" value={suctionResult.Ls.toFixed(2)} unit="PSI"
            description="Loss due to vertical height difference." />
          <InfoCard title="Total Vacuum Demand" value={suctionResult.total.value.toFixed(2)} unit="PSI"
            status={suctionResult.total.status} description={suctionResult.total.message} />
        </div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Discharge &amp; Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumField label="Set Flow Rate (GPH)" name="Q_set" value={discharge.Q_set} onChange={onDischarge} />
          <NumField label="System Discharge Pressure (PSI)" name="P_d" value={discharge.P_d} onChange={onDischarge} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Calculated Peak Flow" value={dischargeResult.peakFlow.toFixed(2)} unit="GPH"
            description="Size piping/relief for this instantaneous peak, not the average." />
          <InfoCard title="Back Pressure Status" value={discharge.P_d} unit="PSI"
            status={dischargeResult.backPressure.status} description={dischargeResult.backPressure.message} />
          <InfoCard title="Estimated Actual Flow" value={dischargeResult.actualFlow.toFixed(2)} unit="GPH"
            status={dischargeResult.deratingLossPercent > 0 ? 'warning' : 'pass'}
            description={`Includes ${dischargeResult.deratingLossPercent.toFixed(1)}% high-pressure derating loss.`} />
        </div>
      </section>

      <SaveBar onSave={onSave} msg={msg} tag={activeAsset?.tag} />
    </div>
  );
};

export default MeteringChecks;
