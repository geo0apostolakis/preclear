"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_POLICY, evaluate, pseudoHash, type Attestation, type Intent, type Origin, type Policy, type Session } from "@/lib/gate";
import { STORAGE_KEY, StoreContext } from "@/lib/store";
import { useNow } from "@/lib/clock";

type Persisted = {
  policy: Policy;
  sessions: Session[];
  attestations: Attestation[];
  activeSessionId: string | null;
};

const EMPTY: Persisted = {
  policy: DEFAULT_POLICY,
  sessions: [],
  attestations: [],
  activeSessionId: null,
};

const DAY = 24 * 60 * 60 * 1000;

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [ready, setReady] = useState(false);
  const now = useNow();

  /* Load once on the client. Everything before this renders the empty state,
     which keeps the server and the first client paint identical. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        setState({ ...EMPTY, ...parsed, policy: { ...DEFAULT_POLICY, ...parsed.policy } });
      }
    } catch {
      // corrupt payload, start clean
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota or private mode, keep going in memory
    }
  }, [state, ready]);

  const positions = useMemo(() => {
    const p: Record<string, number> = {};
    for (const a of state.attestations) {
      if (a.verdict !== "APPROVED") continue;
      const sign = a.intent.side === "buy" ? 1 : -1;
      p[a.intent.ticker] = Math.max(0, (p[a.intent.ticker] ?? 0) + sign * a.intent.notionalUsd);
    }
    return p;
  }, [state.attestations]);

  const spentToday = useMemo(() => {
    if (!now) return 0; // pre-hydration, the clock has not started
    const cutoff = now - DAY;
    return state.attestations
      .filter((a) => a.verdict === "APPROVED" && a.createdAt > cutoff)
      .reduce((sum, a) => sum + a.intent.notionalUsd, 0);
  }, [state.attestations, now]);

  const savePolicy = useCallback((next: Omit<Policy, "version" | "updatedAt">) => {
    setState((s) => ({
      ...s,
      policy: { ...next, version: s.policy.version + 1, updatedAt: Date.now() },
    }));
  }, []);

  const createSession = useCallback(
    ({ agent, budgetUsd, maxTradeUsd, hours }: { agent: string; budgetUsd: number; maxTradeUsd: number; hours: number }) => {
      const now = Date.now();
      const session: Session = {
        id: `sess_${pseudoHash(`${agent}${now}`, 8).slice(2)}`,
        agent,
        budgetUsd,
        spentUsd: 0,
        maxTradeUsd,
        createdAt: now,
        expiresAt: now + hours * 60 * 60 * 1000,
        revoked: false,
      };
      setState((s) => ({ ...s, sessions: [session, ...s.sessions], activeSessionId: session.id }));
      return session;
    },
    [],
  );

  const revokeSession = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === id ? { ...x, revoked: true } : x)),
    }));
  }, []);

  const setActiveSession = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeSessionId: id }));
  }, []);

  const submitIntent = useCallback(
    (intent: Intent, origin: Origin = "manual") => {
      const session = state.sessions.find((s) => s.id === intent.sessionId) ?? null;
      const att = evaluate({ intent, policy: state.policy, session, spentToday, positions, origin });

      setState((s) => ({
        ...s,
        attestations: [att, ...s.attestations].slice(0, 200),
        sessions:
          att.verdict === "APPROVED" && session
            ? s.sessions.map((x) =>
                x.id === session.id ? { ...x, spentUsd: x.spentUsd + intent.notionalUsd } : x,
              )
            : s.sessions,
      }));

      return att;
    },
    [state.sessions, state.policy, spentToday, positions],
  );

  const resetAll = useCallback(() => setState(EMPTY), []);

  const value = useMemo(
    () => ({
      ready,
      policy: state.policy,
      sessions: state.sessions,
      attestations: state.attestations,
      activeSessionId: state.activeSessionId,
      positions,
      spentToday,
      savePolicy,
      createSession,
      revokeSession,
      setActiveSession,
      submitIntent,
      resetAll,
    }),
    [ready, state, positions, spentToday, savePolicy, createSession, revokeSession, setActiveSession, submitIntent, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
