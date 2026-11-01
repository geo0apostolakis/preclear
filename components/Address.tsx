import CopyButton, { truncate } from "./CopyButton";
import { explorerAddress, isReal } from "@/config";
import Txt from "./Txt";

/** Every address on the page goes through this: mono, explorer link, copy. */
export default function Address({
  address,
  full = false,
  className = "",
}: {
  address?: string;
  full?: boolean;
  className?: string;
}) {
  if (!isReal(address)) return <Txt value={address ?? ""} />;
  const a = address as string;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`}>
      <a
        href={explorerAddress(a)}
        target="_blank"
        rel="noopener noreferrer"
        title={a}
        className="truncate font-mono text-[11px] text-muted underline-offset-4 transition hover:text-accent hover:underline"
      >
        {full ? a : truncate(a)}
      </a>
      <CopyButton value={a} />
    </span>
  );
}
