"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { site, chain, nav } from "@/config";
import MarketBadge from "./MarketBadge";
import WalletButton from "./WalletButton";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg border border-accent/40 bg-accent/15 font-mono text-sm font-bold text-accent"
            >
              {site.name.charAt(0)}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-text sm:text-base">
                {site.name}
              </span>
              <span className="hidden rounded border border-line-2 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted sm:inline-flex">
                {chain.id}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active(item.href)
                    ? "bg-white/8 text-text"
                    : "text-muted hover:bg-white/5 hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden sm:block">
              <MarketBadge />
            </span>
            <WalletButton />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="btn-glass cursor-pointer rounded-xl p-2 text-text lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-line py-3 lg:hidden" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active(item.href) ? "bg-white/8 text-text" : "text-muted hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-3 pt-2 sm:hidden">
              <MarketBadge full />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
