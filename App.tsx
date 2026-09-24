import React, { useEffect, useState } from 'react';
import { Box, BookOpen, Stethoscope, Wrench, Calculator, ClipboardList, Warehouse, type LucideIcon } from 'lucide-react';
import { AppTab } from './types';
import { ActiveAssetProvider } from './state/ActiveAssetContext';
import { NavProvider, useNav } from './state/NavContext';
import { useOnlineStatus } from './state/useOnlineStatus';
import AssetPicker from './components/ui/AssetPicker';
import EquipmentPack from './packs/equipment/EquipmentPack';
import CalcsPack from './packs/calcs/CalcsPack';
import MaintenancePack from './packs/maintenance/MaintenancePack';
import ReportPack from './packs/report/ReportPack';
import TroubleshootingPack from './packs/troubleshooting/TroubleshootingPack';
import ModelPack from './packs/model/ModelPack';

// Order follows the tech's day: see the pump, read the manual, diagnose, service, measure, record.
const TABS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: AppTab.MODEL, label: '3D Model', icon: Box },
  { id: AppTab.MANUAL, label: 'Manual', icon: BookOpen },
  { id: AppTab.TROUBLESHOOTING, label: 'Troubleshoot', icon: Stethoscope },
  { id: AppTab.MAINTENANCE, label: 'Maintenance', icon: Wrench },
  { id: AppTab.CALCS, label: 'Calculators', icon: Calculator },
  { id: AppTab.REPORT, label: 'Report', icon: ClipboardList },
  { id: AppTab.ASSETS, label: 'Assets', icon: Warehouse },
];

// Tabs that fill the viewport edge-to-edge instead of sitting in the page column.
const IMMERSIVE = new Set<AppTab>([AppTab.MODEL, AppTab.MANUAL]);

const AppInner: React.FC = () => {
  const { tab, go } = useNav();
  const online = useOnlineStatus();
  const immersive = IMMERSIVE.has(tab);
  // The 3D scene is expensive to build, so keep it mounted once opened.
  const [modelMounted, setModelMounted] = useState(immersive);
  useEffect(() => {
    if (immersive) setModelMounted(true);
  }, [immersive]);

  return (
    <div className={`flex flex-col ${immersive ? 'min-h-[100dvh] min-[651px]:h-[100dvh]' : 'min-h-screen'}`}>
      <header className="print:hidden sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3 md:px-6 xl:flex-nowrap xl:py-0">
          <button onClick={() => go(AppTab.MODEL)} className="flex items-center gap-3 whitespace-nowrap text-left xl:py-3" aria-label="Centrac B home">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-700 text-white">
              <Box size={20} />
            </span>
            <span>
              <span className="block text-lg font-black leading-none tracking-tight">Centrac B</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">Field Toolkit</span>
            </span>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-2 xl:order-last">
            <AssetPicker />
            <span
              title={online ? 'Online. Everything also works offline.' : 'Offline. Everything still works; data stays on this device.'}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-300"
            >
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-amber-400'}`}></span>
              <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
            </span>
          </div>

          <nav aria-label="Sections" className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-2 md:-mx-6 md:w-[calc(100%+3rem)] md:px-4 xl:mx-0 xl:w-auto xl:px-0">
            <div className="flex gap-1 whitespace-nowrap">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  aria-current={tab === id ? 'page' : undefined}
                  className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold outline-none transition-colors xl:py-5 focus-visible:bg-slate-800 ${
                    tab === id ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {modelMounted && (
        <div className={immersive ? 'flex-1 min-h-0' : 'hidden'}>
          <ModelPack view={tab === AppTab.MANUAL ? 'manual' : 'model'} visible={immersive} />
        </div>
      )}

      {!immersive && (
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
          {tab === AppTab.TROUBLESHOOTING && <TroubleshootingPack />}
          {tab === AppTab.MAINTENANCE && <MaintenancePack />}
          {tab === AppTab.CALCS && <CalcsPack />}
          {tab === AppTab.REPORT && <ReportPack />}
          {tab === AppTab.ASSETS && <EquipmentPack />}
        </main>
      )}

      {!immersive && (
        <footer className="print:hidden bg-surface border-t border-line py-6 px-4">
          <div className="max-w-7xl mx-auto text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            Centrac B Field Toolkit · Works offline · Data stays on this device
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ActiveAssetProvider>
    <NavProvider>
      <AppInner />
    </NavProvider>
  </ActiveAssetProvider>
);

export default App;
