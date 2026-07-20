
import React, { useState } from 'react';
import { AppTab } from './types';
import { ActiveAssetProvider } from './state/ActiveAssetContext';
import { useOnlineStatus } from './state/useOnlineStatus';
import AssetPicker from './components/ui/AssetPicker';
import EquipmentPack from './packs/equipment/EquipmentPack';
import DosingPack from './packs/dosing/DosingPack';
import HydraulicsPack from './packs/hydraulics/HydraulicsPack';
import TroubleshootingPack from './packs/troubleshooting/TroubleshootingPack';

const TABS: { id: AppTab; label: string }[] = [
  { id: AppTab.ASSETS, label: 'Assets' },
  { id: AppTab.DOSING, label: 'Dosing' },
  { id: AppTab.HYDRAULICS, label: 'Hydraulics' },
  { id: AppTab.TROUBLESHOOTING, label: 'Troubleshooting' },
];

const AppInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ASSETS);
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-xl px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Centrac B Field Operator</h1>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Plant Operator Toolkit v2</p>
          </div>
          <div className="flex items-center gap-3">
            <AssetPicker />
            <span className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-slate-500'}`}></span>
              {online ? 'Online' : 'Offline'} · Works offline
            </span>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-[72px] md:top-[80px] z-40 overflow-x-auto whitespace-nowrap">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-4 md:gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-semibold transition-all border-b-2 outline-none ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
        {activeTab === AppTab.ASSETS && <EquipmentPack />}
        {activeTab === AppTab.DOSING && <DosingPack />}
        {activeTab === AppTab.HYDRAULICS && <HydraulicsPack />}
        {activeTab === AppTab.TROUBLESHOOTING && <TroubleshootingPack />}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
          © {new Date().getFullYear()} Centrac B Field Operator · API 675 Reference · Local-First / Offline
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <ActiveAssetProvider>
    <AppInner />
  </ActiveAssetProvider>
);

export default App;
