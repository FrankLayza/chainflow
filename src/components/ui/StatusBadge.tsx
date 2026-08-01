"use client";

import React from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReceiptTone } from "@/lib/format";

const toneStyles: Record<ReceiptTone, { className: string; Icon: LucideIcon }> = {
  confirmed: { className: "bg-success/15 text-success", Icon: CheckCircle2 },
  pending: { className: "bg-warning/15 text-warning", Icon: Clock },
  failed: { className: "bg-danger/15 text-danger", Icon: XCircle },
  live: { className: "bg-violet-500/15 text-violet-400", Icon: Check },
  neutral: { className: "bg-gray-700 text-gray-400", Icon: HelpCircle },
};

interface StatusBadgeProps {
  tone: ReceiptTone;
  label: string;
  /** Live states show a pulsing dot instead of an icon. */
  pulse?: boolean;
  className?: string;
}

/**
 * Status is never carried by colour alone — every badge pairs its tint with an
 * icon and a text label, so it survives both reduced-motion and colour-blind
 * viewing.
 */
export function StatusBadge({ tone, label, pulse, className }: StatusBadgeProps) {
  const { className: toneClass, Icon } = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        toneClass,
        className,
      )}
    >
      {pulse ? (
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span className="absolute inset-0 rounded-full bg-current opacity-75 motion-safe:animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
      )}
      {label}
    </span>
  );
}
