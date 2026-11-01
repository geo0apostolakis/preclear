import Reveal from "./Reveal";
import { Card, SectionTitle } from "./ui/primitives";
import { problem } from "@/config";

export default function Problem() {
  return (
    <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <SectionTitle eyebrow={problem.eyebrow} title={problem.heading} />
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {problem.paragraphs.map((p, i) => (
          <Reveal key={i} delay={i * 90}>
            <Card className="h-full p-6">
              <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-text-2">{p}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
