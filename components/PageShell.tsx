import type { ReactNode } from "react";
import { Eyebrow } from "./ui/primitives";
import Reveal from "./Reveal";

/** Shared frame for every app page: eyebrow, title, sub, right slot, body. */
export default function PageShell({
  eyebrow,
  meta,
  title,
  sub,
  right,
  children,
}: {
  eyebrow: string;
  meta?: ReactNode;
  title: string;
  sub: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Reveal>
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{eyebrow}</Eyebrow>
              {meta && <span className="font-mono text-[11px] text-muted">{meta}</span>}
            </div>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted">{sub}</p>
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      </Reveal>

      <div className="pt-8">{children}</div>
    </main>
  );
}
