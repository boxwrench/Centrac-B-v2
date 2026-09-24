import React, { useEffect, useState } from 'react';
import { equipmentRepo } from '../../db/equipmentRepo';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import { Equipment, EquipmentType, EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS, LogEntry } from '../../types';
import PageHeader from '../../components/ui/PageHeader';

const TYPES: EquipmentType[] = EQUIPMENT_TYPES;

const EquipmentPack: React.FC = () => {
  const { equipment, refreshEquipment, activeAssetId, setActiveAssetId } = useActiveAsset();
  const [tag, setTag] = useState('');
  const [type, setType] = useState<EquipmentType>('metering_pump');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (activeAssetId) logRepo.listByEquipment(activeAssetId).then(setHistory);
    else setHistory([]);
  }, [activeAssetId, equipment]);

  const addEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim()) return;
    const created = await equipmentRepo.add({
      tag: tag.trim(),
      type,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
    });
    setTag('');
    setMake('');
    setModel('');
    await refreshEquipment();
    setActiveAssetId(created.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="Your plant's equipment register. Pick the active asset in the header; everything you log is saved against it."
      />

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Add Equipment</h3>
        <form onSubmit={addEquipment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tag *</label>
            <input value={tag} onChange={(e) => setTag(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Chlorine Pump 1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as EquipmentType)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white">
              {TYPES.map((t) => <option key={t} value={t}>{EQUIPMENT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Make</label>
            <input value={make} onChange={(e) => setMake(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Milton Roy" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Model</label>
            <input value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="Centrac B" />
          </div>
          <button type="submit"
            className="md:col-span-4 lg:col-span-1 bg-orange-700 text-white font-semibold rounded-lg px-4 py-2 hover:bg-orange-800 transition-colors">
            Add
          </button>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Equipment ({equipment.length})</h3>
        {equipment.length === 0 ? (
          <p className="text-slate-400 text-sm">No equipment yet. Add a pump or tank above.</p>
        ) : (
          <div className="space-y-2">
            {equipment.map((eq: Equipment) => (
              <button key={eq.id} onClick={() => setActiveAssetId(eq.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeAssetId === eq.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">{eq.tag}</span>
                  <span className="text-xs uppercase text-slate-400">{EQUIPMENT_TYPE_LABELS[eq.type]}</span>
                </div>
                {(eq.make || eq.model) && (
                  <p className="text-xs text-slate-500">{[eq.make, eq.model].filter(Boolean).join(' · ')}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          History {activeAssetId ? `(${history.length})` : ''}
        </h3>
        {!activeAssetId ? (
          <p className="text-slate-400 text-sm">Select an asset to see its saved results.</p>
        ) : history.length === 0 ? (
          <p className="text-slate-400 text-sm">No saved results for this asset yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold uppercase text-orange-700 text-xs">{h.kind}</span>
                  <span className="text-xs text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <p className="font-mono text-xs text-slate-600 mt-1 break-all">{JSON.stringify(h.outputs)}</p>
                {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EquipmentPack;
