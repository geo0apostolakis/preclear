/**
 * SINGLE SOURCE OF TRUTH.
 * Every page and component reads from here.
 *
 * MISSING = a real-world fact I do not have yet (address, social URL).
 * It renders on the page as a dashed chip. Nothing is invented.
 */

export const MISSING = "MISSING";

export const chain = {
  name: "Robinhood Chain",
  id: 4663,
  explorer: "https://robinhoodchain.blockscout.com",
  rpc: MISSING,
  currency: { name: "Ether", symbol: "ETH", decimals: 18 },
} as const;

export const explorerToken = (a: string) => `${chain.explorer}/token/${a}`;
export const explorerAddress = (a: string) => `${chain.explorer}/address/${a}`;
export const explorerTx = (h: string) => `${chain.explorer}/tx/${h}`;

/** True until the clearance contracts are deployed and verified on Blockscout. */
export const prelaunch = true;

export const site = {
  name: "PRECLEAR",
  headlineA: "Execution is solved.",
  headlineB: "Permission is not.",
  heroSub:
    "Tokenized equities move on Robinhood Chain in seconds. Nothing in that path asks whether the trade was allowed to happen. {name} is the missing question: five checks that must all return yes before an intent reaches a router.",
  positioning: "On-chain pre-trade clearance for tokenized assets on Robinhood Chain.",
  url: "https://github.com/geo0apostolakis/preclear",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Markets", href: "/markets" },
  { label: "Policy", href: "/policy" },
  { label: "Sessions", href: "/sessions" },
  { label: "Audit", href: "/audit" },
];

/** The clearance contract. Not deployed yet. */
export const contractAddress = MISSING;

// ---------------------------------------------------------------------------
// LAYERS
// ---------------------------------------------------------------------------

export type Status = "live" | "roadmap";

export type Layer = {
  n: number;
  key: LayerKey;
  name: string;
  short: string;
  description: string;
  status: Status;
  address?: string;
  href?: string;
  icon: "gauge" | "clock" | "vault" | "route" | "receipt";
};

export type LayerKey = "feed" | "window" | "mandate" | "route" | "receipt";

export const layers: Layer[] = [
  {
    n: 1,
    key: "feed",
    name: "Feed Check",
    short: "Oracle integrity",
    description: "Freshness window and deviation bound on every price read.",
    status: "roadmap",
    icon: "gauge",
    href: "/markets",
  },
  {
    n: 2,
    key: "window",
    name: "Window Check",
    short: "Venue session",
    description: "Trading hours, halts and settlement calendar of the underlying venue.",
    status: "roadmap",
    icon: "clock",
    href: "/markets",
  },
  {
    n: 3,
    key: "mandate",
    name: "Mandate Vault",
    short: "Position policy",
    description: "Asset allowlist, per-trade cap, daily notional and concentration limit.",
    status: "roadmap",
    icon: "vault",
    href: "/policy",
  },
  {
    n: 4,
    key: "route",
    name: "Route Guard",
    short: "Delegation and slippage",
    description: "Session validity, remaining budget and price impact. No clearance, no swap.",
    status: "roadmap",
    icon: "route",
    href: "/sessions",
  },
  {
    n: 5,
    key: "receipt",
    name: "Receipt",
    short: "Attestation",
    description: "Verdict and reason code written next to the trade, pass or fail.",
    status: "roadmap",
    icon: "receipt",
    href: "/audit",
  },
];

export const layersHeading = {
  title: "Five checks, one verdict",
  sub: "An intent passes every check below before it is authorised. One failure blocks the whole trade.",
};

// ---------------------------------------------------------------------------
// PROBLEM + COMPARISON
// ---------------------------------------------------------------------------

export const problem = {
  eyebrow: "The gap",
  heading: "The stack answers how. Nothing answers whether.",
  paragraphs: [
    "A router finds the best path. A wallet produces a signature. A sequencer orders the block. Each is very good at its job, and each assumes the decision was already made somewhere upstream.",
    "For tokenized real-world assets that assumption breaks. An equity token has a venue behind it with opening hours and halts, a price feed that can go stale between blocks, and a holder who may sit under limits a token spend cap knows nothing about.",
    "Those checks do exist, but they live off chain in an operator's script. That makes them invisible to everyone else, unenforceable by anyone else, and gone the moment the operator edits the file.",
  ],
};

export type ComparisonRow = { layer: string; today: string; missing: string; solution: string };

export const comparisonHeading = {
  title: "Where the current stack stops",
  sub: "One row per check. What is already handled, what nobody handles, and what goes in the gap.",
};

export const comparison: ComparisonRow[] = [
  {
    layer: "Price feeds",
    today: "Oracles publish a price on chain.",
    missing: "No enforced staleness or deviation bound at the point of use.",
    solution: "Feed Check: revert on a stale or out-of-tolerance read.",
  },
  {
    layer: "Market hours",
    today: "The chain produces blocks around the clock.",
    missing: "Nothing on chain knows the underlying venue is closed or halted.",
    solution: "Window Check: block intents outside the venue session.",
  },
  {
    layer: "Wallets and policy",
    today: "Spend limits and token allowlists.",
    missing: "Limits are per token, never per mandate or per position.",
    solution: "Mandate Vault: asset, size and concentration limits held on chain.",
  },
  {
    layer: "Routers and DEXs",
    today: "Best-price routing and settlement.",
    missing: "A route is chosen without knowing whether the trade is permitted.",
    solution: "Route Guard: the router sees the intent only after clearance.",
  },
  {
    layer: "Post-trade records",
    today: "Raw transaction receipts.",
    missing: "A receipt shows what happened, never why it was allowed.",
    solution: "Receipt: verdict and reason code stored alongside the trade.",
  },
];

export const closing = {
  heading: "Put the check where it cannot be skipped",
  body: "Route an agent, vault or desk through the gate on Robinhood Chain and every trade it makes carries a verdict anyone can audit afterwards.",
};

export const pullQuote =
  "The router will always find you a path. The wallet will always give you a signature. Neither one is being asked the only question that matters.";

// ---------------------------------------------------------------------------
// SOCIALS + TOKEN
// ---------------------------------------------------------------------------

export const socials = {
  docs: "https://github.com/geo0apostolakis/preclear#readme",
  github: "https://github.com/geo0apostolakis/preclear",
};


// ---------------------------------------------------------------------------
// TRADEABLE UNIVERSE (tickers are public facts; prices are simulated locally)
// ---------------------------------------------------------------------------

export const universe = [
  { ticker: "TSLA", name: "Tesla, Inc.", base: 354.08 },
  { ticker: "AAPL", name: "Apple Inc.", base: 319.97 },
  { ticker: "NVDA", name: "NVIDIA Corporation", base: 230.36 },
  { ticker: "AMZN", name: "Amazon.com, Inc.", base: 241.5 },
  { ticker: "MSFT", name: "Microsoft Corporation", base: 512.4 },
  { ticker: "GOOGL", name: "Alphabet Inc.", base: 205.12 },
] as const;

export type Ticker = (typeof universe)[number]["ticker"];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function fill(s: string): string {
  return s.split("{name}").join(site.name);
}

export function isReal(v: string | undefined | null): boolean {
  return Boolean(v && v.trim() && v !== MISSING);
}

/** A layer only shows LIVE with a real address behind it. */
export function resolveStatus(layer: Layer): Status {
  return layer.status === "live" && isReal(layer.address) ? "live" : "roadmap";
}

export const colors = {
  bg: "#05070a",
  surface: "#0c1219",
  accent: "#38bdf8",
  text: "#e8eef5",
  muted: "#7d8fa0",
} as const;
