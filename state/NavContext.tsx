import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTab } from '../types';

const TAB_IDS = Object.values(AppTab) as string[];

/** `#/manual` → AppTab.MANUAL. Anything unknown (or no hash) lands on the 3D model. */
export function tabFromHash(hash: string): AppTab {
  const id = hash.replace(/^#\/?/, '');
  return TAB_IDS.includes(id) ? (id as AppTab) : AppTab.MODEL;
}

interface NavValue {
  tab: AppTab;
  go: (tab: AppTab) => void;
  /** Jump to the 3D model, cut it open and focus a part (ids from packs/model/parts.ts). */
  openPart: (id: string) => void;
  /** Jump to the O&M manual reader at a PDF page. */
  openManual: (page: number) => void;
  /** Latest part-focus request; `n` changes on every request so repeats still fire. */
  partRequest: { id: string; n: number } | null;
  manualPage: number;
  setManualPage: (page: number) => void;
}

const NavContext = createContext<NavValue | null>(null);

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<AppTab>(() =>
    typeof window === 'undefined' ? AppTab.MODEL : tabFromHash(window.location.hash),
  );
  const [partRequest, setPartRequest] = useState<NavValue['partRequest']>(null);
  const [manualPage, setManualPage] = useState(1);

  const go = useCallback((next: AppTab) => {
    setTab(next);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${next}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openPart = useCallback((id: string) => {
    setPartRequest((prev) => ({ id, n: (prev?.n ?? 0) + 1 }));
    go(AppTab.MODEL);
  }, [go]);

  const openManual = useCallback((page: number) => {
    setManualPage(page);
    go(AppTab.MANUAL);
  }, [go]);

  const value = useMemo(
    () => ({ tab, go, openPart, openManual, partRequest, manualPage, setManualPage }),
    [tab, go, openPart, openManual, partRequest, manualPage],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

export function useNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
