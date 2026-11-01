import { universe, type Ticker } from "@/config";

/* ---------------------------------------------------------------------------
   VENUE SESSION. This part is real logic, not a simulation: it reads the
   actual wall clock in America/New_York and applies NYSE regular hours,
   09:30 to 16:00, Monday to Friday.

   Not wired: the market holiday calendar. A US market holiday will read as
   "open" here. Stated in the UI rather than faked.
   --------------------------------------------------------------------------- */

export type SessionState = {
  open: boolean;
  label: string;
  /** Minutes until the next open or close. */
  minutesTo: number;
  nyTime: string;
};

function nyParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekday = parts.weekday as string;
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  const minute = Number(parts.minute);
  return { weekday, hour, minute, minutes: hour * 60 + minute };
}

const OPEN_MIN = 9 * 60 + 30;
const CLOSE_MIN = 16 * 60;

export function sessionState(now: Date = new Date()): SessionState {
  const { weekday, minutes } = nyParts(now);
  const weekend = weekday === "Sat" || weekday === "Sun";
  const nyTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  if (weekend) {
    return { open: false, label: "Weekend", minutesTo: 0, nyTime };
  }
  if (minutes < OPEN_MIN) {
    return { open: false, label: "Pre-market", minutesTo: OPEN_MIN - minutes, nyTime };
  }
  if (minutes >= CLOSE_MIN) {
    return { open: false, label: "After hours", minutesTo: 0, nyTime };
  }
  return { open: true, label: "Regular session", minutesTo: CLOSE_MIN - minutes, nyTime };
}

/* ---------------------------------------------------------------------------
   PRICES. Simulated, deterministic, and labelled as such everywhere they are
   shown. No live feed is wired, so nothing here is presented as a real quote.
   --------------------------------------------------------------------------- */

export type Quote = {
  ticker: Ticker;
  name: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  /** Seconds since the simulated oracle last published. */
  feedAgeSeconds: number;
  /** Simulated deviation of the pool price from the oracle price, in bps. */
  deviationBps: number;
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Bucketed to 15s so the whole app agrees on the same "tick". */
export function tickKey(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 15000);
}

export function quote(ticker: Ticker, now: Date = new Date()): Quote {
  const meta = universe.find((u) => u.ticker === ticker)!;
  const t = tickKey(now);
  const drift = (hash(`${ticker}:${Math.floor(t / 240)}`) - 0.5) * 0.06;
  const wobble = (hash(`${ticker}:${t}`) - 0.5) * 0.008;
  const price = meta.base * (1 + drift + wobble);
  const change = price - meta.base;
  const spread = meta.base * (0.004 + hash(`${ticker}:hl`) * 0.01);

  return {
    ticker,
    name: meta.name,
    price,
    change,
    changePct: (change / meta.base) * 100,
    high: Math.max(price, meta.base + spread),
    low: Math.min(price, meta.base - spread),
    feedAgeSeconds: Math.floor(hash(`${ticker}:age:${Math.floor(t / 20)}`) * 900),
    deviationBps: Math.round(hash(`${ticker}:dev:${Math.floor(t / 20)}`) * 120),
  };
}

export function allQuotes(now: Date = new Date()): Quote[] {
  return universe.map((u) => quote(u.ticker, now));
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
