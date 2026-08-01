"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { TextAnimate } from "@/components/godui/text-animate";
import { ExpandingArrowButton } from "@/components/motion/expanding-arrow-button";
import { scrollToSection } from "@/lib/scroll";

const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      className="min-h-screen w-full overflow-hidden relative scroll-mt-14"
    >
      <div className="absolute inset-0 z-0">
        <AnimatedGradient config={{ preset: "Ghost" }} />
      </div>

      <div className="absolute inset-0 z-1 pointer-events-none hero-vignette" />

      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center px-6 pointer-events-none"
      >
        {/* Category claim, not a brand repeat — the wordmark is already in the
            navbar four rems above this line. */}
        <motion.span
          variants={heroItem}
          className="text-xs font-mono uppercase tracking-widest text-gray-400"
        >
          Natural-language on-chain automation
        </motion.span>

        <motion.div variants={{ hidden: {}, show: {} }}>
          <TextAnimate
            as="h1"
            by="word"
            animation="slideRight"
            delay={0.2}
            className="mt-6 text-6xl md:text-display font-bold tracking-tight leading-none text-white text-balance text-center [&>span:nth-last-child(-n+3)]:text-violet-400 [&>span:nth-last-child(-n+3)]:italic"
          >
            Say it. Simulate it. Send it.
          </TextAnimate>
        </motion.div>

        <motion.p
          variants={heroItem}
          className="mt-5 text-base md:text-lg text-gray-400 max-w-xl mx-auto font-normal text-center text-pretty"
        >
          Describe a transfer in one sentence. It simulates it, shows you
          exactly what will happen, and sends nothing until you say so.
        </motion.p>

        <motion.div
          variants={heroItem}
          className="mt-8 pointer-events-auto justify-center"
        >
          <ExpandingArrowButton
            onClick={() => router.push("/app")}
            accentClassName="bg-violet-400"
            className="focus-visible:ring-violet-400"
          >
            Launch the app
          </ExpandingArrowButton>
        </motion.div>

        {/* Answers the three questions a Web3 visitor has before clicking, in
            the order they think of them: my wallet, my funds, the cost. */}
        <motion.p
          variants={heroItem}
          className="mt-5 text-xs text-gray-400 text-center"
        >
          No wallet to connect · Testnet only · Gas sponsored
        </motion.p>
      </motion.div>

      <motion.button
        onClick={() => scrollToSection("how-it-works")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/30 hover:text-white/60 transition-colors duration-150"
        animate={reduce ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        aria-label="Scroll to How It Works"
      >
        <ChevronDown size={20} strokeWidth={1.5} />
      </motion.button>
    </section>
  );
}
