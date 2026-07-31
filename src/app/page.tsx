'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedGradient } from '@/components/ui/animated-gradient';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MagneticButton } from '@/components/godui/magnetic-button';

const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="h-dvh w-screen bg-absolute text-warm-off-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <AnimatedGradient
          config={{
            preset: "Ghost",
          }}
        />
      </div>

      <div className="absolute inset-0 z-1 pointer-events-none hero-vignette" />

      <header className="relative z-10 w-full px-5 flex items-center justify-between">
        <span className="font-bold text-base tracking-wide lowercase text-warm-off-white">
          chainflow
        </span>
        <MagneticButton
          onClick={() => router.push('/app')}
          strength={0.4}
          range={24}
          className="px-4! py-2! rounded-2xl! bg-white border border-iron-veil hover:border-pale-stone text-xs font-medium transition duration-150 active:scale-[0.96] cursor-pointer"
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
        <motion.div variants={heroItem} className="flex flex-col items-center space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iron-veil bg-smoke-charcoal/50 backdrop-blur-sm text-caption-tracked font-mono text-bone-gray">
            <span className="w-2 h-2 rounded-full bg-gold-leaf animate-pulse" />
            KeeperHub integration live
          </div>

          <h1 className="text-heading-lg md:text-display font-bold tracking-display text-balance leading-display">
            Say it. Simulate it. <span className="text-gold-leaf italic">Send it.</span>
          </h1>

          <p className="text-lg md:text-xl text-bone-gray max-w-2xl mx-auto font-normal leading-body text-pretty">
            ChainFlow turns plain English into a simulated, user-confirmed on-chain transfer — executed
            through KeeperHub with gas sponsored.
          </p>

          <div className="pt-4 pointer-events-auto">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-warm-off-white text-deep-ember text-base font-semibold transition duration-150 hover:bg-pale-stone active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-leaf cursor-pointer"
            >
              Launch the app
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
