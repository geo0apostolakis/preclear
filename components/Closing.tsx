import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { Button, Card } from "./ui/primitives";
import { closing } from "@/config";

export default function Closing() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal>
        <Card strong className="relative overflow-hidden p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 60% 120% at 85% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl space-y-3">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {closing.heading}
              </h2>
              <p className="text-pretty text-sm leading-relaxed text-muted">{closing.body}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button href="/dashboard" variant="accent">
                Run the gate
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/policy" variant="glass">
                Set a policy
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
