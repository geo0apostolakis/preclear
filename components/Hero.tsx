"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import AnimatedGradient from "./ui/animated-gradient";
import { Button, Pill } from "./ui/primitives";
import Txt from "./Txt";
import { site, chain, prelaunch, fill } from "@/config";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* WebGL gradient. Sits behind everything, decorative only. */}
      <AnimatedGradient
        config={{
          preset: "custom",
          color1: "#05070a",
          color2: "#38bdf8",
          color3: "#0b1220",
          rotation: -42,
          proportion: 22,
          scale: 0.14,
          speed: 14,
          distortion: 2,
          swirl: 62,
          swirlIterations: 12,
          softness: 90,
          offset: -240,
          shape: "Checks",
          shapeSize: 38,
        }}
        noise={{ opacity: 0.35, scale: 1 }}
        style={{ opacity: 0.7 }}
      />

      {/* Scrim keeps the copy readable over any frame of the animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 25%, rgba(5,7,10,0.35) 0%, rgba(5,7,10,0.88) 62%, var(--bg) 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {chain.name} · {chain.id}
            </Pill>
            {prelaunch && <Pill tone="warn">Prototype · contracts not deployed yet</Pill>}
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-text">{site.headlineA}</span>{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(100deg, var(--accent), var(--accent-2))" }}
            >
              {site.headlineB}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-2 sm:text-lg">
            {fill(site.heroSub)}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/dashboard" variant="accent">
              Run the gate
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="#layers" variant="glass">
              See the five checks
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted">
            <Txt value={site.positioning} />
          </p>
        </div>
      </div>

      {/* Ghost wordmark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 right-2 select-none text-7xl font-black tracking-tighter text-white/[0.035] sm:-bottom-14 sm:text-[10rem]"
      >
        {site.name}
      </span>
    </section>
  );
}
