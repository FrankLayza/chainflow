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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0e111a] border border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(0,212,255,0.2)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isExecuting}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Confirm On-Chain Rule Activation</h3>
            <p className="text-xs text-gray-400">Review execution details before broadcasting to KeeperHub</p>
          </div>
        </div>

        {/* Parameter Summary Dossier */}
        <div className="space-y-3 mb-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Rule Trigger</span>
              <span className="font-semibold text-purple-300">{rule.ruleType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Target Action</span>
              <span className="font-semibold text-cyan-300">Transfer {rule.parameters.transferAmount} ETH</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Recipient Address</span>
              <span className="font-mono text-white">{rule.parameters.targetAddress}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Network</span>
              <span className="font-medium text-emerald-400">{rule.network}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Gas Sponsorship</span>
              <span className="font-semibold text-emerald-300">100% Sponsored by KeeperHub (FREE)</span>
            </div>
          </div>

          {/* Execution Flow Graphic */}
          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between text-xs text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>ChainFlow AI Agent</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <span>KeeperHub API</span>
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <span className="text-emerald-400 font-semibold">On-Chain Confirmation</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-colors border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(rule)}
            disabled={isExecuting}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(0,212,255,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
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
      </div>
    </div>
  );
};
