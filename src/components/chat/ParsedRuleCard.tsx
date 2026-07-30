'use client';

import React from 'react';
import { ParsedRule } from '@/types/rule';
import { ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

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
    <div className="w-full rounded-2xl bg-[#121522]/90 border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-xl">
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Zap className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold uppercase text-cyan-300 tracking-wider">
            AI Structured Rule
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Parsed & Validated
        </span>
      </div>

      {/* Plain English Explanation */}
      <p className="text-sm font-medium text-white mb-4 leading-relaxed">
        {rule.explanation}
      </p>

      {/* Parameter Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
        <div>
          <span className="text-gray-400 block text-[10px]">TRIGGER TYPE</span>
          <span className="font-semibold text-purple-300">{rule.ruleType}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">THRESHOLD</span>
          <span className="font-semibold text-white">{rule.parameters.thresholdAmount} {rule.ruleType === 'PRICE_BELOW' ? 'USD' : 'ETH'}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">ACTION</span>
          <span className="font-semibold text-cyan-300">Transfer {rule.parameters.transferAmount} ETH</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">RECIPIENT</span>
          <span className="font-mono text-gray-300">{rule.parameters.targetAddress.slice(0, 6)}...{rule.parameters.targetAddress.slice(-4)}</span>
        </div>
      </div>

      {/* Footer & CTA */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>KeeperHub Guaranteed</span>
        </div>

        <button
          onClick={() => onActivate(rule)}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] active:scale-95 disabled:opacity-50"
        >
          <span>{isExecuting ? 'Processing...' : 'Review & Activate'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
