"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Play, ChevronRight, Check, X } from "lucide-react";
import Panel from "./Panel";
import { Button, Pill } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { REASON_TEXT, type Attestation } from "@/lib/gate";
import { money } from "@/lib/market";
import { universe, type Ticker } from "@/config";

export default function IntentTester() {
  const store = useStore();
  const [ticker, setTicker] = useState<Ticker>("TSLA");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState(300);
  const [bypass, setBypass] = useState(false);
  const [result, setResult] = useState<Attestation | null>(null);

  function run() {
    const session = store.sessions.find((s) => s.id === store.activeSessionId) ?? null;
    setResult(
      store.submitIntent(
        { ticker, side, notionalUsd: amount, sessionId: session?.id ?? null, bypassHours: bypass },
        "manual",
      ),
    );
  }

  return (
    <Panel
      icon={<ShieldCheck className="h-4 w-4" />}
      title="Manual intent tester"
      sub="Push an arbitrary order at the five checks and read the trace."
      badge={{ label: "Local engine", tone: "warn" }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mt-ticker" className="mb-2 block text-xs font-semibold text-text-2">
            Asset
          </label>
          <select
            id="mt-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value as Ticker)}
            className="w-full cursor-pointer rounded-xl border border-line bg-bg-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          >
            {universe.map((u) => (
              <option key={u.ticker} value={u.ticker}>
                {u.ticker} · {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mt-amount" className="mb-2 block text-xs font-semibold text-text-2">
            Amount (USD)
          </label>
          <input
            id="mt-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
              side === s
                ? s === "buy"
                  ? "border-ok bg-ok/12 text-ok"
                  : "border-bad bg-bad/12 text-bad"
                : "border-line bg-white/[0.03] text-muted hover:text-text"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <input
          type="checkbox"
          checked={bypass}
          onChange={(e) => setBypass(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
        />
        <span>
          <span className="block text-xs font-semibold text-text">Bypass the venue session</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
            Test override so you can exercise the other four checks while the market is closed. The
            trace records that it was bypassed.
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="accent" onClick={run}>
          <Play className="h-4 w-4" />
          Submit intent
        </Button>
        <Link
          href="/policy"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          Configure the mandate
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {result && (
        <div className="mt-5 overflow-hidden rounded-xl border border-line">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
              result.verdict === "APPROVED" ? "bg-ok/[0.08]" : "bg-bad/[0.08]"
            }`}
          >
            <span className={`text-sm font-semibold ${result.verdict === "APPROVED" ? "text-ok" : "text-bad"}`}>
              {result.verdict === "APPROVED" ? "Cleared for routing" : "Blocked before routing"}
            </span>
            <Pill tone={result.verdict === "APPROVED" ? "ok" : "bad"}>{result.reasonCode}</Pill>
          </div>
          <ul className="divide-y divide-line/60">
            {result.checks.map((c) => (
              <li key={c.layer} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${
                    c.pass ? "border-ok/40 bg-ok/12 text-ok" : "border-bad/40 bg-bad/12 text-bad"
                  }`}
                >
                  {c.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-text">
                    {c.n}. {c.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2.5 font-mono text-[11px] text-muted">
            {money(result.intent.notionalUsd)} {result.intent.ticker} ·{" "}
            {REASON_TEXT[result.reasonCode]}
          </p>
        </div>
      )}
    </Panel>
  );
}
