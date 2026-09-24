import React, { useMemo, useState } from 'react';
import { TROUBLESHOOTING_MATRIX } from '../../constants';
import { TroubleshootingEntry, EQUIPMENT_TYPE_LABELS } from '../../types';
import { useLogSave } from '../../state/useLogSave';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import { useNav } from '../../state/NavContext';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import { TroubleshootingGuide } from '../model/ServiceGuides';

type TroubleView = 'centrac' | 'plant';

const PlantSymptoms: React.FC = () => {
  const { activeAsset } = useActiveAsset();
  const { save, msg } = useLogSave('troubleshoot', { done: 'Logged to', failed: 'Log failed — selection kept, try again' });
  const [selected, setSelected] = useState<TroubleshootingEntry | null>(null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

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

  const severityBadgeClass = (severity?: 'monitor' | 'action' | 'urgent') => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'action':
        return 'bg-amber-100 text-amber-700';
      case 'monitor':
        return 'bg-slate-100 text-slate-600';
      default:
        return '';
    }
  };

  const logFix = async () => {
    if (!selected) return;
    await save(
      { symptom: selected.symptom, category: selected.category },
      { cause: selected.cause, recommendation: selected.recommendation },
    );
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line space-y-6">
      {activeAsset && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">
            Symptoms for{' '}
            <span className="font-semibold text-slate-800">
              {showAll ? 'all asset types' : EQUIPMENT_TYPE_LABELS[activeAsset.type]}
            </span>
            {!showAll && <> · {activeAsset.tag}</>}
          </span>
          <div className="inline-flex rounded-lg border border-line overflow-hidden text-sm">
            <button
              onClick={() => setShowAll(false)}
              className={`px-3 py-1.5 font-semibold transition-colors ${
                !showAll ? 'bg-orange-700 text-white' : 'bg-surface text-slate-600 hover:bg-raised'
              }`}
            >
              This asset
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-3 py-1.5 font-semibold transition-colors ${
                showAll ? 'bg-orange-700 text-white' : 'bg-surface text-slate-600 hover:bg-raised'
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
        className="w-full p-4 bg-raised border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {items.map((item, idx) => (
            <button key={idx} onClick={() => setSelected(item)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.symptom === item.symptom ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-line hover:bg-raised'
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-orange-700">{item.category}</span>
                {item.severity && item.severity !== 'monitor' && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${severityBadgeClass(item.severity)}`}>
                    {item.severity}
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800">{item.symptom}</p>
            </button>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-slate-500">No symptoms found.</div>}
        </div>

        <div className="min-h-[300px]">
          {selected ? (
            <div className="bg-raised rounded-2xl border-2 border-dashed border-slate-300 p-8 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Selected Symptom</h4>
                <p className="text-2xl font-bold text-slate-800">{selected.symptom}</p>
              </div>
              <div>
                <h5 className="text-red-600 font-bold uppercase text-sm mb-2">Primary Root Cause</h5>
                <div className="bg-surface p-4 rounded-xl border border-red-100 text-slate-700">{selected.cause}</div>
              </div>
              <div>
                <h5 className="text-green-600 font-bold uppercase text-sm mb-2">Recommendation</h5>
                <div className="bg-surface p-4 rounded-xl border border-green-100 text-slate-700">{selected.recommendation}</div>
              </div>
              {selected.escalate && (
                <div>
                  <h5 className={`font-bold uppercase text-sm mb-2 ${selected.severity === 'urgent' ? 'text-red-600' : 'text-amber-600'}`}>
                    Escalate If&hellip;
                  </h5>
                  <div
                    className={`p-4 rounded-xl border text-sm font-medium ${
                      selected.severity === 'urgent'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {selected.escalate}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={logFix}
                  className="bg-orange-700 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-orange-800 transition-colors">
                  Log this fix{activeAsset ? ` · ${activeAsset.tag}` : ' · Unassigned'}
                </button>
                {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
              </div>
            </div>
          ) : (
            <div className="bg-raised rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-500">
              Select a symptom to view diagnostic steps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TroubleshootingPack: React.FC = () => {
  const { activeAsset } = useActiveAsset();
  const { openManual, openPart } = useNav();
  const [view, setView] = useState<TroubleView>(() =>
    !activeAsset || activeAsset.type === 'metering_pump' ? 'centrac' : 'plant',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Troubleshoot"
        subtitle="Start from the symptom. Manual-backed guidance for the Centrac B, plus the plant symptom matrix."
      >
        <Segmented
          label="Troubleshooting view"
          value={view}
          onChange={setView}
          options={[
            { id: 'centrac', label: 'Centrac B · O&M manual' },
            { id: 'plant', label: 'Plant symptoms' },
          ]}
        />
      </PageHeader>
      {view === 'centrac' ? (
        <div className="cb-model">
          <div className="explorer explorer-embed">
            <TroubleshootingGuide onManual={openManual} onPart={openPart} />
          </div>
        </div>
      ) : (
        <PlantSymptoms />
      )}
    </div>
  );
};

export default TroubleshootingPack;
