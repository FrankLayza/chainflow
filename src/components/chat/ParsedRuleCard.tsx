"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FieldGrid, type Field } from "@/components/ui/FieldGrid";
import { formatElapsed, formatGas, truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExecState, ParsedRule, SimState } from "@/types/rule";

interface ParsedRuleCardProps {
  rule: ParsedRule;
  sim: SimState;
  exec: ExecState;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onBroadcast: () => void;
  onRetrySimulate: () => void;
  /** True while any execution is in flight, including another card's. */
  globallyLocked: boolean;
}

const primaryButton = cn(
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer",
  "bg-violet-500 text-white text-sm font-medium",
  "hover:bg-violet-600",
  "transition-[background-color,transform] duration-150 ease-out active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
);

const ghostButton = cn(
  "inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer",
  "border border-white/[0.08] text-gray-400 text-sm",
  "hover:text-white hover:border-white/[0.15]",
  "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
);

function useElapsed(active: boolean) {
  const [ms, setMs] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setMs(0);
      return;
    }
    const started = performance.now();
    const id = window.setInterval(() => setMs(performance.now() - started), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return ms;
}

export const ParsedRuleCard: React.FC<ParsedRuleCardProps> = ({
  rule,
  sim,
  exec,
  onConfirm,
  onCancelConfirm,
  onBroadcast,
  onRetrySimulate,
  globallyLocked,
}) => {
  const reduceMotion = useReducedMotion();
  const broadcastRef = React.useRef<HTMLButtonElement>(null);
  const elapsed = useElapsed(exec === "executing");

  const armed = sim.phase === "done" && sim.simulation.passed && exec === "idle";
  const gas =
    sim.phase === "done"
      ? formatGas(sim.simulation.gasEstimate, sim.simulation.sponsored)
      : { value: "—", isRealNumber: false };

  React.useEffect(() => {
    if (exec === "confirming") broadcastRef.current?.focus();
  }, [exec]);

  React.useEffect(() => {
    if (exec !== "confirming") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exec, onCancelConfirm]);

  const fields: Field[] = [
    {
      label: "From",
      value:
        sim.phase === "done" && sim.simulation.from
          ? truncateAddress(sim.simulation.from)
          : "Not reported",
      mono: sim.phase === "done" && Boolean(sim.simulation.from),
      tone: sim.phase === "done" && sim.simulation.from ? "default" : "muted",
    },
    {
      label: "To",
      value: truncateAddress(rule.parameters.targetAddress),
      mono: true,
    },
    {
      label: "Amount",
      value: `${rule.parameters.transferAmount} ${rule.parameters.tokenSymbol || "ETH"}`,
      mono: true,
      tone: "accent",
    },
    {
      label: "Gas",
      value:
        sim.phase === "simulating" ? (
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Loader2 className="w-3 h-3 motion-safe:animate-spin" strokeWidth={1.5} />
            Estimating
          </span>
        ) : (
          gas.value
        ),
      mono: gas.isRealNumber,
      tone: gas.isRealNumber ? "accent" : "muted",
    },
  ];

  return (
    <motion.div
      animate={{
        boxShadow: armed
          ? "0 0 0 1px rgba(139,92,246,0.4)"
          : "0 0 0 1px rgba(255,255,255,0.06)",
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-gray-800 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono">
          Parsed rule
        </span>
        {sim.phase === "simulating" && (
          <StatusBadge tone="live" label="Simulating" pulse />
        )}
        {sim.phase === "done" && sim.simulation.passed && exec === "idle" && (
          <StatusBadge tone="confirmed" label="Ready" />
        )}
        {exec === "done" && <StatusBadge tone="confirmed" label="Executed" />}
        {exec === "failed" && <StatusBadge tone="failed" label="Failed" />}
      </div>

      <p className="text-sm text-white mb-3 leading-relaxed text-pretty">
        {rule.explanation}
      </p>

      <FieldGrid fields={fields} className="mb-3" />

      <div aria-live="polite">
        {sim.phase === "done" && (
          <div
            className={cn(
              "flex items-start gap-2 text-[13px] px-3 py-2 rounded-[10px] border mb-3",
              sim.simulation.passed
                ? "text-success border-success/30 bg-success/10"
                : "text-danger border-danger/30 bg-danger/10",
            )}
          >
            {sim.simulation.passed ? (
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
            )}
            <span>
              {sim.simulation.passed
                ? "Simulation passed. This will not revert."
                : "Simulation says this would revert. Execution is blocked."}
            </span>
          </div>
        )}

        {sim.phase === "error" && (
          <div className="flex items-start gap-2 text-[13px] px-3 py-2 rounded-[10px] border border-danger/30 bg-danger/10 text-danger mb-3">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
            <div className="min-w-0">
              <p>Simulation failed to run.</p>
              <p className="text-gray-400 mt-0.5 break-words">{sim.message}</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {exec === "confirming" ? (
          <motion.div
            key="confirm"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="rounded-[10px] border border-violet-500/30 bg-violet-500/5 p-3"
          >
            <p className="text-[13px] text-white mb-3">
              This broadcasts to Ethereum Sepolia. It cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onCancelConfirm} className={ghostButton}>
                Cancel
              </button>
              <button
                ref={broadcastRef}
                type="button"
                onClick={onBroadcast}
                disabled={globallyLocked}
                className={primaryButton}
              >
                Broadcast {rule.parameters.transferAmount}{" "}
                {rule.parameters.tokenSymbol || "ETH"}
                <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </motion.div>
        ) : exec === "executing" ? (
          <motion.div
            key="executing"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="space-y-2"
          >
            {/* KeeperHub emits no progress events, so no step is marked complete
                without evidence — only the active one is shown as live. */}
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[13px] text-violet-400">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-violet-500 opacity-75 motion-safe:animate-ping" />
                  <span className="relative w-2 h-2 rounded-full bg-violet-500" />
                </span>
                Broadcasting to Sepolia
              </span>
              <span className="font-mono text-xs text-gray-500 tabular-nums">
                {formatElapsed(elapsed)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              <span className="w-2 h-2 rounded-full border border-gray-600" />
              Waiting for confirmation
            </div>
          </motion.div>
        ) : exec === "done" ? (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-gray-400"
          >
            Broadcast complete. Receipt below.
          </motion.p>
        ) : (
          <motion.div
            key="idle"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="truncate">Gas sponsored by KeeperHub</span>
            </span>

            {sim.phase === "error" ? (
              <button type="button" onClick={onRetrySimulate} className={ghostButton}>
                Retry simulation
              </button>
            ) : exec === "failed" ? (
              <button type="button" onClick={onConfirm} className={ghostButton}>
                Try again
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={!armed || globallyLocked}
                className={primaryButton}
              >
                {sim.phase === "simulating"
                  ? "Simulating…"
                  : sim.phase === "done" && !sim.simulation.passed
                    ? "Blocked"
                    : "Confirm & execute"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
