import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { evaluateSump } from '../../engines/sump';
import { NumField, SaveBar, r2 } from './checkKit';
import { useLogSave } from '../../state/useLogSave';

const fmt = (n: number, unit: string) => (Number.isFinite(n) ? `${n.toFixed(1)} ${unit}` : '∞');

/** Sump / lift-station pump checks: capacity vs inflow and cycle behaviour. */
const SumpChecks: React.FC = () => {
  const { save, msg, activeAsset } = useLogSave('hydraulics');
  const [i, setI] = useState({ Q_pump: 50, Q_in: 20, drawVolume: 100, maxStartsPerHour: 10 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setI((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const res = useMemo(() => evaluateSump(i), [i]);

  const onSave = () =>
    save(i, {
      pumpDownTime: r2(res.pumpDownTime),
      fillTime: r2(res.fillTime),
      cycleTime: r2(res.cycleTime),
      cyclesPerHour: r2(res.cyclesPerHour),
      capacityStatus: res.capacity.status,
      cyclingStatus: res.cycling.status,
    });

  return (
    <div className="space-y-8">
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Capacity &amp; Cycling</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumField label="Pump Capacity (gpm)" name="Q_pump" value={i.Q_pump} onChange={onChange} />
          <NumField label="Inflow (gpm)" name="Q_in" value={i.Q_in} onChange={onChange} />
          <NumField label="Drawdown Volume (gal)" name="drawVolume" value={i.drawVolume} onChange={onChange} />
          <NumField label="Max Starts / Hour" name="maxStartsPerHour" value={i.maxStartsPerHour} onChange={onChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InfoCard title="Keeps Up With Inflow" value={fmt(res.capacity.value as number, 'gpm net')}
            status={res.capacity.status} description={res.capacity.message} />
          <InfoCard title="Cycle Rate" value={fmt(res.cyclesPerHour, 'starts/hr')}
            status={res.cycling.status} description={res.cycling.message} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoCard title="Pump-Down Time" value={fmt(res.pumpDownTime, 'min')}
            description="Running time to draw the sump from start to stop float." />
          <InfoCard title="Fill Time" value={fmt(res.fillTime, 'min')}
            description="Time to refill from stop to start float with the pump off." />
          <InfoCard title="Full Cycle Time" value={fmt(res.cycleTime, 'min')}
            description="One complete off/on cycle; shorter cycles mean more motor starts." />
        </div>
      </section>

      <SaveBar onSave={onSave} msg={msg} tag={activeAsset?.tag} />
    </div>
  );
};

export default SumpChecks;
