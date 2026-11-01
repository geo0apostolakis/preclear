"use client";

import { useEffect, useState } from "react";
import { sessionState, type SessionState } from "@/lib/market";
import { Pill } from "./ui/primitives";

/** Live venue session state. Client-only so server and client markup agree. */
export default function MarketBadge({ full = false }: { full?: boolean }) {
  const [s, setS] = useState<SessionState | null>(null);

  useEffect(() => {
    const tick = () => setS(sessionState(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  if (!s) {
    return (
      <Pill tone="muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        NYSE
      </Pill>
    );
  }

  return (
    <Pill tone={s.open ? "ok" : "warn"}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.open ? "bg-ok" : "bg-warn"}`}
        style={{ animation: "pulse-dot 2.4s ease-in-out infinite" }}
      />
      {s.open ? "NYSE open" : "NYSE closed"}
      {full && <span className="font-normal opacity-70">· {s.nyTime} ET</span>}
    </Pill>
  );
}
