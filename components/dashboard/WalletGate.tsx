"use client";

import { Lock, Wallet, AlertTriangle } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { useWallet } from "@/lib/wallet";
import { chain } from "@/config";

/** Gates the console behind a real EIP-1193 connection. */
export default function WalletGate({ children }: { children: React.ReactNode }) {
  const w = useWallet();

  if (w.connected && w.onRightChain) return <>{children}</>;

  return (
    <Card className="mx-auto max-w-xl px-6 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10">
        <Lock className="h-6 w-6 text-accent" />
      </span>

      {!w.connected ? (
        <>
          <h2 className="mt-6 text-xl font-semibold tracking-tight text-text">
            Connect a wallet to continue
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            The console signs nothing and moves no funds, but sessions and policy are scoped to an
            address, so it needs one. Read-only connection.
          </p>
          <div className="mt-7 flex justify-center">
            <Button variant="accent" onClick={w.connect} disabled={w.busy}>
              <Wallet className="h-4 w-4" />
              {w.busy ? "Waiting for wallet" : "Connect"}
            </Button>
          </div>
          {!w.available && (
            <p className="mt-5 text-xs text-warn">
              No EIP-1193 wallet detected in this browser. Install one, then reload.
            </p>
          )}
        </>
      ) : (
        <>
          <h2 className="mt-6 text-xl font-semibold tracking-tight text-text">Wrong network</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            You are connected, but on chain {w.chainId}. The console targets {chain.name} (
            {chain.id}).
          </p>
          <div className="mt-7 flex justify-center">
            <Button variant="accent" onClick={w.switchChain} disabled={w.busy}>
              <AlertTriangle className="h-4 w-4" />
              Switch to {chain.id}
            </Button>
          </div>
        </>
      )}

      {w.error && (
        <p className="mx-auto mt-5 max-w-md rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
          {w.error}
        </p>
      )}
    </Card>
  );
}
