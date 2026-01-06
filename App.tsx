
import React, { useState } from 'react';
import { AppTab } from './types';
import SuctionTab from './components/SuctionTab';
import DischargeTab from './components/DischargeTab';
import CalibrationTab from './components/CalibrationTab';
import TroubleshootingTab from './components/TroubleshootingTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SUCTION);

  const tabs = [
    { id: AppTab.SUCTION, label: 'Suction & Ha Analysis', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: AppTab.DISCHARGE, label: 'Discharge & Performance', icon: 'M13 5l7 7-7 7M5 5l7 7-7 7' },
    { id: AppTab.CALIBRATION, label: 'Calibration & Dosing', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: AppTab.TROUBLESHOOTING, label: 'Troubleshooting Matrix', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-xl px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Centrac B Dashboard</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Milton Roy Field Engineering Tool v2.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-full border border-slate-700">
             <span className="flex h-3 w-3 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-300 pr-2 uppercase tracking-tighter">System Offline-Ready</span>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-[72px] md:top-[80px] z-40 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-4 md:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 text-sm font-semibold transition-all border-b-2 outline-none ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === AppTab.SUCTION && <SuctionTab />}
          {activeTab === AppTab.DISCHARGE && <DischargeTab />}
          {activeTab === AppTab.CALIBRATION && <CalibrationTab />}
          {activeTab === AppTab.TROUBLESHOOTING && <TroubleshootingTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
          <p>© {new Date().getFullYear()} Milton Roy Field Engineering Service - Centrac B Series</p>
          <div className="flex gap-4">
            <span>API 675 Compliant</span>
            <span>O&M Section 3-4 Ref</span>
            <span>HPD Liquid End Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
