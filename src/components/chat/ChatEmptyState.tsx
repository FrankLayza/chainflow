"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PRESET_RULES } from "@/lib/ai/presets";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", label: "Describe", detail: "Plain English. No syntax to learn." },
  { n: "02", label: "Review", detail: "Parsed fields plus a simulation verdict." },
  { n: "03", label: "Confirm", detail: "A two-step gate, then a real transaction hash." },
];

/**
 * Presets render title + description with the raw prompt as a mono sub-line —
 * that sub-line is the actual onboarding, since it shows the exact sentence
 * shape the parser accepts. Clicking submits immediately rather than filling the
 * composer: one click to first proof.
 */
export function ChatEmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  const reduceMotion = useReducedMotion();

  const item = (i: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.06 },
  });

  return (
    <div className="max-w-lg mx-auto py-10">
      <motion.span
        {...item(0)}
        className="block text-[11px] font-mono uppercase tracking-[0.04em] text-gray-400"
      >
        Ethereum Sepolia · testnet
      </motion.span>

      <motion.h2
        {...item(1)}
        className="mt-3 text-[28px] leading-tight font-semibold tracking-tight text-white text-balance"
      >
        Describe a transfer. Confirm it. Get the hash.
      </motion.h2>

      <motion.p {...item(2)} className="mt-3 text-[15px] leading-relaxed text-gray-400 text-pretty">
        Type what you want to happen on-chain in plain English. ChainFlow parses
        it, simulates it against Sepolia, and waits for your confirmation before
        anything broadcasts.
      </motion.p>

      <motion.ol {...item(3)} className="mt-8 space-y-2">
        {STEPS.map((step) => (
          <li key={step.n} className="flex items-baseline gap-3 text-[13px]">
            <span className="font-mono text-gray-500 shrink-0">{step.n}</span>
            <span className="text-white w-20 shrink-0">{step.label}</span>
            <span className="text-gray-400">{step.detail}</span>
          </li>
        ))}
      </motion.ol>

      <motion.div {...item(4)} className="mt-8">
        <span className="block mb-3 text-[11px] font-mono uppercase tracking-[0.04em] text-gray-500">
          Start with one of these
        </span>

        <div className="space-y-2">
          {PRESET_RULES.map((preset, i) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPick(preset.promptText)}
              className={cn(
                "group w-full text-left bg-gray-800 border border-white/[0.06] rounded-2xl p-4 cursor-pointer",
                "hover:bg-gray-700",
                "transition-[background-color,transform] duration-150 ease-out active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">{preset.title}</span>
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-gray-700 px-2.5 py-0.5 text-[11px] text-gray-400">
                    Recommended
                  </span>
                )}
              </span>

              <span className="mt-1 block text-[13px] text-gray-400">
                {preset.description}
              </span>

              <span className="mt-2 flex items-center gap-2 font-mono text-[11px] text-gray-500 min-w-0">
                <span className="truncate">
                  {preset.promptText.replace(
                    /0x[a-fA-F0-9]{40}/,
                    (m) => truncateAddress(m),
                  )}
                </span>
                <ArrowRight
                  className="w-3 h-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.p {...item(5)} className="mt-6 text-[13px] text-gray-500 text-pretty">
        Gas is sponsored by KeeperHub. Nothing executes until you confirm.
      </motion.p>
    </div>
  );
}
