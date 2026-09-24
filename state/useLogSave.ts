import { useState } from 'react';
import { logRepo } from '../db/logRepo';
import { LogKind } from '../types';
import { useActiveAsset } from './ActiveAssetContext';

export type SaveMsg = { text: string; ok: boolean } | null;

/**
 * Shared save-to-log behaviour: writes a log entry of `kind` against the active
 * asset and surfaces a short non-blocking status message.
 */
export function useLogSave(
  kind: LogKind,
  { done = 'Saved to', failed = 'Save failed — result is still on screen, try again' } = {},
) {
  const { activeAssetId, activeAsset, refreshEquipment } = useActiveAsset();
  const [msg, setMsg] = useState<SaveMsg>(null);

  const save = async (inputs: Record<string, unknown>, outputs: Record<string, unknown>) => {
    try {
      await logRepo.add({ equipmentId: activeAssetId, kind, inputs, outputs });
      await refreshEquipment();
      setMsg({ text: `${done} ${activeAsset ? activeAsset.tag : 'Unassigned'}`, ok: true });
    } catch {
      // Persistence failed — never lose what is on screen; surface a non-blocking notice.
      setMsg({ text: failed, ok: false });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return { save, msg, activeAsset };
}
