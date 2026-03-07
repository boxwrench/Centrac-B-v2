
import React, { useState, useMemo } from 'react';
import { CONVERSION_FACTORS } from '../constants';
import InfoCard from './InfoCard';

const SuctionTab: React.FC = () => {
  const [inputs, setInputs] = useState({
    L: 10,  // Length ft
    N: 144, // Speed SPM
    Q: 50,  // Flow GPH
    SG: 1.0,// Specific Gravity
    D: 0.5, // Pipe ID inches
    H_lift: 2 // Static Lift ft
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const results = useMemo(() => {
    const { L, N, Q, SG, D, H_lift } = inputs;
    
    // Acceleration Head (Ha)
    // Ha = (L * N * Q * SG) / (D^2 * 18500)
    // Prevent divide by zero if D is 0
    const Ha = D > 0 ? (L * N * Q * SG) / (Math.pow(D, 2) * CONVERSION_FACTORS.API675_CONSTANT) : 0;
    
    // Static Lift Loss (Ls)
    // Ls = H_lift * 0.433 * SG
    const Ls = H_lift * CONVERSION_FACTORS.WATER_PSI_PER_FOOT * SG;
    
    const totalVacuum = Ha + Ls;
    const isFail = totalVacuum > CONVERSION_FACTORS.VACUUM_LIMIT_PSI;

    return {
      Ha: Ha.toFixed(2),
      Ls: Ls.toFixed(2),
      total: totalVacuum.toFixed(2),
      // Fix: Use explicit type casting to ensure the status is a valid InfoCard status literal. 
      // Previously, 'fail' : 'pass' as const was being incorrectly inferred as string if isFail was true.
      status: (isFail ? 'fail' : 'pass') as 'fail' | 'pass',
      message: isFail 
        ? "CRITICAL FAIL: Vacuum demand exceeds the 12 PSI limit of the HPD return spring. Cavitation or knocking will occur."
        : "PASS: Vacuum demand is within the mechanical limits of the Centrac B pump."
    };
  }, [inputs]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Suction Line Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Pipe Length (L, ft)</label>
            <input 
              type="number" 
              name="L" 
              value={inputs.L} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Pump Speed (N, SPM)</label>
            <input 
              type="number" 
              name="N" 
              value={inputs.N} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Flow Rate (Q, GPH)</label>
            <input 
              type="number" 
              name="Q" 
              value={inputs.Q} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Specific Gravity (SG)</label>
            <input 
              type="number" 
              name="SG" 
              step="0.1"
              value={inputs.SG} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Pipe Inner Diameter (D, inches)</label>
            <input 
              type="number" 
              name="D" 
              step="0.01"
              value={inputs.D} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Static Lift (H_lift, ft)</label>
            <input 
              type="number" 
              name="H_lift" 
              value={inputs.H_lift} 
              onChange={handleInputChange} 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard 
          title="Acceleration Head (Ha)" 
          value={results.Ha} 
          unit="PSI" 
          description="Pressure loss caused by the inertia of the fluid column at stroke start."
        />
        <InfoCard 
          title="Static Lift Loss (Ls)" 
          value={results.Ls} 
          unit="PSI" 
          description="Pressure loss due to the vertical height difference."
        />
        <InfoCard 
          title="Total Vacuum Demand" 
          value={results.total} 
          unit="PSI" 
          status={results.status}
          description={results.message}
        />
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-800 italic">
        <strong>API 675 Note:</strong> Acceleration head is the most common cause of "knocking" in metering pumps. 
        Calculated using: (L * N * Q * SG) / (D² * 18500)
      </div>
    </div>
  );
};

export default SuctionTab;
