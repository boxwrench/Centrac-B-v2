import React, { useState } from 'react';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';

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
      className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

/**
 * Shared save-to-log behaviour for every check panel: writes a `hydraulics`
 * log entry against the active asset and surfaces a non-blocking status message.
 */
export function useCheckSave() {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const save = async (inputs: Record<string, unknown>, outputs: Record<string, unknown>) => {
    try {
      await logRepo.add({ equipmentId: activeAssetId, kind: 'hydraulics', inputs, outputs });
      await refreshEquipment();
      setMsg({ text: `Saved to ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose what is on screen; surface a non-blocking notice.
      setMsg({ text: 'Save failed — result is still on screen, try again', ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return { save, msg, activeAsset };
}

/** Save button + inline status message shared by all check panels. */
export const SaveBar: React.FC<{ onSave: () => void; msg: { text: string; ok: boolean } | null; tag?: string }> = ({
  onSave,
  msg,
  tag,
}) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onSave}
      className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors"
    >
      Save to log{tag ? ` · ${tag}` : ' · Unassigned'}
    </button>
    {msg && <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
  </div>
);

/** Helper: round a number for logging, leaving non-finite values as null. */
export const r2 = (n: number): number | null => (Number.isFinite(n) ? Number(n.toFixed(2)) : null);
