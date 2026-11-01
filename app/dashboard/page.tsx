"use client";

import { RotateCcw } from "lucide-react";
import PageShell from "@/components/PageShell";
import Reveal from "@/components/Reveal";
import { Button, Pill, Stat } from "@/components/ui/primitives";
import WalletGate from "@/components/dashboard/WalletGate";
import AgentPanel from "@/components/dashboard/AgentPanel";
import Rebalancer from "@/components/dashboard/Rebalancer";
import SessionQuickCreate from "@/components/dashboard/SessionQuickCreate";
import IntentTester from "@/components/dashboard/IntentTester";
import ActivityTable from "@/components/dashboard/ActivityTable";
import { useStore } from "@/lib/store";
import { money } from "@/lib/market";
import { chain } from "@/config";

function Overview() {
  const store = useStore();
  const approved = store.attestations.filter((a) => a.verdict === "APPROVED").length;
  const blocked = store.attestations.length - approved;
  const book = Object.values(store.positions).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat label="Intents" value={store.attestations.length} />
      <Stat label="Cleared" value={approved} tone="ok" />
      <Stat label="Blocked" value={blocked} tone="bad" />
      <Stat label="Book" value={money(book)} hint={`of ${money(store.policy.bookValueUsd)}`} />
      <Stat
        label="Spent 24h"
        value={money(store.spentToday)}
        hint={`cap ${money(store.policy.dailyLimitUsd)}`}
      />
    </div>
  );
}

export default function DashboardPage() {
  const store = useStore();

  return (
    <PageShell
      eyebrow="Command centre"
      meta={`${chain.name} (${chain.id})`}
      title="Clearance console"
      sub="Run an agent, rebalance a book, delegate a session or push a single order. Everything here is evaluated by the same five checks."
      right={
        <>
          <Pill tone="warn">Local engine</Pill>
          {store.attestations.length > 0 && (
            <Button size="sm" variant="glass" onClick={store.resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </>
      }
    >
      <WalletGate>
        <div className="space-y-6">
          <Reveal>
            <Overview />
          </Reveal>
          <Reveal delay={60}>
            <AgentPanel />
          </Reveal>
          <Reveal delay={90}>
            <Rebalancer />
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal delay={120}>
              <SessionQuickCreate />
            </Reveal>
            <Reveal delay={150}>
              <IntentTester />
            </Reveal>
          </div>
          <Reveal delay={180}>
            <ActivityTable />
          </Reveal>
        </div>
      </WalletGate>
    </PageShell>
  );
}
