import type { Ticker } from "@/config";
import { estimateSlippagePct } from "./gate";
import type { Quote } from "./market";

/**
 * The agent is a rule-based selector, not a model. It reads the simulated
 * quotes and picks one asset per tick. Deliberately not called AI anywhere in
 * the UI, because it is three sorts and a modulo.
 */

export type Strategy = "momentum" | "reversion" | "rotation";

export const STRATEGIES: { value: Strategy; label: string; blurb: string }[] = [
  { value: "momentum", label: "Momentum", blurb: "Buys the strongest mover on the allowlist." },
  { value: "reversion", label: "Mean reversion", blurb: "Buys the weakest mover on the allowlist." },
  { value: "rotation", label: "Rotation", blurb: "Cycles the allowlist one asset at a time." },
];

export type Pick = {
  ticker: Ticker;
  side: "buy" | "sell";
  reason: string;
};

export function pickAsset(
  strategy: Strategy,
  allowed: Ticker[],
  quotes: Quote[],
  tick: number,
  target: Ticker | "AUTO",
): Pick | null {
  const pool = quotes.filter((q) => allowed.includes(q.ticker));
  if (pool.length === 0) return null;

  if (target !== "AUTO") {
    const q = pool.find((x) => x.ticker === target);
    if (!q) return null;
    return { ticker: q.ticker, side: "buy", reason: `Target pinned to ${target}.` };
  }

  if (strategy === "rotation") {
    const q = pool[tick % pool.length];
    return { ticker: q.ticker, side: "buy", reason: `Rotation slot ${tick % pool.length + 1} of ${pool.length}.` };
  }

  const sorted = [...pool].sort((a, b) => b.changePct - a.changePct);
  const q = strategy === "momentum" ? sorted[0] : sorted[sorted.length - 1];
  return {
    ticker: q.ticker,
    side: strategy === "momentum" ? "buy" : "buy",
    reason:
      strategy === "momentum"
        ? `Strongest mover at ${q.changePct.toFixed(2)}%.`
        : `Weakest mover at ${q.changePct.toFixed(2)}%.`,
  };
}

/**
 * Risk tolerance is a real pre-filter, not a decoration: the agent refuses to
 * submit an intent whose estimated impact is above its own share of the policy
 * slippage budget.
 */
export function withinRiskAppetite(
  notionalUsd: number,
  riskTolerance: number,
  policyMaxSlippagePct: number,
): { ok: boolean; impact: number; ceiling: number } {
  const impact = estimateSlippagePct(notionalUsd);
  const ceiling = (riskTolerance / 100) * policyMaxSlippagePct;
  return { ok: impact <= ceiling, impact, ceiling };
}

/* ---------------------------------------------------------------------------
   REBALANCER
   --------------------------------------------------------------------------- */

export type Weights = Record<string, number>;

export type DriftRow = {
  ticker: Ticker;
  valueUsd: number;
  currentPct: number;
  targetPct: number;
  driftPct: number;
  /** Positive means buy this much notional, negative means sell. */
  deltaUsd: number;
};

export function computeDrift(
  allowed: Ticker[],
  positions: Record<string, number>,
  targets: Weights,
  bookValueUsd: number,
): DriftRow[] {
  const invested = allowed.reduce((sum, t) => sum + (positions[t] ?? 0), 0);
  // Weights are meaningful against what is actually invested. With an empty
  // book there is nothing to rebalance, so every drift is zero.
  const base = invested;

  return allowed.map((ticker) => {
    const valueUsd = positions[ticker] ?? 0;
    const currentPct = base > 0 ? (valueUsd / base) * 100 : 0;
    const targetPct = targets[ticker] ?? 0;
    const driftPct = base > 0 ? currentPct - targetPct : 0;
    const deltaUsd = base > 0 ? (targetPct / 100) * base - valueUsd : 0;
    return { ticker, valueUsd, currentPct, targetPct, driftPct, deltaUsd };
  });
}

export function normaliseWeights(allowed: Ticker[], targets: Weights): Weights {
  const total = allowed.reduce((s, t) => s + (targets[t] ?? 0), 0);
  if (total === 0) {
    const even = Math.floor(100 / Math.max(1, allowed.length));
    return Object.fromEntries(allowed.map((t) => [t, even]));
  }
  return targets;
}
