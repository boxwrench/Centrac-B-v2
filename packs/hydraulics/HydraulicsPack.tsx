import React, { useMemo, useState } from 'react';
import InfoCard from '../../components/InfoCard';
import { vacuumDemand, dischargePerformance } from '../../engines/hydraulics';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const numField = (label: string, name: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: string) => (
  <div className="space-y-1" key={name}>
    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
    <input type="number" name={name} step={step} value={value} onChange={onChange}
      className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-blue-500" />
  </div>
);

const HydraulicsPack: React.FC = () => {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [suction, setSuction] = useState({ L: 10, N: 144, Q: 50, SG: 1, D: 0.5, H_lift: 2 });
  const [discharge, setDischarge] = useState({ Q_set: 50, P_d: 150 });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const onSuction = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSuction((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const onDischarge = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDischarge((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const suctionResult = useMemo(() => vacuumDemand(suction), [suction]);
  const dischargeResult = useMemo(() => dischargePerformance(discharge), [discharge]);

  const save = async () => {
    try {
      await logRepo.add({
        equipmentId: activeAssetId,
        kind: 'hydraulics',
        inputs: { suction, discharge },
        outputs: {
          Ha: Number(suctionResult.Ha.toFixed(2)),
          Ls: Number(suctionResult.Ls.toFixed(2)),
          vacuumTotal: Number(suctionResult.total.value.toFixed(2)),
          vacuumStatus: suctionResult.total.status,
          peakFlow: Number(dischargeResult.peakFlow.toFixed(2)),
          actualFlow: Number(dischargeResult.actualFlow.toFixed(2)),
          deratingLossPercent: Number(dischargeResult.deratingLossPercent.toFixed(1)),
        },
      });
      await refreshEquipment();
      setMsg({ text: `Saved to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose what is on screen; surface a non-blocking notice.
      setMsg({ text: 'Save failed — result is still on screen, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Suction &amp; Acceleration Head</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {numField('Pipe Length (L, ft)', 'L', suction.L, onSuction)}
          {numField('Pump Speed (N, SPM)', 'N', suction.N, onSuction)}
          {numField('Flow Rate (Q, GPH)', 'Q', suction.Q, onSuction)}
          {numField('Specific Gravity (SG)', 'SG', suction.SG, onSuction, '0.1')}
          {numField('Pipe Inner Diameter (D, in)', 'D', suction.D, onSuction, '0.01')}
          {numField('Static Lift (H_lift, ft)', 'H_lift', suction.H_lift, onSuction)}
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

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Discharge &amp; Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {numField('Set Flow Rate (GPH)', 'Q_set', discharge.Q_set, onDischarge)}
          {numField('System Discharge Pressure (PSI)', 'P_d', discharge.P_d, onDischarge)}
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

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors">
          Save to log{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
};

export default HydraulicsPack;
