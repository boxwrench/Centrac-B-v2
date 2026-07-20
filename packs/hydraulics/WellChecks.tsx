import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { specificCapacity } from '../../engines/rounds';
import { NumField, SaveBar, useCheckSave, r2 } from './checkKit';

const fmt = (n: number, unit: string) => (Number.isFinite(n) ? `${n.toFixed(1)} ${unit}` : '∞');

/** Well pump checks: drawdown and specific capacity from static/pumping levels and rate. */
const WellChecks: React.FC = () => {
  const { save, msg, activeAsset } = useCheckSave();
  const [i, setI] = useState({ staticLevelFt: 50, pumpingLevelFt: 80, rateGpm: 100 });
  const [note, setNote] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setI((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const drawdown = useMemo(() => i.pumpingLevelFt - i.staticLevelFt, [i.pumpingLevelFt, i.staticLevelFt]);
  const specCap = useMemo(() => specificCapacity(i.rateGpm, drawdown), [i.rateGpm, drawdown]);

  const onSave = () =>
    save(
      { ...i, trendNote: note },
      { drawdown: r2(drawdown), specificCapacity: r2(specCap), trendNote: note }
    );

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Drawdown &amp; Specific Capacity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Static Level (ft)" name="staticLevelFt" value={i.staticLevelFt} onChange={onChange} />
          <NumField label="Pumping Level (ft)" name="pumpingLevelFt" value={i.pumpingLevelFt} onChange={onChange} />
          <NumField label="Rate (gpm)" name="rateGpm" value={i.rateGpm} onChange={onChange} />
        </div>
        <div className="space-y-1 mt-4">
          <label className="text-xs font-semibold text-slate-500 uppercase">Trend Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations on level trend over time..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InfoCard title="Drawdown" value={fmt(drawdown, 'ft')}
            description="Pumping level minus static level." />
          <InfoCard title="Specific Capacity" value={fmt(specCap, 'gpm/ft')} status="neutral"
            description="Yield per foot of drawdown; falling trend can signal well fouling or aquifer decline." />
        </div>
      </section>

      <SaveBar onSave={onSave} msg={msg} tag={activeAsset?.tag} />
    </div>
  );
};

export default WellChecks;
