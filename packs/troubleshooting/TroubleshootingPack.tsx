import React, { useMemo, useState } from 'react';
import { TROUBLESHOOTING_MATRIX } from '../../constants';
import { TroubleshootingEntry, EQUIPMENT_TYPE_LABELS } from '../../types';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const TroubleshootingPack: React.FC = () => {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [selected, setSelected] = useState<TroubleshootingEntry | null>(null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Scope to the active asset's type unless the operator asks for everything.
  // Entries without assetTypes apply to every asset.
  const scoped = showAll || !activeAsset;
  const items = useMemo(() => {
    const q = search.toLowerCase();
    return TROUBLESHOOTING_MATRIX.filter((i) => {
      const matchesType =
        scoped || !i.assetTypes || (activeAsset && i.assetTypes.includes(activeAsset.type));
      const matchesSearch =
        i.symptom.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [search, scoped, activeAsset]);

  const logFix = async () => {
    if (!selected) return;
    try {
      await logRepo.add({
        equipmentId: activeAssetId,
        kind: 'troubleshoot',
        inputs: { symptom: selected.symptom, category: selected.category },
        outputs: { cause: selected.cause, recommendation: selected.recommendation },
      });
      await refreshEquipment();
      setMsg({ text: `Logged to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose the selection; surface a non-blocking notice.
      setMsg({ text: 'Log failed — selection kept, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      {activeAsset && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">
            Symptoms for{' '}
            <span className="font-semibold text-slate-800">
              {showAll ? 'all asset types' : EQUIPMENT_TYPE_LABELS[activeAsset.type]}
            </span>
            {!showAll && <> · {activeAsset.tag}</>}
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm">
            <button
              onClick={() => setShowAll(false)}
              className={`px-3 py-1.5 font-semibold transition-colors ${
                !showAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              This asset
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-3 py-1.5 font-semibold transition-colors ${
                showAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              All assets
            </button>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search symptoms or categories (e.g. 'noise', 'cavitation', 'cycling')..."
        className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {items.map((item, idx) => (
            <button key={idx} onClick={() => setSelected(item)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.symptom === item.symptom ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
              }`}>
              <span className="text-xs font-bold uppercase text-blue-600">{item.category}</span>
              <p className="font-semibold text-slate-800">{item.symptom}</p>
            </button>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-slate-400">No symptoms found.</div>}
        </div>

        <div className="min-h-[300px]">
          {selected ? (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selected Symptom</h4>
                <p className="text-2xl font-bold text-slate-800">{selected.symptom}</p>
              </div>
              <div>
                <h5 className="text-red-600 font-bold uppercase text-sm mb-2">Primary Root Cause</h5>
                <div className="bg-white p-4 rounded-xl border border-red-100 text-slate-700">{selected.cause}</div>
              </div>
              <div>
                <h5 className="text-green-600 font-bold uppercase text-sm mb-2">Recommendation</h5>
                <div className="bg-white p-4 rounded-xl border border-green-100 text-slate-700">{selected.recommendation}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={logFix}
                  className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors">
                  Log this fix{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
                </button>
                {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-400">
              Select a symptom to view diagnostic steps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPack;
