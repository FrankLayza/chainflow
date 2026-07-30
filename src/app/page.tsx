'use client';

import React from 'react';
import { TopBar } from '@/components/layout/TopBar';

export default function Home() {
  return (
    <main className="min-h-screen w-screen bg-absolute text-warm-off-white font-sora overflow-hidden flex flex-col">
      {/* Navbar Header */}
      <TopBar />

      {/* Blank Black Canvas */}
      <div className="flex-1 w-full bg-absolute">
      </div>
    </main>
  );
}
