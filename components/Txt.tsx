import { fill, isReal, MISSING } from "@/config";

/** Renders a config string, or a dashed chip if the value is still MISSING. */
export default function Txt({ value, className = "" }: { value: string; className?: string }) {
  if (isReal(value)) return <span className={className}>{fill(value)}</span>;
  return (
    <span className="inline-block rounded border border-dashed border-bad/50 bg-bad/10 px-1.5 py-px align-middle font-mono text-[10px] font-bold uppercase tracking-wider text-bad">
      {MISSING}
    </span>
  );
}
