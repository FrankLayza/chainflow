"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SAFETY_FACTS } from "./safety-facts";
import { headingIn, riseIn } from "./motion";

/**
 * Framed as an explicit contract rather than reassurance. The heading leads with
 * what ChainFlow will not do, because a negative is checkable and a positive
 * ("your funds are safe") is not.
 */
export function Safety() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="safety"
      className="min-h-screen py-24 md:py-32 px-6 bg-gray-900 border-y border-white/[0.06] scroll-mt-14"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div {...headingIn(reduceMotion)} className="max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Safety
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
            What ChainFlow will never do
          </h2>
          <p className="mt-4 text-base text-gray-400 text-pretty">
            This is a testnet tool with a KeeperHub-managed account behind it.
            Here is exactly where the boundaries sit, and what enforces each one.
          </p>
        </motion.div>

        <ul className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {SAFETY_FACTS.map(({ Icon, label, detail, evidence }, i) => (
            <motion.li key={label} {...riseIn(i, reduceMotion)} className="flex gap-4">
              <span className="shrink-0 mt-0.5 w-9 h-9 rounded-[10px] bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-400">
                <Icon className="w-4 h-4" strokeWidth={2} aria-hidden />
              </span>

              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-white">{label}</h3>
                <p className="mt-1.5 text-sm text-gray-400 text-pretty">{detail}</p>
                <span className="mt-2 inline-block font-mono text-[11px] uppercase tracking-[0.04em] text-gray-500">
                  {evidence}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
