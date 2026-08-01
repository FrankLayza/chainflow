"use client";

import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { truncateAddress } from "@/lib/format";
import type { Async } from "@/types/async";
import type { WalletInfo } from "@/types/rule";
import Link from "next/link";
import Image from "next/image";

interface TopBarProps {
  wallet: Async<WalletInfo>;
}

/**
 * The wallet is KeeperHub-managed and server-side — there is nothing for the
 * user to connect. This previously rendered a "Connect Wallet" button that
 * toggled in a hardcoded fake address while the real fetched address went
 * unused.
 */
export const TopBar: React.FC<TopBarProps> = ({ wallet }) => {
  return (
    <header className="w-full shrink-0 bg-gray-950/80 backdrop-blur-md border-b border-white/6 px-6 h-14 flex items-center select-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-base tracking-wide lowercase text-white flex items-center gap-2">
          <Image src="/logo.png" alt="logo" width={24} height={24} className="shrink-0" />
          chainflow
        </Link>

        {wallet.kind === "loading" && (
          <div
            className="w-36 h-7 rounded-xl bg-gray-800 motion-safe:animate-pulse"
            aria-label="Loading wallet"
          />
        )}

        {wallet.kind === "error" && (
          <span title={wallet.message}>
            <StatusBadge tone="pending" label="Wallet unavailable" />
          </span>
        )}

        {wallet.kind === "ready" && (
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-mono text-xs text-gray-400 truncate"
              title={wallet.data.address ?? undefined}
            >
              {truncateAddress(wallet.data.address)}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs text-gray-400">Sepolia</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
