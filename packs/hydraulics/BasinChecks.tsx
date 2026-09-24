import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { evaluateBasin } from '../../engines/basin';
import { NumField, SaveBar, r2 } from './checkKit';
import { useLogSave } from '../../state/useLogSave';

const fmt = (n: number, unit: string) => (Number.isFinite(n) ? `${n.toFixed(1)} ${unit}` : '∞');

/** Basin / tank checks: volume, detention time, surface loading, freeboard. */
const BasinChecks: React.FC = () => {
  const { save, msg, activeAsset } = useLogSave('hydraulics');
  const [i, setI] = useState({ length: 20, width: 10, waterDepth: 8, wallHeight: 10, Q_gpm: 50 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setI((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const res = useMemo(() => evaluateBasin(i), [i]);

  const onSave = () =>
    save(i, {
      volumeGal: r2(res.volumeGal),
      detentionTimeHr: r2(res.detentionTimeHr),
      surfaceOverflowRate: r2(res.surfaceOverflowRate),
      freeboard: r2(res.freeboard.value),
      freeboardStatus: res.freeboard.status,
    });

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Basin Geometry &amp; Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Length (ft)" name="length" value={i.length} onChange={onChange} />
          <NumField label="Width (ft)" name="width" value={i.width} onChange={onChange} />
          <NumField label="Operating Water Depth (ft)" name="waterDepth" value={i.waterDepth} onChange={onChange} step="0.1" />
          <NumField label="Wall Height (ft)" name="wallHeight" value={i.wallHeight} onChange={onChange} step="0.1" />
          <NumField label="Flow Through Basin (gpm)" name="Q_gpm" value={i.Q_gpm} onChange={onChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InfoCard title="Working Volume" value={res.volumeGal.toFixed(0)} unit="gal"
            description="Volume at the operating water level." />
          <InfoCard title="Detention Time" value={fmt(res.detentionTimeHr, 'hr')}
            description="Average time a drop of water spends in the basin at this flow." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InfoCard title="Surface Overflow Rate" value={res.surfaceOverflowRate.toFixed(0)} unit="gpd/ft²"
            description="Daily flow per unit surface area — key for settling basins/clarifiers." />
          <InfoCard title="Freeboard" value={res.freeboard.value.toFixed(2)} unit="ft"
            status={res.freeboard.status} description={res.freeboard.message} />
        </div>
      </section>

      <SaveBar onSave={onSave} msg={msg} tag={activeAsset?.tag} />
    </div>
  );
};

export default BasinChecks;
