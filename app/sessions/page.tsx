"use client";

import { useState } from "react";
import { Plus, Ban, KeyRound } from "lucide-react";
import PageShell from "@/components/PageShell";
import Reveal from "@/components/Reveal";
import { Button, Card, Pill } from "@/components/ui/primitives";
import CopyButton from "@/components/CopyButton";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/clock";
import { money } from "@/lib/market";

function timeLeft(ms: number) {
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function SessionsPage() {
  const { sessions, createSession, revokeSession, activeSessionId, setActiveSession, ready } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState("agent_quant_01");
  const [budget, setBudget] = useState(2500);
  const [maxTrade, setMaxTrade] = useState(600);
  const [hours, setHours] = useState(24);

  const valid = agent.trim().length >= 3 && budget > 0 && maxTrade > 0 && maxTrade <= budget && hours > 0;

  function submit() {
    if (!valid) return;
    createSession({ agent: agent.trim(), budgetUsd: budget, maxTradeUsd: maxTrade, hours });
    setOpen(false);
  }

  return (
    <PageShell
      eyebrow="Layer 4"
      meta="Route Guard"
      title="Delegated sessions"
      sub="A session is the boundary an agent operates inside: a budget, a per-trade cap and an expiry, revocable at any moment. Route Guard refuses an intent without a valid one."
      right={
        <Button size="sm" variant="accent" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          New session
        </Button>
      }
    >
      {open && (
        <Reveal>
          <Card strong className="mb-6 p-5 sm:p-6">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Create session
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="agent" className="mb-2 block text-xs font-semibold text-text-2">
                  Agent id
                </label>
                <input
                  id="agent"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="budget" className="mb-2 block text-xs font-semibold text-text-2">
                  Budget (USD)
                </label>
                <input
                  id="budget"
                  type="number"
                  min={1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="maxtrade" className="mb-2 block text-xs font-semibold text-text-2">
                  Per-trade cap (USD)
                </label>
                <input
                  id="maxtrade"
                  type="number"
                  min={1}
                  value={maxTrade}
                  onChange={(e) => setMaxTrade(Number(e.target.value))}
                  className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="hours" className="mb-2 block text-xs font-semibold text-text-2">
                  Duration (hours)
                </label>
                <input
                  id="hours"
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
              <p className="mt-3 text-xs text-bad">Per-trade cap cannot exceed the session budget.</p>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant="accent" onClick={submit} disabled={!valid}>
                Sign delegation
              </Button>
              <Button variant="glass" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Nothing is signed on chain. The session is created locally so the gate has a real
              object to enforce against.
            </p>
          </Card>
        </Reveal>
      )}

      {!ready ? (
        <Card className="h-40 animate-pulse opacity-40" />
      ) : sessions.length === 0 ? (
        <Reveal>
          <Card className="px-6 py-20 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-4 text-sm font-semibold text-text">No sessions yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
              Route Guard blocks every intent with NO_SESSION until one exists. Create one to see
              the gate clear a trade.
            </p>
            <div className="mt-6">
              <Button variant="accent" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New session
              </Button>
            </div>
          </Card>
        </Reveal>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s, i) => {
            const expired = s.expiresAt <= now;
            const state = s.revoked ? "revoked" : expired ? "expired" : "active";
            const usedPct = Math.min(100, (s.spentUsd / s.budgetUsd) * 100);
            const isActive = activeSessionId === s.id;

            return (
              <Reveal key={s.id} delay={i * 60}>
                <Card className={`h-full p-5 transition ${isActive ? "border-accent/45" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-mono text-sm font-bold text-text">{s.id}</span>
                        <CopyButton value={s.id} />
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">{s.agent}</p>
                    </div>
                    <Pill tone={state === "active" ? "ok" : state === "revoked" ? "bad" : "warn"}>
                      {state}
                    </Pill>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between font-mono text-xs">
                      <span className="text-muted">Spent</span>
                      <span className="tabular-nums text-text">
                        {money(s.spentUsd)} / {money(s.budgetUsd)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-white/[0.02] p-3 text-xs">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Per trade</dt>
                      <dd className="font-mono tabular-nums text-text-2">{money(s.maxTradeUsd)}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Remaining</dt>
                      <dd className="font-mono tabular-nums text-text-2">
                        {money(Math.max(0, s.budgetUsd - s.spentUsd))}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Expiry</dt>
                      <dd className="font-mono text-text-2">
                        {new Date(s.expiresAt).toLocaleString()} · {timeLeft(s.expiresAt - now)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2 border-t border-line pt-4">
                    {state === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant={isActive ? "accent" : "glass"}
                          onClick={() => setActiveSession(isActive ? null : s.id)}
                        >
                          {isActive ? "Selected" : "Use"}
                        </Button>
                        <Button size="sm" variant="glass" onClick={() => revokeSession(s.id)}>
                          <Ban className="h-3.5 w-3.5 text-bad" />
                          Revoke
                        </Button>
                      </>
                    )}
                    {state !== "active" && (
                      <p className="text-[11px] text-muted">
                        {state === "revoked"
                          ? "Revoked. Every intent on it now fails SESSION_REVOKED."
                          : "Expired. Every intent on it now fails SESSION_EXPIRED."}
                      </p>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
