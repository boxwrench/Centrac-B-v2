
import React, { useState, useMemo } from 'react';
import { CONVERSION_FACTORS } from '../constants';
import InfoCard from './InfoCard';

const CalibrationTab: React.FC = () => {
  const [drawdown, setDrawdown] = useState({ mL: 100, sec: 60 });
  const [dosing, setDosing] = useState({ mgd: 1, ppm: 2, density: 8.34 });

  const gphResult = useMemo(() => {
    if (drawdown.sec === 0) return "0.00";
    // GPH = (mL / sec) * 0.951
    return ((drawdown.mL / drawdown.sec) * CONVERSION_FACTORS.DRAWDOWN_GPH_FACTOR).toFixed(2);
  }, [drawdown]);

  const dosingResult = useMemo(() => {
    if (dosing.density === 0) return "0.00";
    // GPH = (MGD * PPM * 8.34) / (Density * 24)
    return ((dosing.mgd * dosing.ppm * CONVERSION_FACTORS.WATER_LB_PER_GAL) / (dosing.density * CONVERSION_FACTORS.HOURS_PER_DAY)).toFixed(2);
  }, [dosing]);

  return (
    <div className="space-y-8">
      {/* Drawdown Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
          Drawdown (Catch Column) Calibration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Volume Measured (mL)</label>
            <input 
              type="number" 
              value={drawdown.mL} 
              onChange={e => setDrawdown({...drawdown, mL: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Time Elapsed (Seconds)</label>
            <input 
              type="number" 
              value={drawdown.sec} 
              onChange={e => setDrawdown({...drawdown, sec: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div className="lg:col-span-2">
             <InfoCard title="Calculated Output" value={gphResult} unit="GPH" status="neutral" />
          </div>
        </div>
      </section>

      {/* Dosing Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">2</span>
          Chemical Dosage to Pump Rate
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Plant Flow (MGD)</label>
            <input 
              type="number" 
              value={dosing.mgd} 
              onChange={e => setDosing({...dosing, mgd: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Target Dosage (PPM)</label>
            <input 
              type="number" 
              value={dosing.ppm} 
              onChange={e => setDosing({...dosing, ppm: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Chem Density (lb/gal)</label>
            <input 
              type="number" 
              value={dosing.density} 
              onChange={e => setDosing({...dosing, density: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div>
            <InfoCard title="Required Pump Rate" value={dosingResult} unit="GPH" status="neutral" />
          </div>
        </div>
      </section>

      <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-bold uppercase mb-1">GPH Formula:</p>
          <code className="bg-white px-2 py-1 rounded border">(Volume_mL / Time_sec) * 0.951</code>
        </div>
        <div>
          <p className="font-bold uppercase mb-1">Dosing Formula:</p>
          <code className="bg-white px-2 py-1 rounded border">(MGD * PPM * 8.34) / (Density * 24)</code>
        </div>
      </div>
    </div>
  );
};

export default CalibrationTab;
