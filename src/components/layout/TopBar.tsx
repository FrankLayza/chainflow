"use client";

import React from "react";
import { Activity } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Async } from "@/types/async";
import type { WalletInfo } from "@/types/rule";
import Link from "next/link";
import Image from "next/image";

interface TopBarProps {
  wallet: Async<WalletInfo>;
  /** Whether the Activity drawer is open, so the toggle can show its active state. */
  activityOpen?: boolean;
  onToggleActivity?: () => void;
  /** Unseen executions since the drawer was last opened. */
  unseenActivity?: boolean;
}

/**
 * The wallet is KeeperHub-managed and server-side — there is nothing for the
 * user to connect. This previously rendered a "Connect Wallet" button that
 * toggled in a hardcoded fake address while the real fetched address went
 * unused.
 */
export const TopBar: React.FC<TopBarProps> = ({
  wallet,
  activityOpen,
  onToggleActivity,
  unseenActivity,
}) => {
  return (
    <header className="w-full shrink-0 bg-gray-950/80 backdrop-blur-md border-b border-white/6 px-6 h-14 flex items-center select-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-base tracking-wide lowercase text-white flex items-center gap-2">
          <Image src="/logo.png" alt="logo" width={24} height={24} className="shrink-0" />
          chainflow
        </Link>

        <div className="flex items-center gap-3 min-w-0">
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

          {onToggleActivity && (
            <button
              type="button"
              onClick={onToggleActivity}
              aria-expanded={activityOpen}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] cursor-pointer",
                "text-xs font-medium border",
                "transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                activityOpen
                  ? "bg-gray-800 border-white/[0.15] text-white"
                  : "border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.15]",
              )}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
              Activity
              {unseenActivity && !activityOpen && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500"
                  aria-label="New activity"
                />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
