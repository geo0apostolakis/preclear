"use client";

import { useEffect, useState } from "react";
import { Check, Save, RotateCcw } from "lucide-react";
import PageShell from "@/components/PageShell";
import Reveal from "@/components/Reveal";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { DEFAULT_POLICY } from "@/lib/gate";
import { universe, type Ticker } from "@/config";

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  const invalid = value < min || value > max || Number.isNaN(value);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold text-text-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          value={Number.isNaN(value) ? "" : value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className={`w-full rounded-xl border bg-white/[0.03] px-3 py-2.5 pr-12 font-mono text-sm text-text outline-none transition ${
            invalid ? "border-bad focus:border-bad" : "border-line focus:border-accent"
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-[11px] ${invalid ? "text-bad" : "text-muted"}`}>
        {invalid ? `Must be between ${min} and ${max}.` : hint}
      </p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-white/[0.02] p-4 text-left transition hover:border-line-2"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          checked ? "border-accent bg-accent/30" : "border-line-2 bg-white/5"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
            checked ? "left-[1.375rem] bg-accent" : "left-0.5 bg-muted"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </span>
    </button>
  );
}

export default function PolicyPage() {
  const { policy, savePolicy, ready } = useStore();
  const [draft, setDraft] = useState(policy);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(policy), [policy]);

  const dirty = JSON.stringify({ ...draft, version: 0, updatedAt: 0 }) !==
    JSON.stringify({ ...policy, version: 0, updatedAt: 0 });

  const valid =
    draft.allowed.length > 0 &&
    draft.maxTradeUsd > 0 &&
    draft.dailyLimitUsd >= draft.maxTradeUsd &&
    draft.bookValueUsd > 0 &&
    draft.maxConcentrationPct > 0 &&
    draft.maxConcentrationPct <= 100 &&
    draft.maxSlippagePct > 0 &&
    draft.maxFeedAgeSeconds > 0 &&
    draft.maxDeviationBps > 0;

  function toggleAsset(t: Ticker) {
    setDraft((d) => ({
      ...d,
      allowed: d.allowed.includes(t) ? d.allowed.filter((x) => x !== t) : [...d.allowed, t],
    }));
  }

  function commit() {
    const { version: _v, updatedAt: _u, ...rest } = draft;
    void _v;
    void _u;
    savePolicy(rest);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <PageShell
      eyebrow="Layer 3"
      meta="Mandate Vault"
      title="Policy"
      sub="The mandate an agent is allowed to trade inside. Changing anything here changes what the gate does on the next intent."
      right={
        <>
          <Pill tone="accent">Version {policy.version}</Pill>
          <Button size="sm" variant="glass" onClick={() => setDraft({ ...DEFAULT_POLICY, version: policy.version, updatedAt: policy.updatedAt })}>
            <RotateCcw className="h-3.5 w-3.5" />
            Defaults
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Allowlist */}
        <Reveal>
          <Card className="p-5 sm:p-6">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              1. Allowlisted assets
            </h2>
            <p className="mt-2 text-xs text-muted">
              Anything not selected is blocked with ASSET_NOT_ALLOWED before any other check runs.
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {universe.map((u) => {
                const on = draft.allowed.includes(u.ticker);
                return (
                  <button
                    key={u.ticker}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAsset(u.ticker)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      on
                        ? "border-accent/50 bg-accent/10"
                        : "border-line bg-white/[0.02] hover:border-line-2"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-sm font-bold text-text">{u.ticker}</span>
                      <span className="block truncate text-[11px] text-muted">{u.name}</span>
                    </span>
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        on ? "border-accent bg-accent text-accent-fg" : "border-line-2"
                      }`}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {draft.allowed.length === 0 && (
              <p className="mt-3 text-xs text-bad">Select at least one asset or nothing can trade.</p>
            )}
          </Card>
        </Reveal>

        {/* 2. Caps */}
        <Reveal delay={70}>
          <Card className="p-5 sm:p-6">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              2. Size and exposure
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="maxTrade"
                label="Max per trade"
                hint="A single intent above this is blocked."
                value={draft.maxTradeUsd}
                min={1}
                max={1_000_000}
                suffix="USD"
                onChange={(n) => setDraft((d) => ({ ...d, maxTradeUsd: n }))}
              />
              <NumberField
                id="daily"
                label="Daily rolling limit"
                hint="Approved notional over the last 24 hours."
                value={draft.dailyLimitUsd}
                min={1}
                max={10_000_000}
                suffix="USD"
                onChange={(n) => setDraft((d) => ({ ...d, dailyLimitUsd: n }))}
              />
              <NumberField
                id="book"
                label="Book value under mandate"
                hint="Concentration is measured against this, not the filled book."
                value={draft.bookValueUsd}
                min={1}
                max={100_000_000}
                suffix="USD"
                onChange={(n) => setDraft((d) => ({ ...d, bookValueUsd: n }))}
              />
              <NumberField
                id="conc"
                label="Max concentration"
                hint="Share of the book a single asset may reach."
                value={draft.maxConcentrationPct}
                min={1}
                max={100}
                suffix="%"
                onChange={(n) => setDraft((d) => ({ ...d, maxConcentrationPct: n }))}
              />
              <NumberField
                id="slip"
                label="Max price impact"
                hint="Estimated impact against pool depth."
                value={draft.maxSlippagePct}
                min={0.1}
                max={50}
                step={0.1}
                suffix="%"
                onChange={(n) => setDraft((d) => ({ ...d, maxSlippagePct: n }))}
              />
            </div>
            {draft.dailyLimitUsd < draft.maxTradeUsd && (
              <p className="mt-3 text-xs text-bad">
                Daily limit is below the per-trade cap, so no trade could ever clear.
              </p>
            )}
          </Card>
        </Reveal>

        {/* 3. Feed and venue */}
        <Reveal delay={140}>
          <Card className="p-5 sm:p-6">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              3. Feed and venue rules
            </h2>
            <div className="mt-5 space-y-3">
              <Toggle
                label="Enforce venue trading hours"
                hint="Block intents when the underlying market is closed, pre-market or after hours."
                checked={draft.strictMarketHours}
                onChange={(v) => setDraft((d) => ({ ...d, strictMarketHours: v }))}
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="feedAge"
                label="Max oracle age"
                hint="Reject a read older than this."
                value={draft.maxFeedAgeSeconds}
                min={5}
                max={3600}
                suffix="sec"
                onChange={(n) => setDraft((d) => ({ ...d, maxFeedAgeSeconds: n }))}
              />
              <NumberField
                id="dev"
                label="Max pool deviation"
                hint="Distance the pool may sit from the oracle."
                value={draft.maxDeviationBps}
                min={1}
                max={1000}
                suffix="bps"
                onChange={(n) => setDraft((d) => ({ ...d, maxDeviationBps: n }))}
              />
            </div>
          </Card>
        </Reveal>

        {/* Save bar */}
        <Reveal delay={200}>
          <Card
            strong
            className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <p className="text-xs text-muted">
              {!ready
                ? "Loading saved policy"
                : saved
                  ? `Committed as version ${policy.version}.`
                  : dirty
                    ? "Unsaved changes. Committing bumps the version."
                    : `Version ${policy.version} is active.`}
            </p>
            <Button variant="accent" onClick={commit} disabled={!dirty || !valid}>
              <Save className="h-4 w-4" />
              Commit version {policy.version + 1}
            </Button>
          </Card>
        </Reveal>
      </div>
    </PageShell>
  );
}
