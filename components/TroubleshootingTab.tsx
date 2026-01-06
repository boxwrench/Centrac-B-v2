
import React, { useState } from 'react';
import { TROUBLESHOOTING_MATRIX } from '../constants';
import { TroubleshootingEntry } from '../types';

const TroubleshootingTab: React.FC = () => {
  const [selectedEntry, setSelectedEntry] = useState<TroubleshootingEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = TROUBLESHOOTING_MATRIX.filter(item => 
    item.symptom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Interactive Symptom Solver</h3>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search symptoms or categories (e.g. 'noise', 'prime')..." 
            className="w-full p-4 pl-12 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedEntry(item)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedEntry?.symptom === item.symptom 
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase text-blue-600 mb-1">{item.category}</span>
                  <svg className={`w-5 h-5 transition-transform ${selectedEntry?.symptom === item.symptom ? 'rotate-90 text-blue-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-800">{item.symptom}</p>
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No symptoms found matching your search.
              </div>
            )}
          </div>

          <div className="min-h-[300px]">
            {selectedEntry ? (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8 h-full flex flex-col animate-in fade-in duration-300">
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selected Symptom</h4>
                  <p className="text-2xl font-bold text-slate-800 leading-tight">{selectedEntry.symptom}</p>
                </div>

                <div className="space-y-8 flex-grow">
                  <div>
                    <h5 className="flex items-center gap-2 text-red-600 font-bold uppercase text-sm mb-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Primary Root Cause
                    </h5>
                    <div className="bg-white p-4 rounded-xl border border-red-100 text-slate-700 shadow-sm leading-relaxed">
                      {selectedEntry.cause}
                    </div>
                  </div>

                  <div>
                    <h5 className="flex items-center gap-2 text-green-600 font-bold uppercase text-sm mb-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Field Engineering Recommendation
                    </h5>
                    <div className="bg-white p-4 rounded-xl border border-green-100 text-slate-700 shadow-sm leading-relaxed">
                      {selectedEntry.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 h-full flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 font-medium max-w-[200px]">Select a symptom from the list to view diagnostic steps.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingTab;
