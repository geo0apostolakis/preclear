import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import Address from "./Address";
import { ICONS } from "./icons";
import { Card, Pill, SectionTitle } from "./ui/primitives";
import { layers, layersHeading, resolveStatus, isReal } from "@/config";

export default function Layers() {
  return (
    <section id="layers" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <SectionTitle eyebrow="Architecture" title={layersHeading.title} sub={layersHeading.sub} />
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {layers.map((layer, i) => {
          const live = resolveStatus(layer) === "live";
          const Icon = ICONS[layer.icon];
          return (
            <Reveal key={layer.key} delay={i * 70}>
              <Card className="group flex h-full flex-col p-5 transition hover:border-accent/35">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-line-2 bg-white/5 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                      Layer {layer.n}
                    </span>
                  </span>
                  <Pill tone={live ? "ok" : "muted"}>{live ? "Live" : "Roadmap"}</Pill>
                </div>

                <h3 className="mt-4 text-lg font-semibold tracking-tight text-text">{layer.name}</h3>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-accent/70">
                  {layer.short}
                </p>
                <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted">
                  {layer.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
                  {isReal(layer.address) ? (
                    <Address address={layer.address} />
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      No contract yet
                    </span>
                  )}
                  {layer.href && (
                    <Link
                      href={layer.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition group-hover:gap-1.5"
                    >
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
