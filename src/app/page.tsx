'use client';

import React from 'react';
import Link from 'next/link';
import { PixelCanvas } from '@/components/ui/pixel-canvas';
import { WalletIcon } from '@/components/ui/AnimatedWalletIcon';

export default function LandingPage() {
  return (
    <main className="min-h-screen w-screen bg-absolute text-warm-off-white font-sora overflow-hidden flex flex-col relative">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <PixelCanvas 
          gap={8} 
          speed={0.03} 
          variant="glow"
          colors={['#8a7f7f', '#a9a0a0', '#e3e3e3']}
        />
      </div>

      {/* Simplified Navbar for Landing */}
      <header className="w-full px-6 py-4 z-10 flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-outfit font-bold text-xl tracking-wider lowercase text-warm-off-white">
            chainflow
          </span>
        </div>
        <div>
          <Link href="/app">
            <button className="px-5 py-2 rounded-2xl bg-smoke-charcoal border border-iron-veil hover:border-pale-stone text-sm font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer">
              Launch App
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-6 mt-[-8vh]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iron-veil bg-smoke-charcoal/50 backdrop-blur-sm text-xs font-mono text-bone-gray mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            KeeperHub integration live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-tight">
            Automate the blockchain in <span className="text-muted-cobalt italic">plain English.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-bone-gray max-w-2xl mx-auto font-light leading-relaxed">
            Turn human intent into structured on-chain execution. Swap, bridge, or stake without writing a single line of code.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app">
              <button className="px-8 py-4 rounded-2xl bg-warm-off-white text-deep-ember text-base font-semibold transition-all hover:bg-pale-stone shadow-xl active:scale-[0.98]">
                Get Started
              </button>
            </Link>
            
            <a href="https://github.com" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-2xl bg-smoke-charcoal border border-iron-veil text-warm-off-white text-base font-medium transition-all hover:border-pale-stone active:scale-[0.98]">
              View Documentation
            </a>
          </div>

        </div>
      </div>

    </main>
  );
}
