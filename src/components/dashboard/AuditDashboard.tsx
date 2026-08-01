"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MonoValue } from "@/components/ui/MonoValue";
import {
  deriveReceiptStatus,
  formatGas,
  formatTimestamp,
  truncateAddress,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Async } from "@/types/async";
import type { AuditData, ExecutionRecord, ParsedRule } from "@/types/rule";

interface AuditDashboardProps {
  audit: Async<AuditData>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ghostButton = cn(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] cursor-pointer",
  "border border-white/[0.08] text-gray-400 text-xs",
  "hover:text-white hover:border-white/[0.15]",
  "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
  "disabled:opacity-40 disabled:cursor-not-allowed",
);

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("h-3 rounded bg-gray-700 motion-safe:animate-pulse", className)} />
  );
}

function SkeletonRow() {
  return (
    <div className="bg-gray-800 border border-white/[0.06] rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <SkeletonLine className="w-24" />
        <SkeletonLine className="w-20" />
      </div>
      <SkeletonLine className="w-40" />
      <SkeletonLine className="w-full" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono mb-3">
      {children}
    </h3>
  );
}

function ExecutionRow({ record }: { record: ExecutionRecord }) {
  const { tone, label } = deriveReceiptStatus(record.status, record.txHash);
  const gas = formatGas(record.gasUsed, record.sponsored ?? true);

  return (
    <li className="bg-gray-800 border border-white/[0.06] rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone={tone} label={label} />
        <span className="font-mono text-xs text-gray-500 shrink-0">
          {formatTimestamp(record.timestamp)}
        </span>
      </div>

      <div className="flex items-center gap-2 font-mono text-sm min-w-0">
        <span className="text-violet-400 shrink-0">{record.amount} ETH</span>
        <span className="text-gray-500 shrink-0" aria-hidden>
          →
        </span>
        <span
          className="text-violet-400 truncate"
          title={record.recipientAddress || undefined}
        >
          {truncateAddress(record.recipientAddress)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 min-w-0">
        {record.txHash ? (
          <MonoValue
            value={record.txHash}
            truncate
            copyable
            explorerUrl={record.explorerUrl}
            label="transaction hash"
            className="text-gray-400 min-w-0"
          />
        ) : (
          <span className="text-xs text-gray-500">No hash yet</span>
        )}
        <span
          className={cn(
            "shrink-0 text-[11px]",
            gas.isRealNumber ? "font-mono text-gray-400" : "text-gray-500",
          )}
        >
          {gas.value}
        </span>
      </div>
    </li>
  );
}

function RuleRow({ rule }: { rule: ParsedRule }) {
  return (
    <li className="bg-gray-800 border border-white/[0.06] rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-violet-400">{rule.ruleType}</span>
        <span className="font-mono text-[11px] text-gray-500 shrink-0">
          {rule.network}
        </span>
      </div>
      <p className="text-[13px] text-gray-400 line-clamp-2 text-pretty">
        {rule.explanation}
      </p>
    </li>
  );
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  audit,
  onRefresh,
  isRefreshing,
}) => {
  const isLoading = audit.kind === "loading";

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-y-auto">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.06]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Executions recorded on Sepolia
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className={ghostButton}
          >
            <RefreshCw
              className={cn("w-3 h-3", (isLoading || isRefreshing) && "motion-safe:animate-spin")}
              strokeWidth={1.5}
              aria-hidden
            />
            Refresh
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 px-6 py-5 space-y-8">
        {audit.kind === "error" ? (
          <div className="rounded-xl bg-danger/10 border border-danger/30 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-danger shrink-0 mt-0.5"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-danger">
                  Couldn&apos;t load execution history
                </p>
                <p className="text-xs text-gray-400 text-pretty">{audit.message}</p>
              </div>
            </div>
            {onRefresh && (
              <button type="button" onClick={onRefresh} className={cn(ghostButton, "mt-3")}>
                Retry
              </button>
            )}
          </div>
        ) : (
          <>
            <section>
              <SectionLabel>
                Parsed rules{audit.kind === "ready" ? ` (${audit.data.rules.length})` : ""}
              </SectionLabel>

              {isLoading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : audit.data.rules.length === 0 ? (
                <p className="text-[13px] text-gray-400">
                  Nothing parsed yet. Describe a transfer in chat.
                </p>
              ) : (
                <ul className="space-y-2">
                  {audit.data.rules.map((rule, i) => (
                    <RuleRow key={rule.id || i} rule={rule} />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionLabel>
                Executions
                {audit.kind === "ready" ? ` (${audit.data.executions.length})` : ""}
              </SectionLabel>

              {isLoading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : audit.data.executions.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-pretty">
                  No executions yet. Confirm a rule in chat and the receipt lands
                  here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {audit.data.executions.map((record) => (
                    <ExecutionRow key={record.id} record={record} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
