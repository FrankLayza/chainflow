"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NETWORK_CHAIN_ID, NETWORK_LABEL } from "./steps";
import { riseIn } from "./motion";

/**
 * Text-only attribution strip. Deliberately not a logo bar: `public/` holds no
 * third-party marks, and rendering a Base logo would claim a network this app
 * does not execute on (chain 11155111 is Ethereum Sepolia, not Base's 84532).
 *
 * Every claim here is verifiable from the code: the chain ID, the explorer host
 * in `execute-rule/route.ts`, and the KeeperHub execution path.
 */
const ITEMS = [
  `${NETWORK_LABEL} · chain ${NETWORK_CHAIN_ID}`,
  "Verified on Etherscan",
  "Executed via KeeperHub",
  "Built for Agents Onchain 2026",
];

export function TrustRow() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Infrastructure and verification"
      className="border-y border-white/[0.06] px-6"
    >
      <motion.ul
        {...riseIn(0, reduceMotion)}
        className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4"
      >
        {ITEMS.map((item) => (
          <li
            key={item}
            className="text-[11px] font-mono uppercase tracking-[0.08em] text-gray-500"
          >
            {item}
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
