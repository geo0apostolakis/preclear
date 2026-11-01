"use client";

import { createContext, useContext } from "react";
import type { Attestation, Intent, Origin, Policy, Session } from "./gate";

export type StoreState = {
  ready: boolean;
  policy: Policy;
  sessions: Session[];
  attestations: Attestation[];
  positions: Record<string, number>;
  spentToday: number;
  activeSessionId: string | null;
};

export type StoreActions = {
  savePolicy: (next: Omit<Policy, "version" | "updatedAt">) => void;
  createSession: (input: { agent: string; budgetUsd: number; maxTradeUsd: number; hours: number }) => Session;
  revokeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  submitIntent: (intent: Intent, origin?: Origin) => Attestation;
  resetAll: () => void;
};

export const StoreContext = createContext<(StoreState & StoreActions) | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export const STORAGE_KEY = "preclear.state.v1";
