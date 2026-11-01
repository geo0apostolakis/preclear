import type { ReactNode } from "react";
import { Card, Pill } from "@/components/ui/primitives";

export default function Panel({
  icon,
  title,
  sub,
  badge,
  right,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  badge?: { label: string; tone?: "ok" | "muted" | "accent" | "warn" };
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line-2 bg-white/5 text-accent">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-text">{title}</h2>
              {badge && <Pill tone={badge.tone ?? "muted"}>{badge.label}</Pill>}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{sub}</p>
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
