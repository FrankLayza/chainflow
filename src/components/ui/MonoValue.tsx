"use client";

import React from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";

interface MonoValueProps {
  value: string | null | undefined;
  /** Truncate to `0x1234…cdef`. Pass false for short values like amounts. */
  truncate?: boolean;
  copyable?: boolean;
  explorerUrl?: string | null;
  explorerLabel?: string;
  className?: string;
  /** Announced to screen readers on copy, e.g. "transaction hash". */
  label?: string;
}

/**
 * Owns its own `copied` state. The previous implementation held one boolean for
 * the whole chat panel, so copying one hash flashed the checkmark on every
 * receipt at once.
 */
export function MonoValue({
  value,
  truncate = false,
  copyable = false,
  explorerUrl,
  explorerLabel = "Etherscan",
  className,
  label = "value",
}: MonoValueProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const display = value ? (truncate ? truncateAddress(value) : value) : "—";

  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <span className="font-mono text-sm truncate" title={value ?? undefined}>
        {display}
      </span>

      {copyable && value && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
          className={cn(
            "shrink-0 text-gray-500 hover:text-white cursor-pointer",
            "transition-[color,transform] duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded",
          )}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
          ) : (
            <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
          )}
        </button>
      )}

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "shrink-0 inline-flex items-center gap-1 text-xs font-mono",
            "text-gray-400 hover:text-white cursor-pointer",
            "transition-[color,transform] duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded",
          )}
        >
          {explorerLabel}
          <ExternalLink className="w-3 h-3" strokeWidth={1.5} aria-hidden />
        </a>
      )}
    </span>
  );
}
