"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { ExpandingArrowButton } from "@/components/motion/expanding-arrow-button";
import { riseIn } from "./motion";

/**
 * Bookends the hero by returning to the Ghost gradient, so the page closes where
 * it opened. Same button component and props as the hero — a different CTA
 * treatment here would read as a different action.
 */
export function FinalCta() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06]">
      <div className="absolute inset-0 z-0 opacity-60">
        <AnimatedGradient config={{ preset: "Ghost" }} />
      </div>
      <div className="absolute inset-0 z-1 pointer-events-none hero-vignette" />

      <div className="relative z-10 px-6 py-28 md:py-36">
        <motion.div
          {...riseIn(0, reduceMotion)}
          className="max-w-2xl mx-auto flex flex-col items-center text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
            One sentence. One confirmation. One hash.
          </h2>

          <p className="mt-4 text-base text-gray-400 max-w-lg text-pretty">
            You have seen what it does and where the edges are. The rest takes
            about a minute.
          </p>

          <div className="mt-9">
            <ExpandingArrowButton
              onClick={() => router.push("/app")}
              accentClassName="bg-violet-400"
              className="focus-visible:ring-violet-400"
            >
              Launch the app
            </ExpandingArrowButton>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            No wallet to connect · Testnet only · Gas sponsored
          </p>
        </motion.div>
      </div>
    </section>
  );
}
