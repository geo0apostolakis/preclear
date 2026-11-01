"use client";

import { Wallet, AlertTriangle } from "lucide-react";
import { useWallet, shortAddress } from "@/lib/wallet";
import { Button } from "./ui/primitives";
import { chain } from "@/config";

export default function WalletButton({ size = "sm" }: { size?: "sm" | "md" }) {
  const w = useWallet();

  if (!w.connected) {
    return (
      <Button variant="accent" size={size} onClick={w.connect} disabled={w.busy}>
        <Wallet className="h-3.5 w-3.5" />
        {w.busy ? "Connecting" : "Connect"}
      </Button>
    );
  }

  if (!w.onRightChain) {
    return (
      <Button variant="glass" size={size} onClick={w.switchChain} disabled={w.busy}>
        <AlertTriangle className="h-3.5 w-3.5 text-warn" />
        Switch to {chain.id}
      </Button>
    );
  }

  return (
    <Button variant="glass" size={size} onClick={w.disconnect}>
      <span className="h-1.5 w-1.5 rounded-full bg-ok" />
      <span className="font-mono text-xs">{shortAddress(w.address!)}</span>
    </Button>
  );
}
