"use client";

import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MonoValue } from "@/components/ui/MonoValue";
import { FieldGrid, type Field } from "@/components/ui/FieldGrid";
import { deriveReceiptStatus, formatGas } from "@/lib/format";
import type { ExecutionReceipt } from "@/types/rule";

/**
 * The proof artifact — the one thing hackathon judging weighs heaviest. It must
 * never overstate what happened: `deriveReceiptStatus` refuses to say
 * "Confirmed" without a transaction hash to back it, and gas renders as words
 * rather than a fabricated number when KeeperHub reports none.
 */
export function ExecutionReceiptCard({ receipt }: { receipt: ExecutionReceipt }) {
  const { tone, label } = deriveReceiptStatus(receipt.status, receipt.txHash);
  const gas = formatGas(receipt.gasUsed, true);

  const fields: Field[] = [
    {
      label: "Path",
      value: receipt.viaMcp ? "KeeperHub MCP" : "KeeperHub REST",
      mono: true,
      tone: "muted",
    },
    {
      label: "Gas",
      value: gas.value,
      mono: gas.isRealNumber,
      tone: gas.isRealNumber ? "accent" : "muted",
    },
  ];

  return (
    <div
      className="w-full bg-gray-800 border border-white/[0.06] rounded-2xl p-4"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono">
          Execution receipt
        </span>
        <StatusBadge tone={tone} label={label} />
      </div>

      <FieldGrid fields={fields} className="mb-3" />

      {receipt.txHash ? (
        <div className="rounded-[10px] bg-gray-900 border border-white/[0.06] px-3 py-2.5">
          <span className="block mb-1 text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono">
            Transaction
          </span>
          <MonoValue
            value={receipt.txHash}
            truncate
            copyable
            explorerUrl={receipt.explorerUrl}
            label="transaction hash"
            className="text-violet-400"
          />
        </div>
      ) : (
        <div className="rounded-[10px] bg-warning/10 border border-warning/30 px-3 py-2.5">
          <p className="text-[13px] text-warning">
            KeeperHub accepted the request but has not returned a transaction
            hash yet.
          </p>
          {receipt.executionId && (
            <p className="mt-1 font-mono text-[11px] text-gray-400">
              Execution {receipt.executionId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
