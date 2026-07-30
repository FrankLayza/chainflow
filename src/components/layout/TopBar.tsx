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
    <header className="w-full bg-absolute border-b border-iron-veil px-6 py-4 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-nav bg-smoke-charcoal border border-iron-veil flex items-center justify-center">
            <Zap className="w-4 h-4 text-warm-off-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[16px] text-warm-off-white tracking-tight">ChainFlow</span>
              <span className="text-caption-tracked uppercase font-medium text-bone-gray">
                IFTTT for Web3
              </span>
            </div>
            <p className="text-body-sm text-pale-stone mt-0.5">Natural Language On-Chain Automation Engine</p>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-4">
          {/* Network Badge */}
          <div className="flex items-center gap-2 text-body-sm text-bone-gray">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" /> {/* macOS green */}
            <span>{networkName}</span>
          </div>

          {/* KeeperHub Managed Wallet Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-nav bg-smoke-charcoal border border-iron-veil text-body-sm text-pale-stone">
            <ShieldCheck className="w-4 h-4 text-bone-gray" />
            <span className="font-mono text-warm-off-white">{walletAddress}</span>
            <span className="text-caption-tracked uppercase text-bone-gray ml-1">Demo EOA</span>
          </div>

          {/* KeeperHub Execution Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-nav bg-smoke-charcoal border border-iron-veil text-body-sm text-pale-stone">
            <Cpu className="w-4 h-4 text-bone-gray" />
            <span>KeeperHub API</span>
          </div>
        </div>
      </div>
    </header>
  );
};
