import React from 'react';
import { SaveMsg } from '../../state/useLogSave';

/** A labelled numeric input used across all asset check panels. */
export const NumField: React.FC<{
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}> = ({ label, name, value, onChange, step }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
    <input
      type="number"
      name={name}
      step={step}
      value={Number.isFinite(value) ? value : ''}
      onChange={onChange}
      className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

/** Save button + inline status message shared by all check panels. */
export const SaveBar: React.FC<{ onSave: () => void; msg: SaveMsg; tag?: string }> = ({
  onSave,
  msg,
  tag,
}) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onSave}
      className="bg-orange-700 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-orange-800 transition-colors"
    >
      Save to log{tag ? ` · ${tag}` : ' · Unassigned'}
    </button>
    {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
  </div>
);

/** Helper: round a number for logging, leaving non-finite values as null. */
export const r2 = (n: number): number | null => (Number.isFinite(n) ? Number(n.toFixed(2)) : null);
