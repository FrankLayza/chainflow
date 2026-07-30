'use client';

import React from 'react';
import { ParsedRule } from '@/types/rule';
import { ShieldCheck, X, Zap, CheckCircle, ArrowRight } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  rule: ParsedRule | null;
  onClose: () => void;
  onConfirm: (rule: ParsedRule) => void;
  isExecuting?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  rule,
  onClose,
  onConfirm,
  isExecuting,
}) => {
  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ember/90 animate-fade-in">
      <div className="w-full max-w-lg rounded-lg bg-slate-hearth border border-faint-linen/20 p-6">

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isExecuting}
          className="absolute top-4 right-4 p-1.5 rounded-md text-bone-gray hover:text-warm-off-white hover:bg-iron-veil transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-iron-veil border border-faint-linen/20 text-muted-cobalt">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-warm-off-white">Confirm Rule Activation</h3>
            <p className="text-sm text-bone-gray">Review execution details before broadcasting to KeeperHub</p>
          </div>
        </div>

        {/* Parameter Summary */}
        <div className="grid grid-cols-2 gap-px bg-iron-veil rounded-md overflow-hidden mb-4">
          <div className="bg-smoke-charcoal p-3">
            <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Trigger</span>
            <span className="text-sm font-mono text-gold-leaf">{rule.ruleType}</span>
          </div>
          <div className="bg-smoke-charcoal p-3">
            <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Action</span>
            <span className="text-sm font-mono text-muted-cobalt">Transfer {rule.parameters.transferAmount} ETH</span>
          </div>
          <div className="bg-smoke-charcoal p-3">
            <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Recipient</span>
            <span className="text-sm font-mono text-warm-off-white">{rule.parameters.targetAddress}</span>
          </div>
          <div className="bg-smoke-charcoal p-3">
            <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Network</span>
            <span className="text-sm font-mono text-gold-leaf">{rule.network}</span>
          </div>
          <div className="bg-smoke-charcoal p-3 col-span-2">
            <span className="text-caption-tracked uppercase tracking-[0.1em] text-bone-gray font-mono block mb-0.5">Gas</span>
            <span className="text-sm font-mono text-[#28c840]">100% Sponsored by KeeperHub</span>
          </div>
        </div>

        {/* Execution Flow */}
        <div className="p-3 rounded-md bg-iron-veil border border-faint-linen/10 flex items-center justify-between text-sm text-bone-gray font-mono mb-4">
          <span className="flex items-center gap-1.5 text-muted-cobalt">
            <Zap className="w-4 h-4" />
            ChainFlow Agent
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>KeeperHub API</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="text-[#28c840]">On-Chain ✓</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-2 rounded-md bg-smoke-charcoal hover:bg-iron-veil text-bone-gray text-sm font-medium transition-colors border border-iron-veil"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(rule)}
            disabled={isExecuting}
            className="flex-[2] py-2 rounded-md bg-warm-off-white text-deep-ember text-sm font-medium transition-all duration-150 hover:bg-pale-stone active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-deep-ember/30 border-t-deep-ember animate-spin" />
                <span>Broadcasting to KeeperHub...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Activate & Execute On-Chain</span>
              </>
            )}
          </button>
        </div>

        {/* Gas sponsorship note */}
        <p className="text-[11px] text-bone-gray text-center mt-3 font-mono">
          Gas fees fully sponsored. No wallet connection required.
        </p>
      </div>
    </div>
  );
};
