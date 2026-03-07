
import React, { useState, useMemo } from 'react';
import { CONVERSION_FACTORS } from '../constants';
import InfoCard from './InfoCard';

const DischargeTab: React.FC = () => {
  const [inputs, setInputs] = useState({
    Q_set: 50,
    P_d: 150
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const results = useMemo(() => {
    const { Q_set, P_d } = inputs;
    
    // 1. Peak Flow Rate
    const Q_peak = Q_set * Math.PI;

    // 2. Back Pressure Check
    const backPressureOk = P_d >= CONVERSION_FACTORS.MIN_BACK_PRESSURE_PSI;

    // 3. High Pressure Derating
    // 0.8% loss per 100 psi over 200 psi
    let lossPercent = 0;
    if (P_d > CONVERSION_FACTORS.DERATING_THRESHOLD_PSI) {
      const deltaP = P_d - CONVERSION_FACTORS.DERATING_THRESHOLD_PSI;
      lossPercent = (deltaP / 100) * CONVERSION_FACTORS.DERATING_LOSS_RATE * 100;
    }
    const Q_actual = Q_set * (1 - (lossPercent / 100));

    return {
      peak: Q_peak.toFixed(2),
      // Fix: Const assertions can only be applied to literals, not the result of an expression.
      // Use explicit type casting for backPressureStatus.
      backPressureStatus: (backPressureOk ? 'pass' : 'warning') as 'pass' | 'warning',
      backPressureMsg: backPressureOk 
        ? "Back pressure is sufficient to seat check valve balls." 
        : "Low back pressure! Ball valves may float, causing inaccuracy.",
      lossPercent: lossPercent.toFixed(1),
      actualFlow: Q_actual.toFixed(2)
    };
  }, [inputs]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Discharge Side Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Set Flow Rate (GPH)</label>
            <input 
              type="number" 
              name="Q_set" 
              value={inputs.Q_set} 
              onChange={handleInputChange} 
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
            />
            <p className="text-[10px] text-slate-400">Average flow rate intended by operator.</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">System Discharge Pressure (PSI)</label>
            <input 
              type="number" 
              name="P_d" 
              value={inputs.P_d} 
              onChange={handleInputChange} 
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
            />
            <p className="text-[10px] text-slate-400">Read from the discharge pressure gauge.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard 
          title="Calculated Peak Flow" 
          value={results.peak} 
          unit="GPH" 
          description="Piping and relief valves must be sized for this instantaneous peak, not the average."
        />
        <InfoCard 
          title="Back Pressure Status" 
          value={inputs.P_d} 
          unit="PSI" 
          status={results.backPressureStatus}
          description={results.backPressureMsg}
        />
        <InfoCard 
          title="Estimated Actual Flow" 
          value={results.actualFlow} 
          unit="GPH" 
          // Fix: Ensure the inline ternary expression is cast to valid InfoCard status literals.
          status={(parseFloat(results.lossPercent) > 0 ? 'warning' : 'pass') as 'warning' | 'pass'}
          description={`Includes ${results.lossPercent}% volumetric loss due to high-pressure derating.`}
        />
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500 text-sm text-amber-900">
        <h5 className="font-bold mb-1">Engineering Insight:</h5>
        Reciprocating pumps follow a sinusoidal velocity profile. The "Peak" flow occurs during the middle of the discharge stroke. 
        Fluid compression and diaphragm deformation reduce volumetric efficiency at high pressures (&gt;200 PSI).
      </div>
    </div>
  );
};

export default DischargeTab;
