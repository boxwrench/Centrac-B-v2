import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { evaluateCentrifugal } from '../../engines/centrifugal';
import { NumField, SaveBar, r2 } from './checkKit';
import { useLogSave } from '../../state/useLogSave';

/** Centrifugal (transfer/process water) pump checks: TDH, NPSH margin, horsepower. */
const CentrifugalChecks: React.FC = () => {
  const { save, msg, activeAsset } = useLogSave('hydraulics');
  const [i, setI] = useState({ Q: 100, P_suction: 5, P_discharge: 60, SG: 1, NPSHr: 8, efficiency: 70 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setI((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const res = useMemo(() => evaluateCentrifugal(i), [i]);

  const onSave = () =>
    save(i, {
      tdh: r2(res.tdh),
      npsha: r2(res.npsha),
      npshMargin: r2(res.npshMargin.value),
      npshStatus: res.npshMargin.status,
      whp: r2(res.whp),
      bhp: r2(res.bhp),
    });

  return (
    <div className="space-y-8">
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Head &amp; NPSH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Flow (Q, gpm)" name="Q" value={i.Q} onChange={onChange} />
          <NumField label="Suction Gauge (PSI, − = vacuum)" name="P_suction" value={i.P_suction} onChange={onChange} step="0.1" />
          <NumField label="Discharge Gauge (PSI)" name="P_discharge" value={i.P_discharge} onChange={onChange} step="0.1" />
          <NumField label="Specific Gravity (SG)" name="SG" value={i.SG} onChange={onChange} step="0.01" />
          <NumField label="NPSH Required (ft, from curve)" name="NPSHr" value={i.NPSHr} onChange={onChange} step="0.1" />
          <NumField label="Pump Efficiency (%)" name="efficiency" value={i.efficiency} onChange={onChange} step="1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Total Dynamic Head" value={res.tdh.toFixed(1)} unit="ft"
            description="Head the pump develops between suction and discharge gauges." />
          <InfoCard title="NPSH Available" value={res.npsha.toFixed(1)} unit="ft"
            description="Absolute suction head above vapor pressure at the flange." />
          <InfoCard title="NPSH Margin" value={res.npshMargin.value.toFixed(1)} unit="ft"
            status={res.npshMargin.status} description={res.npshMargin.message} />
        </div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Power</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard title="Water Horsepower" value={res.whp.toFixed(2)} unit="WHP"
            description="Hydraulic power delivered to the fluid." />
          <InfoCard title="Brake Horsepower" value={res.bhp.toFixed(2)} unit="BHP"
            status={res.bhp > 0 ? 'neutral' : 'warning'}
            description="Shaft power required at this operating point; must not exceed the motor rating." />
        </div>
      </section>

      <SaveBar onSave={onSave} msg={msg} tag={activeAsset?.tag} />
    </div>
  );
};

export default CentrifugalChecks;
