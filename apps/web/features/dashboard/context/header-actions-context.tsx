"use client";

import { createContext, useContext, useState, useMemo, ReactNode, Dispatch, SetStateAction } from "react";

interface HeaderActionsContextValue {
  actions: ReactNode | null;
  setActions: Dispatch<SetStateAction<ReactNode | null>>;
}

const HeaderActionsContext = createContext<HeaderActionsContextValue | null>(null);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return <HeaderActionsContext.Provider value={value}>{children}</HeaderActionsContext.Provider>;
}

export function useHeaderActionsContext() {
  const ctx = useContext(HeaderActionsContext);
  if (!ctx) {
    throw new Error("useHeaderActionsContext must be used within HeaderActionsProvider");
  }
  return ctx;
}

/** Hook for pages to set header actions; cleans up in callers */
export function useHeaderActions() {
  const { actions, setActions } = useHeaderActionsContext();
  return { actions, setActions };
}
