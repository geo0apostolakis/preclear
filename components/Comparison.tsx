import Reveal from "./Reveal";
import { Card, SectionTitle } from "./ui/primitives";
import { comparison, comparisonHeading, site } from "@/config";

export default function Comparison() {
  return (
    <section id="comparison" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <SectionTitle
          eyebrow="Gap analysis"
          title={comparisonHeading.title}
          sub={comparisonHeading.sub}
        />
      </Reveal>

      {/* Mobile */}
      <div className="mt-10 space-y-3 md:hidden">
        {comparison.map((row, i) => (
          <Reveal key={i} delay={i * 60}>
            <Card className="space-y-3 p-4">
              <p className="text-sm font-semibold text-text">{row.layer}</p>
              <div className="text-xs leading-relaxed text-muted">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-2">Exists </span>
                {row.today}
              </div>
              <div className="rounded-lg border border-bad/25 bg-bad/8 p-3 text-xs leading-relaxed text-bad">
                <span className="font-mono text-[10px] uppercase tracking-wider">Missing </span>
                {row.missing}
              </div>
              <div className="rounded-lg border border-accent/25 bg-accent/8 p-3 text-xs leading-relaxed text-accent">
                <span className="font-mono text-[10px] uppercase tracking-wider">{site.name} </span>
                {row.solution}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Desktop */}
      <Reveal className="mt-10 hidden md:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.03]">
                  <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Check
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    What exists today
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-bad">
                    What is missing
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                    How {site.name} solves it
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className="border-b border-line/60 transition last:border-0 hover:bg-white/[0.025]">
                    <td className="px-5 py-4 font-semibold text-text">{row.layer}</td>
                    <td className="px-5 py-4 text-muted">{row.today}</td>
                    <td className="px-5 py-4 text-bad/90">{row.missing}</td>
                    <td className="px-5 py-4 font-medium text-accent/90">{row.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
