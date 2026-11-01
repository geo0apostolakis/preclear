"use client";

import { useEffect, useState } from "react";
import { allQuotes, money, pct, type Quote } from "@/lib/market";

/** Marquee of the tradeable universe. Prices are simulated and labelled. */
export default function TickerStrip() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  useEffect(() => {
    const tick = () => setQuotes(allQuotes(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  if (!quotes) return <div className="h-12 border-y border-line" />;

  const row = [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden border-y border-line bg-bg-2/50">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />
      <div className="flex h-12 items-center">
        <div className="marquee-track flex shrink-0 items-center gap-8 pr-8">
          {row.map((q, i) => (
            <span key={`${q.ticker}-${i}`} className="flex shrink-0 items-center gap-2 font-mono text-xs">
              <span className="font-bold text-text">{q.ticker}</span>
              <span className="tabular-nums text-text-2">{money(q.price)}</span>
              <span className={`tabular-nums ${q.changePct >= 0 ? "text-ok" : "text-bad"}`}>
                {pct(q.changePct)}
              </span>
            </span>
          ))}
        </div>
      </div>
      <span className="pointer-events-none absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded border border-line-2 bg-bg px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted sm:block">
        simulated
      </span>
    </div>
  );
}
