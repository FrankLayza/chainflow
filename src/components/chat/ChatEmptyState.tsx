"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { PRESET_RULES } from "@/lib/ai/presets";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GooeyStack } from "@/components/godui/gooey-stack";

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
  const [collapsed, setCollapsed] = useState(true);

  const item = (i: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.06 },
  });

  return (
    <div className="max-w-lg mx-auto py-10">
      <motion.span
        {...item(0)}
        className="block text-xs font-mono uppercase tracking-wider text-gray-400"
      >
        Ethereum Sepolia · testnet
      </motion.span>

      <motion.h2
        {...item(1)}
        className="mt-3 text-2xl leading-tight font-semibold tracking-tight text-white text-balance"
      >
        Describe a transfer. Confirm it. Get the hash.
      </motion.h2>

      <motion.p {...item(2)} className="mt-3 text-sm leading-relaxed text-gray-400 text-pretty">
        Type what you want to happen on-chain in plain English. ChainFlow parses
        it, simulates it against Sepolia, and waits for your confirmation before
        anything broadcasts.
      </motion.p>

      <motion.ol {...item(3)} className="mt-8 space-y-2">
        {STEPS.map((step) => (
          <li key={step.n} className="flex items-baseline gap-3 text-xs">
            <span className="font-mono text-gray-500 shrink-0">{step.n}</span>
            <span className="text-white w-20 shrink-0">{step.label}</span>
            <span className="text-gray-400">{step.detail}</span>
          </li>
        ))}
      </motion.ol>

      <motion.div {...item(4)} className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="block text-xs font-mono uppercase tracking-wider text-gray-400">
            START WITH ONE OF THESE
          </span>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-300 rounded-full border border-white/10 bg-gray-900/60 hover:bg-gray-800 hover:text-white transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            )}
          >
            <span>{collapsed ? `View all (${PRESET_RULES.length})` : "Stack presets"}</span>
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 transition-transform duration-200" />
            )}
          </button>
        </div>

        <GooeyStack
          collapsed={collapsed}
          expandedGap={20}
          collapsedGap={-52}
          gooeyness={8}
          radius={24}
        >
          {PRESET_RULES.map((preset, i) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                } else {
                  onPick(preset.promptText);
                }
              }}
              className={cn(
                "group w-full text-left p-4 cursor-pointer block select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-2xl",
                "transition-colors duration-150"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                  {preset.title}
                </span>
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                    Recommended
                  </span>
                )}
              </div>

              <span className="mt-1 block text-xs text-gray-400">
                {preset.description}
              </span>

              <span className="mt-2.5 flex items-center justify-between gap-2 font-mono text-xs text-gray-500">
                <span className="truncate">
                  {preset.promptText.replace(
                    /0x[a-fA-F0-9]{40}/,
                    (m) => truncateAddress(m)
                  )}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-1 text-gray-400 group-hover:text-white"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </button>
          ))}
        </GooeyStack>
      </motion.div>

      <motion.p {...item(5)} className="mt-6 text-xs text-gray-500 text-pretty">
        Gas is sponsored by KeeperHub. Nothing executes until you confirm.
      </motion.p>
    </div>
  );
}

