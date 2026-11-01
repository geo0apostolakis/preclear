import { type LayerKey, type Ticker } from "@/config";
import { quote, sessionState } from "./market";

/* ---------------------------------------------------------------------------
   THE GATE. A pure function: intent + policy + session + market state in,
   verdict out. This runs in your browser. No contract is deployed, so this is
   the reference implementation of the rules, not an on-chain enforcement.
   --------------------------------------------------------------------------- */

export type ReasonCode =
  | "APPROVED"
  | "FEED_STALE"
  | "FEED_DEVIATION"
  | "MARKET_CLOSED"
  | "ASSET_NOT_ALLOWED"
  | "TRADE_SIZE_EXCEEDED"
  | "DAILY_LIMIT_EXCEEDED"
  | "CONCENTRATION_EXCEEDED"
  | "NO_SESSION"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "SESSION_BUDGET_EXCEEDED"
  | "SESSION_TRADE_CAP"
  | "SLIPPAGE_EXCEEDED";

export type Policy = {
  version: number;
  allowed: Ticker[];
  maxTradeUsd: number;
  dailyLimitUsd: number;
  maxConcentrationPct: number;
  /** Total capital under the mandate. Concentration is measured against this,
   *  not against the filled book, otherwise the first trade is always 100%. */
  bookValueUsd: number;
  maxSlippagePct: number;
  strictMarketHours: boolean;
  maxFeedAgeSeconds: number;
  maxDeviationBps: number;
  updatedAt: number;
};

export type Session = {
  id: string;
  agent: string;
  budgetUsd: number;
  spentUsd: number;
  maxTradeUsd: number;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
};

export type Intent = {
  ticker: Ticker;
  side: "buy" | "sell";
  notionalUsd: number;
  sessionId: string | null;
  /** Test override: ignore the venue session for this intent only. Always
   *  surfaced in the check detail so a bypassed run is never mistaken for a
   *  clean one. */
  bypassHours?: boolean;
};

/** Where the intent came from. Shown in the activity table. */
export type Origin = "manual" | "agent" | "rebalance";

export type CheckResult = {
  layer: LayerKey;
  n: number;
  name: string;
  pass: boolean;
  detail: string;
  code?: ReasonCode;
};

export type Attestation = {
  id: string;
  origin: Origin;
  txHash: string;
  createdAt: number;
  intent: Intent;
  price: number;
  verdict: "APPROVED" | "BLOCKED";
  reasonCode: ReasonCode;
  score: number;
  checks: CheckResult[];
};

export const DEFAULT_POLICY: Policy = {
  version: 1,
  allowed: ["TSLA", "AAPL", "NVDA"],
  maxTradeUsd: 500,
  dailyLimitUsd: 2000,
  maxConcentrationPct: 25,
  bookValueUsd: 10_000,
  maxSlippagePct: 2.5,
  strictMarketHours: true,
  maxFeedAgeSeconds: 300,
  maxDeviationBps: 50,
  updatedAt: 0,
};

/** Estimated price impact for a notional against a shallow simulated pool. */
export function estimateSlippagePct(notionalUsd: number, poolUsd = 85_000): number {
  return (notionalUsd / poolUsd) * 100;
}

export type EvaluateArgs = {
  intent: Intent;
  policy: Policy;
  session: Session | null;
  /** Approved notional already spent today, in USD. */
  spentToday: number;
  /** Current position value per ticker, in USD. */
  positions: Record<string, number>;
  now?: Date;
  origin?: Origin;
};

