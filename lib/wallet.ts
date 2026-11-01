"use client";

import { useCallback, useEffect, useState } from "react";
import { chain, isReal } from "@/config";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

const HEX_CHAIN = `0x${chain.id.toString(16)}`;

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eth = window.ethereum;
    setAvailable(Boolean(eth));
    if (!eth) return;

    // Restore an already-authorised account without prompting.
    eth
      .request({ method: "eth_accounts" })
      .then((a) => {
        const list = a as string[];
        if (list?.length) setAddress(list[0]);
      })
      .catch(() => {});

    eth
      .request({ method: "eth_chainId" })
      .then((c) => setChainId(Number(c as string)))
      .catch(() => {});

    const onAccounts = (...args: never[]) => {
      const list = args[0] as unknown as string[];
      setAddress(list?.length ? list[0] : null);
    };
    const onChain = (...args: never[]) => setChainId(Number(args[0] as unknown as string));

    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setError("No EIP-1193 wallet found in this browser.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAddress(accounts?.[0] ?? null);
      const c = (await eth.request({ method: "eth_chainId" })) as string;
      setChainId(Number(c));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection was rejected.");
    } finally {
      setBusy(false);
    }
  }, []);

  const switchChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    setBusy(true);
    setError(null);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEX_CHAIN }] });
    } catch (e) {
      // 4902 = chain unknown to the wallet. Offer to add it, but only if we
      // actually have an RPC URL. We do not, so say so instead of guessing one.
      const code = (e as { code?: number })?.code;
      if (code === 4902 && !isReal(chain.rpc)) {
        setError(`${chain.name} is not in your wallet, and no RPC URL is configured here yet.`);
      } else {
        setError(e instanceof Error ? e.message : "Could not switch network.");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // EIP-1193 has no disconnect. This clears the app's view of the session.
    setAddress(null);
  }, []);

  return {
    address,
    chainId,
    available,
    busy,
    error,
    connected: Boolean(address),
    onRightChain: chainId === chain.id,
    connect,
    switchChain,
    disconnect,
  };
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
