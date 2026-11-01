"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Play, Power } from "lucide-react";
import Panel from "./Panel";
import { Button, Pill } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { allQuotes, money } from "@/lib/market";
import { pickAsset, withinRiskAppetite, STRATEGIES, type Strategy } from "@/lib/agent";
import { REASON_TEXT } from "@/lib/gate";
import { universe, type Ticker } from "@/config";

type Line = { t: string; text: string; tone: "info" | "ok" | "bad" | "warn" };

const AUTOPILOT_INTERVAL_MS = 9000;

export default function AgentPanel() {
  const store = useStore();
  const [strategy, setStrategy] = useState<Strategy>("momentum");
  const [target, setTarget] = useState<Ticker | "AUTO">("AUTO");
  const [size, setSize] = useState(350);
  const [risk, setRisk] = useState(50);
  const [autopilot, setAutopilot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Line[]>([
    { t: "", text: "Engine idle. Configure a strategy and trigger a scan.", tone: "info" },
  ]);
  const tickRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const push = useCallback((text: string, tone: Line["tone"] = "info") => {
    const t = new Date().toLocaleTimeString();
    setLog((l) => [...l.slice(-40), { t, text, tone }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [log]);

  const runOnce = useCallback(() => {
    setBusy(true);
    const quotes = allQuotes(new Date());
    const tick = tickRef.current++;
    const allowed = store.policy.allowed;

    if (allowed.length === 0) {
      push("Scan aborted: the mandate allowlist is empty.", "bad");
      setBusy(false);
      return;
    }

    const choice = pickAsset(strategy, allowed, quotes, tick, target);
    if (!choice) {
      push(
        target === "AUTO"
          ? "Scan found nothing on the allowlist."
          : `${target} is not on the mandate allowlist.`,
        "warn",
      );
      setBusy(false);
      return;
    }

    push(`Scan ${tick + 1}: ${choice.ticker} selected. ${choice.reason}`, "info");

    const appetite = withinRiskAppetite(size, risk, store.policy.maxSlippagePct);
    if (!appetite.ok) {
      push(
        `Held back: estimated impact ${appetite.impact.toFixed(2)}% is above the agent ceiling of ${appetite.ceiling.toFixed(2)}%.`,
        "warn",
      );
      setBusy(false);
      return;
    }

    const session = store.sessions.find((s) => s.id === store.activeSessionId) ?? null;
    const att = store.submitIntent(
      {
        ticker: choice.ticker,
        side: choice.side,
        notionalUsd: size,
        sessionId: session?.id ?? null,
      },
      "agent",
    );

    if (att.verdict === "APPROVED") {
      push(`Cleared: ${choice.side.toUpperCase()} ${money(size)} ${choice.ticker}.`, "ok");
    } else {
      push(`Blocked at layer ${att.checks.findIndex((c) => !c.pass) + 1}: ${att.reasonCode}. ${REASON_TEXT[att.reasonCode]}.`, "bad");
    }
    setBusy(false);
  }, [strategy, target, size, risk, store, push]);

  useEffect(() => {
    if (!autopilot) return;
    push(`Auto-pilot on. Scanning every ${AUTOPILOT_INTERVAL_MS / 1000}s.`, "info");
    const id = setInterval(runOnce, AUTOPILOT_INTERVAL_MS);
    return () => {
      clearInterval(id);
      push("Auto-pilot off.", "info");
    };
    // runOnce changes with every store update; re-subscribing keeps the loop
    // using current policy and sessions rather than a stale snapshot.
  }, [autopilot, runOnce, push]);

  const tone = {
    info: "text-muted",
    ok: "text-ok",
    bad: "text-bad",
    warn: "text-warn",
  } as const;

  return (
    <Panel
      icon={<Bot className="h-4 w-4" />}
      title="Rule-based trading agent"
      sub="Generates trade intents from the simulated tape and pushes each one through the gate."
      badge={{ label: autopilot ? "Running" : "Idle", tone: autopilot ? "ok" : "muted" }}
      right={
        <Button
          size="sm"
          variant={autopilot ? "accent" : "glass"}
          onClick={() => setAutopilot((v) => !v)}
        >
          <Power className="h-3.5 w-3.5" />
          Auto-pilot {autopilot ? "on" : "off"}
        </Button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="strategy" className="mb-2 block text-xs font-semibold text-text-2">
            Strategy
          </label>
          <select
            id="strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
            className="w-full cursor-pointer rounded-xl border border-line bg-bg-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted">
            {STRATEGIES.find((s) => s.value === strategy)?.blurb}
          </p>
        </div>

        <div>
          <label htmlFor="target" className="mb-2 block text-xs font-semibold text-text-2">
            Target asset
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value as Ticker | "AUTO")}
            className="w-full cursor-pointer rounded-xl border border-line bg-bg-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          >
            <option value="AUTO">Auto, scan the allowlist</option>
            {universe.map((u) => (
              <option key={u.ticker} value={u.ticker}>
                {u.ticker}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted">
            {store.policy.allowed.length} of {universe.length} assets allowlisted.
          </p>
        </div>

        <div>
          <label htmlFor="size" className="mb-2 flex items-center justify-between text-xs font-semibold text-text-2">
            Trade size
            <span className="font-mono tabular-nums text-accent">{money(size)}</span>
          </label>
          <input
            id="size"
            type="range"
            min={10}
            max={2000}
            step={10}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            Policy cap is {money(store.policy.maxTradeUsd)}.
          </p>
        </div>

        <div>
          <label htmlFor="risk" className="mb-2 flex items-center justify-between text-xs font-semibold text-text-2">
            Risk tolerance
            <span className="font-mono tabular-nums text-accent">{risk} / 100</span>
          </label>
          <input
            id="risk"
            type="range"
            min={0}
            max={100}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            Refuses impact above {((risk / 100) * store.policy.maxSlippagePct).toFixed(2)}%.
          </p>
        </div>
      </div>

      {/* Log */}
      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-bg-2/80">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Execution log
          </span>
          <Pill tone={busy ? "accent" : autopilot ? "ok" : "muted"}>
            {busy ? "Scanning" : autopilot ? "Armed" : "Idle"}
          </Pill>
        </div>
        <div className="h-52 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
          {log.map((l, i) => (
            <p key={i} className={tone[l.tone]}>
              {l.t && <span className="mr-2 text-muted/60">{l.t}</span>}
              {l.text}
            </p>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted">
          Force a single scan and evaluation against the five checks.
        </p>
        <Button variant="accent" onClick={runOnce} disabled={busy}>
          <Play className="h-4 w-4" />
          Trigger one scan
        </Button>
      </div>
    </Panel>
  );
}
