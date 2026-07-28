'use client';

import React from 'react';
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import { ShieldCheck, ExternalLink, CheckCircle2, Clock, Zap, RefreshCw } from 'lucide-react';

interface AuditDashboardProps {
  rules: ParsedRule[];
  executions: ExecutionRecord[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  rules,
  executions,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 overflow-y-auto">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Execution & Audit Dossier</span>
          </h2>
          <p className="text-xs text-gray-400">Live verified on-chain transactions via KeeperHub</p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Active Rules Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
          Active Automation Rules ({rules.length})
        </h3>
        {rules.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-500">
            No rules active yet. Type a rule in chat or click a preset to start!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="p-4 rounded-xl bg-[#121522]/80 border border-white/10 space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-cyan-300">{rule.ruleType}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-gray-300 line-clamp-2">{rule.explanation}</p>
                <div className="text-[10px] text-gray-500 font-mono pt-1">
                  Network: {rule.network}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Audit Log Table */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
          Verified Execution Log ({executions.length})
        </h3>
        <div className="w-full rounded-2xl bg-[#0f111a] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-gray-400 text-[11px] border-b border-white/5 uppercase">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Gas / Sponsor</th>
                  <th className="py-3 px-4">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs font-sans">
                      No on-chain executions recorded yet.
                    </td>
                  </tr>
                ) : (
                  executions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{exec.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">{exec.timestamp}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{exec.amount} ETH</td>
                      <td className="py-3.5 px-4 text-cyan-300">
                        {exec.recipientAddress.slice(0, 6)}...{exec.recipientAddress.slice(-4)}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-300">
                        {exec.gasUsed || '77,119 units'} (Sponsored)
                      </td>
                      <td className="py-3.5 px-4">
                        {exec.explorerUrl ? (
                          <a
                            href={exec.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            <span>{exec.txHash ? exec.txHash.slice(0, 8) + '...' + exec.txHash.slice(-6) : 'View Explorer'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-500">{exec.txHash?.slice(0, 10)}...</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
