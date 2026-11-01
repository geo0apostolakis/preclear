"use client";

import { useState } from "react";
import { Clock, Send, ChevronRight } from "lucide-react";
import Link from "next/link";
import Panel from "./Panel";
import { Button, Pill } from "@/components/ui/primitives";
import Txt from "@/components/Txt";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/clock";
import { money } from "@/lib/market";
import { contractAddress, isReal } from "@/config";

export default function SessionQuickCreate() {
  const store = useStore();
  const now = useNow();
  const [budget, setBudget] = useState(2000);
  const [hours, setHours] = useState(24);
  const [maxTrade, setMaxTrade] = useState(600);
  const [note, setNote] = useState<string | null>(null);

  const active = store.sessions.filter((s) => !s.revoked && s.expiresAt > now);
  const valid = budget > 0 && hours > 0 && maxTrade > 0 && maxTrade <= budget;

  function create() {
    const s = store.createSession({ agent: "agent_01", budgetUsd: budget, maxTradeUsd: maxTrade, hours });
    setNote(`${s.id} created and selected.`);
  }

  return (
    <Panel
      icon={<Clock className="h-4 w-4" />}
      title="Session delegation"
      sub="Layer 4. A budget, a per-trade cap and an expiry the agent cannot exceed."
      badge={{ label: `${active.length} active`, tone: active.length ? "ok" : "muted" }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="qc-budget" className="mb-2 block text-xs font-semibold text-text-2">
            Budget (USD)
          </label>
          <input
            id="qc-budget"
            type="number"
            min={1}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="qc-max" className="mb-2 block text-xs font-semibold text-text-2">
            Per trade (USD)
          </label>
          <input
            id="qc-max"
            type="number"
            min={1}
            value={maxTrade}
            onChange={(e) => setMaxTrade(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="qc-hours" className="mb-2 block text-xs font-semibold text-text-2">
            Window (hours)
          </label>
          <input
            id="qc-hours"
            type="number"
            min={1}
            max={720}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
          />
        </div>
      </div>

      {maxTrade > budget && (
        <p className="mt-3 text-xs text-bad">Per-trade cap cannot exceed the budget.</p>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-bg-2/70 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Contract</span>
        {isReal(contractAddress) ? (
          <span className="truncate font-mono text-[11px] text-text-2">{contractAddress}</span>
        ) : (
          <Txt value={contractAddress} />
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="accent" onClick={create} disabled={!valid}>
          <Send className="h-4 w-4" />
          Create session
        </Button>
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          Sessions manager
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {note && <p className="mt-3 text-xs text-ok">{note}</p>}

      {active.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {active.slice(0, 3).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => store.setActiveSession(s.id)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                store.activeSessionId === s.id
                  ? "border-accent/50 bg-accent/10"
                  : "border-line hover:border-line-2"
              }`}
            >
              <span className="truncate font-mono text-[11px] text-text">{s.id}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {money(s.budgetUsd - s.spentUsd)} left
                </span>
                {store.activeSessionId === s.id && <Pill tone="accent">in use</Pill>}
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
