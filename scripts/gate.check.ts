import { evaluate, DEFAULT_POLICY, type Session, type Intent } from "../lib/gate";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

const openDay = new Date("2026-09-04T14:00:00Z");   // Fri 10:00 New York
const closedDay = new Date("2026-09-06T14:00:00Z"); // Sun

const session: Session = {
  id: "sess_test", agent: "a", budgetUsd: 2500, spentUsd: 0,
  maxTradeUsd: 600, createdAt: 0, expiresAt: 4102444800000, revoked: false,
};
const base: Intent = { ticker: "TSLA", side: "buy", notionalUsd: 300, sessionId: "sess_test" };
const policy = { ...DEFAULT_POLICY, maxFeedAgeSeconds: 100000, maxDeviationBps: 100000 };

const run = (o: Partial<Parameters<typeof evaluate>[0]> = {}) =>
  evaluate({ intent: base, policy, session, spentToday: 0, positions: {}, now: openDay, ...o });

console.log("gate engine");
check("clean intent approves", run().verdict === "APPROVED", run().reasonCode);
check("closed venue blocks", run({ now: closedDay }).reasonCode === "MARKET_CLOSED");
check("hours off allows closed venue",
  run({ now: closedDay, policy: { ...policy, strictMarketHours: false } }).reasonCode === "APPROVED");
check("asset off allowlist blocks",
  run({ intent: { ...base, ticker: "MSFT" } }).reasonCode === "ASSET_NOT_ALLOWED");
check("over per-trade cap blocks",
  run({ intent: { ...base, notionalUsd: 900 } }).reasonCode === "TRADE_SIZE_EXCEEDED");
check("over daily limit blocks", run({ spentToday: 1900 }).reasonCode === "DAILY_LIMIT_EXCEEDED");
check("concentration blocks",
  run({ intent: { ...base, notionalUsd: 400 }, positions: { TSLA: 2400 } }).reasonCode === "CONCENTRATION_EXCEEDED");
check("no session blocks",
  run({ intent: { ...base, sessionId: null }, session: null }).reasonCode === "NO_SESSION");
check("revoked session blocks",
  run({ session: { ...session, revoked: true } }).reasonCode === "SESSION_REVOKED");
check("expired session blocks",
  run({ session: { ...session, expiresAt: 1 } }).reasonCode === "SESSION_EXPIRED");
check("session trade cap blocks",
  run({ intent: { ...base, notionalUsd: 700 }, policy: { ...policy, maxTradeUsd: 5000 } }).reasonCode === "SESSION_TRADE_CAP");
check("session budget blocks",
  run({ session: { ...session, spentUsd: 2400 } }).reasonCode === "SESSION_BUDGET_EXCEEDED");
check("slippage blocks",
  run({ policy: { ...policy, maxSlippagePct: 0.1 } }).reasonCode === "SLIPPAGE_EXCEEDED");
check("stale feed blocks",
  run({ policy: { ...policy, maxFeedAgeSeconds: 0 } }).reasonCode === "FEED_STALE");
check("receipt always written", run({ now: closedDay }).checks.length === 5);
check("receipt layer passes even when blocked",
  run({ now: closedDay }).checks[4].pass === true);
check("first failing check decides the code", (() => {
  const r = run({ now: closedDay, intent: { ...base, ticker: "MSFT" } });
  return r.reasonCode === "MARKET_CLOSED";
})());

check("hours bypass overrides a closed venue",
  run({ now: closedDay, intent: { ...base, bypassHours: true } }).reasonCode === "APPROVED");
check("bypass detail names the override", (() => {
  const r = run({ now: closedDay, intent: { ...base, bypassHours: true } });
  return r.checks[1].detail.includes("test override");
})());
check("origin is recorded", run({ origin: "agent" }).origin === "agent");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
