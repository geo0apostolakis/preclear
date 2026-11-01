"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, RefreshCw } from "lucide-react";
import Panel from "./Panel";
import { Button, Pill } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { computeDrift } from "@/lib/agent";
import { money } from "@/lib/market";
import type { Ticker } from "@/config";

const BAR_COLOURS = ["#38bdf8", "#818cf8", "#4ade80", "#fbbf24", "#fb7185", "#22d3ee"];

export default function Rebalancer() {
  const store = useStore();
  const allowed = store.policy.allowed;

  const [targets, setTargets] = useState<Record<string, number>>({});
  const [tolerance, setTolerance] = useState(5);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Seed an even split whenever the allowlist changes shape.
  useEffect(() => {
    setTargets((prev) => {
      const keys = Object.keys(prev);
      const same = keys.length === allowed.length && allowed.every((t) => keys.includes(t));
      if (same) return prev;
      const even = Math.round(100 / Math.max(1, allowed.length));
      return Object.fromEntries(allowed.map((t, i) => [t, i === 0 ? 100 - even * (allowed.length - 1) : even]));
    });
  }, [allowed]);

  const totalTarget = allowed.reduce((s, t) => s + (targets[t] ?? 0), 0);

  const rows = useMemo(
    () => computeDrift(allowed, store.positions, targets, store.policy.bookValueUsd),
    [allowed, store.positions, targets, store.policy.bookValueUsd],
  );

  const invested = rows.reduce((s, r) => s + r.valueUsd, 0);
  const breached = rows.filter((r) => Math.abs(r.driftPct) > tolerance);

  function rebalance() {
    setBusy(true);
    setNote(null);
    const session = store.sessions.find((s) => s.id === store.activeSessionId) ?? null;
    let cleared = 0;
    let blocked = 0;

    for (const r of breached) {
      const notional = Math.round(Math.abs(r.deltaUsd));
      if (notional < 1) continue;
      const att = store.submitIntent(
        {
          ticker: r.ticker,
          side: r.deltaUsd > 0 ? "buy" : "sell",
          notionalUsd: notional,
          sessionId: session?.id ?? null,
        },
        "rebalance",
      );
      if (att.verdict === "APPROVED") cleared++;
      else blocked++;
    }

    setNote(
      cleared + blocked === 0
        ? "Nothing to submit."
        : `${cleared} cleared, ${blocked} blocked. Every leg is in the audit trail with its reason code.`,
    );
    setBusy(false);
  }

  return (
    <Panel
      icon={<Scale className="h-4 w-4" />}
      title="Portfolio rebalancer"
      sub="Weights the book you have built against the targets you set, then routes each corrective leg through the gate."
      badge={{ label: "Mandate Vault enforced", tone: "accent" }}
      right={
        <Pill tone={totalTarget === 100 ? "ok" : "warn"}>Target {totalTarget}%</Pill>
      }
    >
      {invested === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 bg-white/[0.02] px-4 py-8 text-center text-xs leading-relaxed text-muted">
          The book is empty, so there is nothing to rebalance. Clear a few intents in the agent
          panel or the tester below and positions will appear here.
        </p>
      ) : (
        <>
          {/* Distribution bar */}
          <div className="mb-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Current distribution
              </span>
              <span className="font-mono text-xs tabular-nums text-text-2">
                {money(invested)} invested
              </span>
            </div>
            <div className="flex h-7 overflow-hidden rounded-lg border border-line">
              {rows
                .filter((r) => r.valueUsd > 0)
                .map((r, i) => (
                  <div
                    key={r.ticker}
                    className="grid place-items-center text-[10px] font-bold text-black/80 transition-all duration-500"
                    style={{ width: `${r.currentPct}%`, background: BAR_COLOURS[i % BAR_COLOURS.length] }}
                    title={`${r.ticker} ${r.currentPct.toFixed(1)}%`}
                  >
                    {r.currentPct > 12 && `${r.ticker} ${r.currentPct.toFixed(0)}%`}
                  </div>
                ))}
            </div>
          </div>

          {/* Rows */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => {
              const off = Math.abs(r.driftPct) > tolerance;
              return (
                <div key={r.ticker} className="rounded-xl border border-line bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: BAR_COLOURS[i % BAR_COLOURS.length] }}
                      />
                      <span className="font-mono text-sm font-bold text-text">{r.ticker}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-xs tabular-nums text-text">
                        {r.currentPct.toFixed(1)}%{" "}
                        <span className="text-muted">/ {r.targetPct}%</span>
                      </span>
                      <span
                        className={`block font-mono text-[11px] tabular-nums ${off ? "text-bad" : "text-ok"}`}
                      >
                        {r.driftPct >= 0 ? "+" : ""}
                        {r.driftPct.toFixed(1)}%
                      </span>
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-[11px] text-muted">{money(r.valueUsd)}</p>

                  <label className="mt-3 block">
                    <span className="sr-only">{r.ticker} target weight</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={targets[r.ticker] ?? 0}
                      onChange={(e) =>
                        setTargets((t) => ({ ...t, [r.ticker as Ticker]: Number(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </label>

                  {off && (
                    <p className="mt-2 font-mono text-[11px] text-accent">
                      {r.deltaUsd > 0 ? "buy" : "sell"} {money(Math.abs(r.deltaUsd))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advisory */}
          <div className="mt-5 rounded-xl border border-line bg-bg-2/70 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Drift advisory
              </span>
              <label className="flex items-center gap-2 text-[11px] text-muted">
                Tolerance
                <select
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="cursor-pointer rounded-lg border border-line bg-bg-2 px-2 py-1 font-mono text-[11px] text-text outline-none focus:border-accent"
                >
                  {[2, 5, 10, 20].map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs leading-relaxed text-text-2">
              {totalTarget !== 100
                ? `Targets sum to ${totalTarget}%. Set them to 100% before rebalancing, otherwise the legs will not close the gap.`
                : breached.length === 0
                  ? `Every position is inside the ±${tolerance}% band. No corrective legs needed.`
                  : `${breached.length} position${breached.length > 1 ? "s are" : " is"} outside the ±${tolerance}% band: ${breached.map((b) => b.ticker).join(", ")}.`}
            </p>
            {note && <p className="mt-2 text-xs text-accent">{note}</p>}
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-muted">
              Each corrective leg is evaluated separately. Some can clear while others are blocked.
            </p>
            <Button
              variant="accent"
              onClick={rebalance}
              disabled={busy || breached.length === 0 || totalTarget !== 100}
            >
              <RefreshCw className="h-4 w-4" />
              Rebalance through the gate
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
