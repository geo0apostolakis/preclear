import Link from "next/link";
import Address from "./Address";
import Txt from "./Txt";
import { site, chain, socials, contractAddress, explorerAddress, pullQuote, isReal, nav } from "@/config";

const LINKS: [keyof typeof socials, string][] = [
  ["docs", "Docs"],
  ["github", "GitHub"],
];

export default function Footer() {
  const shown = LINKS.filter(([k]) => socials[k] !== "");

  return (
    <footer className="mt-20 border-t border-line bg-bg-2/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <span className="text-lg font-bold tracking-tight text-text">{site.name}</span>
            <p className="max-w-md text-sm italic leading-relaxed text-muted">
              &ldquo;<Txt value={pullQuote} />&rdquo;
            </p>
            <p className="text-xs text-muted">
              <Txt value={site.positioning} />
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              App
            </p>
            <ul className="space-y-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-text-2 transition hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Links
            </p>
            <ul className="space-y-2">
              {shown.map(([key, label]) => (
                <li key={key} className="flex items-center gap-2">
                  {isReal(socials[key]) ? (
                    <a
                      href={socials[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text-2 transition hover:text-accent"
                    >
                      {label}
                    </a>
                  ) : (
                    <>
                      <span className="text-sm text-muted">{label}</span>
                      <Txt value={socials[key]} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 space-y-3 border-t border-line pt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Contract
            </span>
            {isReal(contractAddress) ? (
              <>
                <Address address={contractAddress} full />
                <a
                  href={explorerAddress(contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
                >
                  Explorer
                </a>
              </>
            ) : (
              <Txt value={contractAddress} />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-muted">
            <a
              href={chain.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-accent hover:underline"
            >
              {chain.name} explorer · chain id {chain.id}
            </a>
            <p>© {new Date().getFullYear()} {site.name}</p>
          </div>

          <p className="pt-2 text-[11px] leading-relaxed text-muted">
            No contracts are deployed. Every check on this site runs locally in your browser as a
            reference implementation of the rules. Prices are simulated. Nothing here is financial
            advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
