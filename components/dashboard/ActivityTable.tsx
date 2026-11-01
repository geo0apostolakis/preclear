"use client";

import Link from "next/link";
import { History, ChevronRight, CircleCheck, CircleX } from "lucide-react";
import Panel from "./Panel";
import { Pill } from "@/components/ui/primitives";
import CopyButton, { truncate } from "@/components/CopyButton";
import { useStore } from "@/lib/store";
import { REASON_TEXT, type Origin } from "@/lib/gate";
import { money } from "@/lib/market";
import { chain } from "@/config";

const ORIGIN_LABEL: Record<Origin, string> = {
  agent: "Agent trade",
  manual: "Manual test",
  rebalance: "Rebalance leg",
};

export default function ActivityTable() {
  const { attestations } = useStore();
  const rows = attestations.slice(0, 8);

  return (
    <Panel
      icon={<History className="h-4 w-4" />}
      title="Activity and receipts"
      sub={`Everything the gate has decided this session, cleared or blocked, with its reason code.`}
      badge={{ label: `${attestations.length} records`, tone: "accent" }}
      right={
        <Link
          href="/audit"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          Full trail
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 bg-white/[0.02] px-4 py-8 text-center text-xs text-muted">
          No receipts yet. Trigger a scan or submit a manual intent.
        </p>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  {["Receipt", "Source", "Asset", "Amount", "Decision", "Reason", "Time"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-line/40 last:border-0 hover:bg-white/[0.025]">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-muted">{truncate(a.id, 8, 6)}</span>
                        <CopyButton value={a.id} />
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone="muted">{ORIGIN_LABEL[a.origin]}</Pill>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold text-text">{a.intent.ticker}</span>
                      <span
                        className={`ml-2 font-mono text-[10px] uppercase ${a.intent.side === "buy" ? "text-ok" : "text-bad"}`}
                      >
                        {a.intent.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-text-2">
                      {money(a.intent.notionalUsd)}
                    </td>
                    <td className="px-3 py-2.5">
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
                        {a.verdict === "APPROVED" ? "Cleared" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-text-2">{a.reasonCode}</span>
                      <span className="ml-2 text-muted">{REASON_TEXT[a.reasonCode]}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-2.5 lg:hidden">
            {rows.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="font-mono text-sm font-bold text-text">{a.intent.ticker}</span>
                    <span
                      className={`ml-2 font-mono text-[10px] uppercase ${a.intent.side === "buy" ? "text-ok" : "text-bad"}`}
                    >
                      {a.intent.side}
                    </span>
                    <span className="ml-2 font-mono text-[11px] tabular-nums text-muted">
                      {money(a.intent.notionalUsd)}
                    </span>
                  </span>
                  <Pill tone={a.verdict === "APPROVED" ? "ok" : "bad"}>
                    {a.verdict === "APPROVED" ? "Cleared" : "Blocked"}
                  </Pill>
                </div>
                <p className="mt-2 font-mono text-[11px] text-text-2">{a.reasonCode}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {ORIGIN_LABEL[a.origin]} · {new Date(a.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        Receipt ids are local identifiers, not {chain.name} transaction hashes. Nothing has been
        written on chain.
      </p>
    </Panel>
  );
}
