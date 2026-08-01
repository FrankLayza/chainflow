"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { MagneticButton } from "@/components/godui/magnetic-button";
import { TextAnimate } from "@/components/godui/text-animate";
import { ExpandingArrowButton } from "@/components/motion/expanding-arrow-button";
import Image from "next/image";
import Link from "next/link"

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

  return (
    <section className="h-dvh w-full overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <AnimatedGradient config={{ preset: "Ghost" }} />
      </div>

      <div className="absolute inset-0 z-1 pointer-events-none hero-vignette" />

      <header className="relative z-10 w-full px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image src="/logo.png" alt="logo" width={24} height={20} />
          <Link href="/" className="font-semibold text-base tracking-wide lowercase text-white">
            chainflow
          </Link>
        </div>
        <MagneticButton
          onClick={() => router.push("/app")}
          strength={0.4}
          range={24}
          className="px-4! py-2! rounded-xl bg-white text-gray-950 text-xs! font-medium transition-colors duration-150 hover:bg-gray-200 active:scale-[0.97] cursor-pointer! focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 "
        >
          Launch App
        </MagneticButton>
      </header>

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
          Describe a transfer in one sentence. ChainFlow simulates it, shows you
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
    </section>
  );
}