export function evaluate({
  intent,
  policy,
  session,
  spentToday,
  positions,
  now = new Date(),
  origin = "manual",
}: EvaluateArgs): Attestation {
  const q = quote(intent.ticker, now);
  const venue = sessionState(now);
  const checks: CheckResult[] = [];

  // Layer 1 - Feed Check
  const stale = q.feedAgeSeconds > policy.maxFeedAgeSeconds;
  const deviated = q.deviationBps > policy.maxDeviationBps;
  checks.push({
    layer: "feed",
    n: 1,
    name: "Feed Check",
    pass: !stale && !deviated,
    code: stale ? "FEED_STALE" : deviated ? "FEED_DEVIATION" : undefined,
    detail: stale
      ? `Oracle last published ${q.feedAgeSeconds}s ago, limit is ${policy.maxFeedAgeSeconds}s.`
      : deviated
        ? `Pool is ${q.deviationBps} bps from oracle, limit is ${policy.maxDeviationBps} bps.`
        : `Age ${q.feedAgeSeconds}s, deviation ${q.deviationBps} bps. Both inside tolerance.`,
  });

  // Layer 2 - Window Check
  const bypassed = Boolean(intent.bypassHours) && !venue.open;
  const closed = policy.strictMarketHours && !venue.open && !intent.bypassHours;
  checks.push({
    layer: "window",
    n: 2,
    name: "Window Check",
    pass: !closed,
    code: closed ? "MARKET_CLOSED" : undefined,
    detail: closed
      ? `Underlying venue is ${venue.label.toLowerCase()} at ${venue.nyTime} New York.`
      : bypassed
        ? `Venue is ${venue.label.toLowerCase()}. Skipped by test override, not by policy.`
        : policy.strictMarketHours
          ? `Regular session, ${venue.minutesTo} minutes to close.`
          : "Market hours enforcement is switched off in policy.",
  });

  // Layer 3 - Mandate Vault
  const notAllowed = !policy.allowed.includes(intent.ticker);
  const overSize = intent.notionalUsd > policy.maxTradeUsd;
  const overDaily = spentToday + intent.notionalUsd > policy.dailyLimitUsd;
  const filled = Object.values(positions).reduce((a, b) => a + b, 0) + intent.notionalUsd;
  const book = Math.max(policy.bookValueUsd, filled);
  const after = (positions[intent.ticker] ?? 0) + intent.notionalUsd;
  const concentration = book > 0 ? (after / book) * 100 : 0;
  const overConc = intent.side === "buy" && concentration > policy.maxConcentrationPct;

  const mandateCode: ReasonCode | undefined = notAllowed
    ? "ASSET_NOT_ALLOWED"
    : overSize
      ? "TRADE_SIZE_EXCEEDED"
      : overDaily
        ? "DAILY_LIMIT_EXCEEDED"
        : overConc
          ? "CONCENTRATION_EXCEEDED"
          : undefined;

  checks.push({
    layer: "mandate",
    n: 3,
    name: "Mandate Vault",
    pass: !mandateCode,
    code: mandateCode,
    detail: notAllowed
      ? `${intent.ticker} is not on the mandate allowlist.`
      : overSize
        ? `Notional $${intent.notionalUsd} exceeds the per-trade cap of $${policy.maxTradeUsd}.`
        : overDaily
          ? `Would take today's total to $${(spentToday + intent.notionalUsd).toFixed(0)}, over the $${policy.dailyLimitUsd} daily limit.`
          : overConc
            ? `${intent.ticker} would reach ${concentration.toFixed(1)}% of a $${book.toFixed(0)} book, over the ${policy.maxConcentrationPct}% cap.`
            : `Allowlisted, $${intent.notionalUsd} inside caps, ${concentration.toFixed(1)}% concentration after fill.`,
  });

  // Layer 4 - Route Guard
  const slip = estimateSlippagePct(intent.notionalUsd);
  const overSlip = slip > policy.maxSlippagePct;
  let routeCode: ReasonCode | undefined;
  let routeDetail = "";

  if (!session) {
    routeCode = "NO_SESSION";
    routeDetail = "No delegated session selected. The router will not see an unsigned intent.";
  } else if (session.revoked) {
    routeCode = "SESSION_REVOKED";
    routeDetail = `Session ${session.id} was revoked.`;
  } else if (session.expiresAt < now.getTime()) {
    routeCode = "SESSION_EXPIRED";
    routeDetail = `Session ${session.id} expired.`;
  } else if (intent.notionalUsd > session.maxTradeUsd) {
    routeCode = "SESSION_TRADE_CAP";
    routeDetail = `Notional exceeds this session's per-trade cap of $${session.maxTradeUsd}.`;
  } else if (session.spentUsd + intent.notionalUsd > session.budgetUsd) {
    routeCode = "SESSION_BUDGET_EXCEEDED";
    routeDetail = `Session budget has $${(session.budgetUsd - session.spentUsd).toFixed(0)} left.`;
  } else if (overSlip) {
    routeCode = "SLIPPAGE_EXCEEDED";
    routeDetail = `Estimated impact ${slip.toFixed(2)}%, tolerance is ${policy.maxSlippagePct}%.`;
  } else {
    routeDetail = `Session valid, impact ${slip.toFixed(2)}%, $${(session.budgetUsd - session.spentUsd - intent.notionalUsd).toFixed(0)} budget left after fill.`;
  }

  checks.push({
    layer: "route",
    n: 4,
    name: "Route Guard",
    pass: !routeCode,
    code: routeCode,
    detail: routeDetail,
  });

  const failed = checks.find((c) => !c.pass);
  const verdict: "APPROVED" | "BLOCKED" = failed ? "BLOCKED" : "APPROVED";
  const reasonCode: ReasonCode = failed?.code ?? "APPROVED";

  // Layer 5 - Receipt. Always writes, pass or fail. That is the point of it.
  checks.push({
    layer: "receipt",
    n: 5,
    name: "Receipt",
    pass: true,
    detail: `Attestation written with reason code ${reasonCode}.`,
  });

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);

  return {
    id: pseudoHash(`${intent.ticker}${intent.notionalUsd}${now.getTime()}`, 64),
    origin,
    txHash: pseudoHash(`tx${intent.ticker}${now.getTime()}`, 64),
    createdAt: now.getTime(),
    intent,
    price: q.price,
    verdict,
    reasonCode,
    score,
    checks,
  };
}

/** Deterministic hex string. Local identifier only, never an on-chain hash. */
export function pseudoHash(seed: string, len = 64): string {
  let h = 2166136261;
  let out = "";
  for (let i = 0; i < len; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619);
    out += ((h >>> 24) & 15).toString(16);
  }
  return `0x${out}`;
}

export const REASON_TEXT: Record<ReasonCode, string> = {
  APPROVED: "All checks returned yes",
  FEED_STALE: "Oracle price older than the policy window",
  FEED_DEVIATION: "Pool price too far from the oracle",
  MARKET_CLOSED: "Underlying venue is closed",
  ASSET_NOT_ALLOWED: "Asset is not on the mandate allowlist",
  TRADE_SIZE_EXCEEDED: "Notional over the per-trade cap",
  DAILY_LIMIT_EXCEEDED: "Notional over the daily rolling limit",
  CONCENTRATION_EXCEEDED: "Position would breach the concentration cap",
  NO_SESSION: "No delegated session selected",
  SESSION_REVOKED: "Session was revoked",
  SESSION_EXPIRED: "Session has expired",
  SESSION_BUDGET_EXCEEDED: "Session budget exhausted",
  SESSION_TRADE_CAP: "Notional over the session per-trade cap",
  SLIPPAGE_EXCEEDED: "Estimated price impact over tolerance",
};
