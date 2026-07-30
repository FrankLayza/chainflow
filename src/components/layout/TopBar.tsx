"use client";

import React, { useState } from "react";
// import { AnimatedWallet } from '@/components/icons/AnimatedWallet';
import { WalletIcon } from "../ui/AnimatedWalletIcon";

interface TopBarProps {
  walletAddress?: string;
  onConnectWallet?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  walletAddress,
  onConnectWallet,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  const handleWalletClick = () => {
    setIsConnected(!isConnected);
    if (onConnectWallet) onConnectWallet();
  };

  return (
    <header className="w-full bg-absolute border-iron-veil/60 px-6 py-3 sticky top-0 z-50 select-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
   
        <div className="flex items-center">
          <span className="font-outfit font-bold text-xl text-warm-off-white tracking-wider lowercase">
            chainflow
          </span>
        </div>

     
        <div>
          <button
            onClick={handleWalletClick}
            className="group px-4 py-2 rounded-2xl bg-smoke-charcoal border border-iron-veil hover:border-pale-stone text-warm-off-white text-sm font-medium flex items-center gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <WalletIcon />
            <span className="text-xs">
              {isConnected
                ? walletAddress || "0x8a7F...3cDe"
                : "Connect Wallet"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
