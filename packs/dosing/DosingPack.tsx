import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/ui/InfoCard';
import { drawdownGph, dosingGph } from '../../engines/dosing';
import { useLogSave } from '../../state/useLogSave';

const DosingPack: React.FC = () => {
  const { save: saveLog, msg, activeAsset } = useLogSave('dosing');
  const [drawdown, setDrawdown] = useState({ mL: 100, sec: 60 });
  const [dosing, setDosing] = useState({ mgd: 1, ppm: 2, density: 8.34 });

  const gph = useMemo(() => drawdownGph(drawdown.mL, drawdown.sec), [drawdown]);
  const requiredGph = useMemo(() => dosingGph(dosing), [dosing]);

  const save = () =>
    saveLog(
      { drawdown, dosing },
      { drawdownGph: Number(gph.toFixed(2)), requiredGph: Number(requiredGph.toFixed(2)) },
    );

  return (
    <div className="space-y-8">
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Drawdown (Catch Column) Calibration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Volume Measured (mL)</label>
            <input type="number" value={drawdown.mL}
              onChange={(e) => setDrawdown({ ...drawdown, mL: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Time Elapsed (Seconds)</label>
            <input type="number" value={drawdown.sec}
              onChange={(e) => setDrawdown({ ...drawdown, sec: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="lg:col-span-2">
            <InfoCard title="Calculated Output" value={gph.toFixed(2)} unit="GPH" status="neutral"
              description="GPH = (Volume_mL / Time_sec) * 0.951" />
          </div>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Chemical Dosage to Pump Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Plant Flow (MGD)</label>
            <input type="number" value={dosing.mgd}
              onChange={(e) => setDosing({ ...dosing, mgd: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Target Dosage (PPM)</label>
            <input type="number" value={dosing.ppm}
              onChange={(e) => setDosing({ ...dosing, ppm: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Chem Density (lb/gal)</label>
            <input type="number" value={dosing.density}
              onChange={(e) => setDosing({ ...dosing, density: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono" />
          </div>
          <div>
            <InfoCard title="Required Pump Rate" value={requiredGph.toFixed(2)} unit="GPH" status="neutral"
              description="GPH = (MGD * PPM * 8.34) / (Density * 24)" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="bg-orange-700 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-orange-800 transition-colors">
          Save to log{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
};

export default DosingPack;
