"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import PageShell from "@/components/PageShell";
import Reveal from "@/components/Reveal";
import { Card, Pill } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { allQuotes, money, pct, sessionState, type Quote, type SessionState } from "@/lib/market";

export default function MarketsPage() {
  const { policy } = useStore();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [venue, setVenue] = useState<SessionState | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setQuotes(allQuotes(now));
      setVenue(sessionState(now));
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (!quotes) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return quotes;
    return quotes.filter(
      (x) => x.ticker.toLowerCase().includes(needle) || x.name.toLowerCase().includes(needle),
    );
  }, [quotes, q]);

  return (
    <PageShell
      eyebrow="Layer 1 and 2"
      meta="Feed Check · Window Check"
      title="Tokenized equities"
      sub="What the Feed Check and the Window Check see when an intent arrives: oracle age, deviation from the pool, and whether the underlying venue is open."
      right={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker or name"
            aria-label="Search tickers"
            className="w-full rounded-xl border border-line bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-text outline-none transition placeholder:text-muted focus:border-accent sm:w-64"
          />
        </div>
      }
    >
      {/* Venue banner */}
      <Reveal>
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${venue?.open ? "bg-ok" : "bg-warn"}`}
              style={{ animation: "pulse-dot 2.4s ease-in-out infinite" }}
            />
            <div>
              <p className="text-sm font-semibold text-text">
                NYSE / NASDAQ · {venue ? venue.label : "checking"}
              </p>
              <p className="font-mono text-[11px] text-muted">
                {venue
                  ? venue.open
                    ? `${venue.minutesTo} minutes to close · ${venue.nyTime} America/New_York`
                    : `${venue.nyTime} America/New_York`
                  : " "}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={policy.strictMarketHours ? "accent" : "muted"}>
              {policy.strictMarketHours ? "Hours enforced" : "Hours not enforced"}
            </Pill>
            <Pill tone="warn">Holiday calendar not wired</Pill>
          </div>
        </Card>
      </Reveal>

      {/* Quotes */}
      {!quotes ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-56 animate-pulse p-5 opacity-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-sm text-muted">Nothing matches &ldquo;{q}&rdquo;.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quote, i) => {
            const allowed = policy.allowed.includes(quote.ticker);
            const fresh = quote.feedAgeSeconds <= policy.maxFeedAgeSeconds;
            const tight = quote.deviationBps <= policy.maxDeviationBps;
            return (
              <Reveal key={quote.ticker} delay={i * 60}>
                <Card className="h-full p-5 transition hover:border-accent/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-text">{quote.ticker}</span>
                        <Pill tone={allowed ? "accent" : "muted"}>
                          {allowed ? "Allowlisted" : "Not in mandate"}
                        </Pill>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{quote.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-lg font-semibold tabular-nums text-text">
                        {money(quote.price)}
                      </p>
                      <p
                        className={`font-mono text-xs tabular-nums ${
                          quote.changePct >= 0 ? "text-ok" : "text-bad"
                        }`}
                      >
                        {pct(quote.changePct)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-line bg-white/[0.02] p-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">High</p>
                      <p className="font-mono text-xs tabular-nums text-text-2">{money(quote.high)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Low</p>
                      <p className="font-mono text-xs tabular-nums text-text-2">{money(quote.low)}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted">Oracle age</dt>
                      <dd className={`flex items-center gap-1.5 font-mono ${fresh ? "text-ok" : "text-bad"}`}>
                        {fresh ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                        {quote.feedAgeSeconds}s / {policy.maxFeedAgeSeconds}s
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted">Pool deviation</dt>
                      <dd className={`font-mono ${tight ? "text-ok" : "text-bad"}`}>
                        {quote.deviationBps} / {policy.maxDeviationBps} bps
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted">Token contract</dt>
                      <dd className="font-mono text-[10px] uppercase tracking-wider text-bad">missing</dd>
                    </div>
                  </dl>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <Reveal delay={120}>
        <Card className="mt-6 flex items-start gap-3 p-4">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <p className="text-xs leading-relaxed text-muted">
            Prices, oracle ages and pool deviations on this page are simulated locally and refresh
            every 15 seconds. No price feed is connected. The venue session above is real: it reads
            your clock in America/New_York and applies regular hours, 09:30 to 16:00, Monday to
            Friday. US market holidays are not in the calendar yet, so a holiday reads as open.
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
