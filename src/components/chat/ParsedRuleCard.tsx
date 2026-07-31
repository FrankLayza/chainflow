'use client';

import React from 'react';
import { ParsedRule } from '@/types/rule';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';

interface ParsedRuleCardProps {
  rule: ParsedRule;
  onActivate: (rule: ParsedRule) => void;
  isExecuting?: boolean;
}

export const ParsedRuleCard: React.FC<ParsedRuleCardProps> = ({
  rule,
  onActivate,
  isExecuting,
}) => {
  return (
    <div className="w-full rounded-lg bg-smoke-charcoal border border-faint-linen/20 p-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3 border-b border-iron-veil pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-iron-veil text-muted-cobalt">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-caption-tracked uppercase tracking-[0.15em] text-muted-cobalt font-mono">
            Structured Rule
          </span>
        </div>
        <div className="flex items-center gap-2">
          {rule.network && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 border border-faint-linen/20 rounded text-muted-cobalt bg-muted-cobalt/10">
              {rule.network}
            </span>
          )}
          <span className="text-[11px] font-mono px-1.5 py-0.5 border border-faint-linen/20 rounded text-bone-gray">
            Parsed
          </span>
        </div>
      </div>

      {/* Plain English Explanation */}
      <p className="text-sm text-warm-off-white mb-4 leading-relaxed">
        {rule.explanation}
      </p>

      {/* Parameter Grid */}
      <div className="grid grid-cols-2 gap-px bg-iron-veil rounded-md overflow-hidden mb-4">
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Trigger</span>
          <span className="text-sm font-mono text-gold-leaf">{rule.ruleType}</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Threshold</span>
          <span className="text-sm font-mono text-warm-off-white">{rule.parameters.thresholdAmount} {rule.ruleType === 'PRICE_BELOW' ? 'USD' : 'ETH'}</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Action</span>
          <span className="text-sm font-mono text-muted-cobalt">Transfer {rule.parameters.transferAmount} ETH</span>
        </div>
        <div className="bg-smoke-charcoal p-3">
          <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Recipient</span>
          <span className="text-sm font-mono text-warm-off-white">{rule.parameters.targetAddress.slice(0, 6)}...{rule.parameters.targetAddress.slice(-4)}</span>
        </div>
      </div>

      {/* Footer & CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-bone-gray">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-leaf" />
          <span>KeeperHub Guaranteed</span>
        </div>

        <button
          onClick={() => onActivate(rule)}
          disabled={isExecuting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-warm-off-white text-deep-ember text-sm font-medium transition-all duration-150 hover:bg-pale-stone active:scale-95 disabled:opacity-40"
        >
          <span>{isExecuting ? 'Processing...' : 'Review & Activate'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
