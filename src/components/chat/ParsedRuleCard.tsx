'use client';

import React from 'react';
import { ParsedRule } from '@/types/rule';
import { ShieldCheck, ArrowRight, Zap, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface RuleSimulation {
  status: string;
  passed: boolean;
  wouldRevert: boolean;
  gasEstimate?: number | null;
  gasEstimateUsd?: number | null;
  from?: string | null;
  to?: string | null;
  amount: string;
  sponsored: boolean;
}

interface ParsedRuleCardProps {
  rule: ParsedRule;
  onActivate: (rule: ParsedRule) => void;
  isExecuting?: boolean;
  simulation?: RuleSimulation | null;
  isSimulating?: boolean;
}

export const ParsedRuleCard: React.FC<ParsedRuleCardProps> = ({
  rule,
  onActivate,
  isExecuting,
  simulation,
  isSimulating,
}) => {
  const simulationPassed = simulation?.passed;
  const confirmationBlocked = isExecuting || !simulationPassed;

  return (
    <div className="w-full rounded-lg bg-smoke-charcoal border border-faint-linen/20 p-4">
      <div className="flex items-center justify-between mb-3 border-b border-iron-veil pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-iron-veil text-muted-cobalt">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-caption-tracked uppercase tracking-wider text-muted-cobalt font-mono">
            Precision Dossier
          </span>
        </div>
        <div className="flex items-center gap-2">
          {rule.network && (
            <span className="text-caption-tracked font-mono px-1.5 py-0.5 border border-faint-linen/20 rounded text-muted-cobalt bg-muted-cobalt/10">
              {rule.network}
            </span>
          )}
          <span className="text-caption-tracked font-mono px-1.5 py-0.5 border border-faint-linen/20 rounded text-bone-gray">
            Simulated
          </span>
        </div>
      </div>

      <p className="text-sm text-warm-off-white mb-2 leading-relaxed">
        {rule.explanation}
      </p>

      <div className="grid grid-cols-2 gap-px bg-iron-veil rounded-md overflow-hidden mb-4">
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">From</span>
          <span className="text-sm font-mono text-warm-off-white">0xcAfa...d221</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">To</span>
          <span className="text-sm font-mono text-warm-off-white">{rule.parameters.targetAddress.slice(0, 6)}...{rule.parameters.targetAddress.slice(-4)}</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">Amount</span>
          <span className="text-sm font-mono text-muted-cobalt">{rule.parameters.transferAmount} ETH</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">Gas</span>
          <span className="text-sm font-mono text-gold-leaf">
            {isSimulating ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Estimating
              </span>
            ) : simulation?.gasEstimate ? (
              `${simulation.gasEstimate} units`
            ) : (
              'Sponsored by KeeperHub'
            )}
          </span>
        </div>
      </div>

      {isSimulating && (
        <div className="flex items-center gap-2 text-xs font-mono text-muted-cobalt mb-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Simulating via KeeperHub before broadcast...</span>
        </div>
      )}

      {!isSimulating && simulation && (
        <div
          className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-md border mb-4 ${
            simulationPassed
              ? 'text-gold-leaf border-gold-leaf/30 bg-gold-leaf/10'
              : 'text-red-400 border-red-400/30 bg-red-400/10'
          }`}
        >
          {simulationPassed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulation passed — will not revert</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulation failed — execution blocked</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono text-bone-gray">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-leaf" />
          <span>Gas sponsored by KeeperHub</span>
        </div>

        <button
          onClick={() => onActivate(rule)}
          disabled={confirmationBlocked}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-warm-off-white text-deep-ember text-sm font-medium transition-all duration-150 hover:bg-pale-stone active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>
            {isExecuting
              ? 'Executing...'
              : !simulation
                ? 'Simulating...'
                : simulationPassed
                  ? 'Confirm & Execute'
                  : 'Blocked'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
