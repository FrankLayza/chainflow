'use client';

import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

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
    <header className="w-full bg-absolute border-b border-iron-veil/60 px-10 py-4 sticky top-0 z-50 select-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Product Brand Name */}
        <div className="flex items-center">
          <span className="font-outfit font-bold text-2xl text-warm-off-white tracking-tight lowercase">
            chainflow
          </span>
        </div>

        {/* Right Side: Connect Wallet Button */}
        <div>
          <button
            onClick={handleWalletClick}
            className="px-5 py-2.5 rounded-lg bg-smoke-charcoal border border-iron-veil hover:border-pale-stone text-warm-off-white text-sm font-medium flex items-center gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-bone-gray" />
            <span>
              {isConnected ? (walletAddress || '0x8a7F...3cDe') : 'Connect Wallet'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
