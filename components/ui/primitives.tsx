import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  strong = false,
}: {
  children?: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`${strong ? "glass-2" : "glass"} rounded-2xl ${className}`}>{children}</div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
      {children}
    </span>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "ok" | "bad" | "warn" | "accent";
}) {
  const tones = {
    muted: "border-line-2 bg-white/5 text-muted",
    ok: "border-ok/35 bg-ok/10 text-ok",
    bad: "border-bad/35 bg-bad/10 text-bad",
    warn: "border-warn/35 bg-warn/10 text-warn",
    accent: "border-accent/35 bg-accent/10 text-accent",
  } as const;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "glass" | "accent" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  external?: boolean;
};

export function Button({
  children,
  href,
  onClick,
  variant = "glass",
  size = "md",
  disabled,
  type = "button",
  className = "",
  external,
}: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold tracking-tight disabled:pointer-events-none disabled:opacity-45";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" } as const;
  const variants = {
    glass: "btn-glass text-text",
    accent: "btn-accent",
    ghost: "border border-transparent text-muted hover:text-text",
  } as const;
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href && !disabled) {
    if (external || href.startsWith("http")) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "ok" | "bad";
}) {
  const colour = tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : "text-text";
  return (
    <div className="glass rounded-xl px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${colour}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>
        {sub && <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}
