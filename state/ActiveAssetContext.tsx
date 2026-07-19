import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { equipmentRepo } from '../db/equipmentRepo';
import { Equipment } from '../types';

export const ACTIVE_ASSET_KEY = 'centrac-b.activeAssetId';

export function readActiveAssetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ASSET_KEY);
  } catch {
    return null;
  }
}

export function writeActiveAssetId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_ASSET_KEY);
    else localStorage.setItem(ACTIVE_ASSET_KEY, id);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

interface ActiveAssetValue {
  activeAssetId: string | null;
  activeAsset: Equipment | null;
  setActiveAssetId: (id: string | null) => void;
  equipment: Equipment[];
  refreshEquipment: () => Promise<void>;
}

const ActiveAssetContext = createContext<ActiveAssetValue | null>(null);

export const ActiveAssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [activeAssetId, setActiveAssetIdState] = useState<string | null>(() => readActiveAssetId());

  const refreshEquipment = useCallback(async () => {
    setEquipment(await equipmentRepo.list());
  }, []);

  useEffect(() => {
    void refreshEquipment();
  }, [refreshEquipment]);

  const setActiveAssetId = useCallback((id: string | null) => {
    writeActiveAssetId(id);
    setActiveAssetIdState(id);
  }, []);

  const activeAsset = useMemo(
    () => equipment.find((e) => e.id === activeAssetId) ?? null,
    [equipment, activeAssetId],
  );

  const value: ActiveAssetValue = {
    activeAssetId,
    activeAsset,
    setActiveAssetId,
    equipment,
    refreshEquipment,
  };

  return <ActiveAssetContext.Provider value={value}>{children}</ActiveAssetContext.Provider>;
};

export function useActiveAsset(): ActiveAssetValue {
  const ctx = useContext(ActiveAssetContext);
  if (!ctx) throw new Error('useActiveAsset must be used within ActiveAssetProvider');
  return ctx;
}
