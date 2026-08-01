"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Field {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: "default" | "accent" | "muted";
}

const toneClass = {
  default: "text-white",
  accent: "text-violet-400",
  muted: "text-gray-400",
} as const;

/**
 * The `gap-px` grid lets the container colour show through as hairlines, so
 * cells are separated structurally without each one carrying its own border.
 * Skeleton and loaded states share this layout, so populating fields cannot
 * shift the card.
 */
export function FieldGrid({
  fields,
  skeleton = false,
  skeletonLabels,
  className,
}: {
  fields?: Field[];
  skeleton?: boolean;
  skeletonLabels?: string[];
  className?: string;
}) {
  const cells = skeleton
    ? (skeletonLabels ?? ["From", "To", "Amount", "Gas"]).map((label) => ({
        label,
        value: null,
        mono: true,
        tone: "default" as const,
      }))
    : (fields ?? []);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px bg-white/[0.06] rounded-[10px] overflow-hidden",
        className,
      )}
    >
      {cells.map((field) => (
        <div key={field.label} className="bg-gray-900 px-3 py-2.5 min-w-0">
          <span className="block mb-1 text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono">
            {field.label}
          </span>
          {skeleton ? (
            <span className="block h-4 w-24 rounded bg-gray-700 motion-safe:animate-pulse" />
          ) : (
            <span
              className={cn(
                "block text-sm truncate",
                field.mono && "font-mono",
                toneClass[field.tone ?? "default"],
              )}
            >
              {field.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
