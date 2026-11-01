"use client";

import { useMemo, useState } from "react";
import { Search, FileText, CircleCheck, CircleX } from "lucide-react";
import PageShell from "@/components/PageShell";
import Reveal from "@/components/Reveal";
import { Button, Card, Pill } from "@/components/ui/primitives";
import CopyButton, { truncate } from "@/components/CopyButton";
import { useStore } from "@/lib/store";
import { REASON_TEXT } from "@/lib/gate";
import { money } from "@/lib/market";

type Filter = "all" | "approved" | "blocked";

export default function AuditPage() {
  const { attestations, ready } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(
    () => ({
      all: attestations.length,
      approved: attestations.filter((a) => a.verdict === "APPROVED").length,
      blocked: attestations.filter((a) => a.verdict === "BLOCKED").length,
    }),
    [attestations],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return attestations.filter((a) => {
      if (filter === "approved" && a.verdict !== "APPROVED") return false;
      if (filter === "blocked" && a.verdict !== "BLOCKED") return false;
      if (!needle) return true;
      return (
        a.id.toLowerCase().includes(needle) ||
        a.intent.ticker.toLowerCase().includes(needle) ||
        a.reasonCode.toLowerCase().includes(needle)
      );
    });
  }, [attestations, filter, q]);

  const TABS: [Filter, string][] = [
    ["all", `All (${counts.all})`],
    ["approved", `Approved (${counts.approved})`],
    ["blocked", `Blocked (${counts.blocked})`],
  ];

  return (
    <PageShell
      eyebrow="Layer 5"
      meta="Receipt"
      title="Audit trail"
      sub="Every intent leaves a record, cleared or blocked, with the reason code that decided it. This is the part a raw transaction receipt cannot give you."
      right={<Pill tone="accent">{counts.all} records</Pill>}
    >
      <Reveal>
        <Card className="mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === key
                    ? key === "blocked"
                      ? "bg-bad/15 text-bad"
                      : key === "approved"
                        ? "bg-ok/15 text-ok"
                        : "bg-white/10 text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search id, ticker or reason code"
              aria-label="Search attestations"
              className="w-full rounded-xl border border-line bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-text outline-none transition placeholder:text-muted focus:border-accent sm:w-72"
            />
          </div>
        </Card>
      </Reveal>

      {!ready ? (
        <Card className="h-64 animate-pulse opacity-40" />
      ) : rows.length === 0 ? (
        <Reveal>
          <Card className="px-6 py-20 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-4 text-sm font-semibold text-text">
              {counts.all === 0 ? "No records yet" : "Nothing matches that filter"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
              {counts.all === 0
                ? "Run an intent through the clearance console and the receipt will appear here."
                : "Try a different tab or clear the search."}
            </p>
            {counts.all === 0 && (
              <div className="mt-6">
                <Button href="/dashboard" variant="accent">
                  Open the console
                </Button>
              </div>
            )}
          </Card>
        </Reveal>
      ) : (
        <>
          {/* Desktop table */}
          <Reveal className="hidden lg:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-white/[0.03]">
                      {["Receipt id", "Asset", "Side", "Notional", "Verdict", "Reason code", "Time"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id} className="border-b border-line/50 transition last:border-0 hover:bg-white/[0.025]">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono text-muted">{truncate(a.id, 10, 6)}</span>
                            <CopyButton value={a.id} />
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-text">{a.intent.ticker}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono uppercase ${a.intent.side === "buy" ? "text-ok" : "text-bad"}`}
                          >
                            {a.intent.side}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-text-2">
                          {money(a.intent.notionalUsd)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              a.verdict === "APPROVED" ? "text-ok" : "text-bad"
                            }`}
                          >
                            {a.verdict === "APPROVED" ? (
                              <CircleCheck className="h-3.5 w-3.5" />
                            ) : (
                              <CircleX className="h-3.5 w-3.5" />
                            )}
                            {a.verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-text-2">{a.reasonCode}</span>
                          <span className="ml-2 text-muted">{REASON_TEXT[a.reasonCode]}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Reveal>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {rows.map((a, i) => (
              <Reveal key={a.id} delay={Math.min(i * 40, 240)}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-text">
                        {a.intent.ticker}{" "}
                        <span className={a.intent.side === "buy" ? "text-ok" : "text-bad"}>
                          {a.intent.side.toUpperCase()}
                        </span>
                      </p>
                      <p className="font-mono text-xs tabular-nums text-muted">
                        {money(a.intent.notionalUsd)} · {new Date(a.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Pill tone={a.verdict === "APPROVED" ? "ok" : "bad"}>{a.verdict}</Pill>
                  </div>

                  <div className="mt-3 rounded-lg border border-line bg-white/[0.02] p-3">
                    <p className="font-mono text-[11px] text-text-2">{a.reasonCode}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{REASON_TEXT[a.reasonCode]}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">id</span>
                    <span className="truncate font-mono text-[11px] text-muted">{truncate(a.id, 12, 8)}</span>
                    <CopyButton value={a.id} />
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      )}

      <Reveal delay={120}>
        <Card className="mt-6 p-4">
          <p className="text-xs leading-relaxed text-muted">
            Receipt ids here are locally generated identifiers, not on-chain transaction hashes.
            Nothing has been written to {""}
            <span className="font-mono">Robinhood Chain</span>. Once the Receipt contract is
            deployed, each row will link to its transaction on Blockscout.
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
