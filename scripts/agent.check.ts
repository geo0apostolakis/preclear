import { pickAsset, withinRiskAppetite, computeDrift } from "../lib/agent";
import type { Quote } from "../lib/market";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, x = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n} ${x}`); }
};

const q = (ticker: string, changePct: number) =>
  ({ ticker, name: ticker, price: 100, change: 0, changePct, high: 0, low: 0,
     feedAgeSeconds: 0, deviationBps: 0 }) as unknown as Quote;

const quotes = [q("TSLA", -3), q("AAPL", 5), q("NVDA", 1)];
const allowed = ["TSLA", "AAPL", "NVDA"] as never;

console.log("agent");
check("momentum picks strongest", pickAsset("momentum", allowed, quotes, 0, "AUTO")?.ticker === "AAPL");
check("reversion picks weakest", pickAsset("reversion", allowed, quotes, 0, "AUTO")?.ticker === "TSLA");
check("rotation cycles", pickAsset("rotation", allowed, quotes, 1, "AUTO")?.ticker === "AAPL");
check("pinned target wins", pickAsset("momentum", allowed, quotes, 0, "NVDA" as never)?.ticker === "NVDA");
check("empty allowlist returns null", pickAsset("momentum", [] as never, quotes, 0, "AUTO") === null);
check("pinned asset off allowlist returns null",
  pickAsset("momentum", ["TSLA"] as never, quotes, 0, "AAPL" as never) === null);

check("risk filter blocks a fat order", withinRiskAppetite(5000, 10, 2.5).ok === false);
check("risk filter allows a small order", withinRiskAppetite(100, 100, 2.5).ok === true);

const drift = computeDrift(allowed, { TSLA: 600, AAPL: 400 }, { TSLA: 50, AAPL: 50, NVDA: 0 }, 10000);
check("drift current pct", Math.round(drift[0].currentPct) === 60);
check("drift delta sells the overweight", Math.round(drift[0].deltaUsd) === -100);
check("drift delta buys the underweight", Math.round(drift[1].deltaUsd) === 100);
check("empty book has no drift",
  computeDrift(allowed, {}, { TSLA: 100 }, 10000).every((r) => r.driftPct === 0));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
