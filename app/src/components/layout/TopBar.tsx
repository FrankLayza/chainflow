'use client';

import React from 'react';
import { ShieldCheck, Cpu, Zap } from 'lucide-react';

interface TopBarProps {
  walletAddress?: string;
  networkName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  walletAddress = '0xcafa...d221',
  networkName = 'Ethereum Sepolia',
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-[#06060a]/80 backdrop-blur-md px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
            <div className="w-full h-full bg-[#0a0c14] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">ChainFlow</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                IFTTT for Web3
              </span>
            </div>
            <p className="text-xs text-gray-400">Natural Language On-Chain Automation Engine</p>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-3">
          {/* Network Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised/60 border border-white/5 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{networkName}</span>
          </div>

          {/* KeeperHub Managed Wallet Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-purple-200">{walletAddress}</span>
            <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">Demo EOA</span>
          </div>

          {/* KeeperHub Execution Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>KeeperHub API</span>
          </div>
        </div>
      </div>
    </header>
  );
};
