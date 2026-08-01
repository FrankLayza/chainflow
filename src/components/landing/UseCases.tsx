"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { USE_CASES } from "./use-cases";
import { headingIn, riseIn } from "./motion";

/**
 * The rule text is the headline — no marketing copy per card. Each card
 * deep-links to `/app?rule=…`, which pre-fills the composer rather than
 * auto-submitting: crossing a page boundary straight into an AI parse would
 * spend a request the visitor never asked for.
 */
export function UseCases() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div {...headingIn(reduceMotion)} className="max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Things you can say
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
            Sentences that already work
          </h2>
          <p className="mt-4 text-base text-gray-400 text-pretty">
            Every line below parses as written. Pick one and it lands in the
            composer, ready to review.
          </p>
        </motion.div>

        <ul className="mt-12 space-y-2.5">
          {USE_CASES.map((useCase, i) => (
            <motion.li key={useCase.prompt} {...riseIn(i, reduceMotion)}>
              <Link
                href={`/app?rule=${encodeURIComponent(useCase.prompt)}`}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl bg-gray-900 p-4",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
                  "hover:bg-gray-800 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)]",
                  "transition-[background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                )}
              >
                <span className="font-mono text-[13px] text-white min-w-0 flex-1 text-pretty">
                  {useCase.display}
                </span>

                <span className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-gray-400">
                  {useCase.trigger}
                </span>

                <ArrowRight
                  className="shrink-0 w-4 h-4 text-gray-500 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            </motion.li>
          ))}
        </ul>

        <motion.p
          {...riseIn(USE_CASES.length, reduceMotion)}
          className="mt-6 text-[13px] text-gray-500 text-pretty"
        >
          Balance and schedule triggers are parsed and recorded. Execution runs
          on your confirmation — ChainFlow does not yet poll for triggers on its
          own.
        </motion.p>
      </div>
    </section>
  );
}
