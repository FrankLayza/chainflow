"use client";

import React from "react";
import { AlertTriangle, Ban, Play, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MonoValue } from "@/components/ui/MonoValue";
import { PullToRefresh } from "@/components/motion/pull-to-refresh";
import {
  deriveReceiptStatus,
  formatGas,
  formatTimestamp,
  truncateAddress,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Async } from "@/types/async";
import type { ActiveRuleView, AuditData, ExecutionRecord } from "@/types/rule";

interface AuditDashboardProps {
  audit: Async<AuditData>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Disables an armed rule; the caller refreshes the list after. */
  onDisableRule?: (ruleId: string) => Promise<void>;
  /** Re-enables a paused rule; the caller refreshes the list after. */
  onEnableRule?: (ruleId: string) => Promise<void>;
  /** Renders a close affordance in the header when shown inside the drawer. */
  onClose?: () => void;
}

type Category = "rules" | "executions";

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

function RuleRow({
  rule,
  onDisable,
  onEnable,
  disabling,
  enabling,
}: {
  rule: ActiveRuleView;
  onDisable?: (id: string) => void;
  onEnable?: (id: string) => void;
  disabling?: boolean;
  enabling?: boolean;
}) {
  const isActive = rule.status === "ACTIVE";
  const ruleId = rule.id;

  return (
    <li className="bg-gray-800 border border-white/[0.06] rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-violet-400">{rule.ruleType}</span>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && <StatusBadge tone="live" label="Active" />}
          <span className="font-mono text-[11px] text-gray-500">{rule.network}</span>
        </div>
      </div>
      <p className="text-[13px] text-gray-400 line-clamp-2 text-pretty">
        {rule.explanation}
      </p>
      {isActive && onDisable && ruleId && (
        <button
          type="button"
          onClick={() => onDisable(ruleId)}
          disabled={disabling}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] cursor-pointer",
            "border border-white/[0.08] text-gray-400 text-xs",
            "hover:text-danger hover:border-danger/40",
            "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <Ban className="w-3 h-3" strokeWidth={1.5} aria-hidden />
          Disable rule
        </button>
      )}
      {!isActive && onEnable && ruleId && (
        <button
          type="button"
          onClick={() => onEnable(ruleId)}
          disabled={enabling}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] cursor-pointer",
            "border border-white/[0.08] text-gray-400 text-xs",
            "hover:text-emerald-400 hover:border-emerald-400/40",
            "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <Play className="w-3 h-3" strokeWidth={1.5} aria-hidden />
          Enable rule
        </button>
      )}
    </li>
  );
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  audit,
  onRefresh,
  isRefreshing,
  onDisableRule,
  onEnableRule,
  onClose,
}) => {
  const isLoading = audit.kind === "loading";
  const [disablingId, setDisablingId] = React.useState<string | null>(null);
  const [enablingId, setEnablingId] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<Category>("rules");

  const rulesCount = audit.kind === "ready" ? audit.data.rules.length : 0;
  const executionsCount =
    audit.kind === "ready" ? audit.data.executions.length : 0;
  const categories: { id: Category; label: string; count: number }[] = [
    { id: "rules", label: "Parsed rules", count: rulesCount },
    { id: "executions", label: "Executions", count: executionsCount },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.06]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Executions recorded on Sepolia&ensp;·&ensp;pull to refresh
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close activity"
            className={cn(
              "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[10px] cursor-pointer",
              "border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.15]",
              "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
            )}
          >
            <X className="w-4 h-4" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>

      {audit.kind !== "error" && (
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div
            className="flex gap-1 p-1 bg-gray-950 rounded-xl border border-white/[0.06]"
            aria-label="Activity categories"
          >
            {categories.map((cat) => {
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium cursor-pointer",
                    "transition-[background-color,color] duration-150 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white",
                  )}
                >
                  {cat.label}
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isActive ? "text-gray-300" : "text-gray-500",
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PullToRefresh
        onRefresh={onRefresh ?? (() => {})}
        refreshing={isRefreshing}
        disabled={!onRefresh}
        className="flex-1 min-h-0 bg-gray-900"
        contentClassName="px-6 py-5 space-y-8"
      >
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
        ) : category === "rules" ? (
          <section>
            <SectionLabel>
              Parsed rules
              {audit.kind === "ready" ? ` (${audit.data.rules.length})` : ""}
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
                  <RuleRow
                    key={rule.id || i}
                    rule={rule}
                    onDisable={
                      onDisableRule
                        ? (id) => {
                            setDisablingId(id);
                            void onDisableRule(id).finally(() => setDisablingId(null));
                          }
                        : undefined
                    }
                    onEnable={
                      onEnableRule
                        ? (id) => {
                            setEnablingId(id);
                            void onEnableRule(id).finally(() => setEnablingId(null));
                          }
                        : undefined
                    }
                    disabling={disablingId === (rule.id || String(i))}
                    enabling={enablingId === (rule.id || String(i))}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : (
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
        )}
      </PullToRefresh>
    </div>
  );
};
