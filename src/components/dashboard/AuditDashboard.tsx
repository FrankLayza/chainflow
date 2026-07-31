'use client';

import React from 'react';
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import { ShieldCheck, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';

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
    <div className="w-full h-full flex flex-col gap-5 p-6 overflow-y-auto bg-deep-ember">
      <div className="flex items-center justify-between border-b border-iron-veil pb-3">
        <div>
          <h2 className="text-sm font-mono text-warm-off-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-leaf" />
            <span>Execution &amp; Audit Dossier</span>
          </h2>
          <p className="text-xs text-bone-gray font-mono mt-0.5">Live verified on-chain transactions via KeeperHub</p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-smoke-charcoal hover:bg-iron-veil text-bone-gray text-xs font-mono transition-colors border border-iron-veil"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div>
        <h3 className="text-caption-tracked uppercase tracking-widest text-bone-gray font-mono mb-3">
          Active Rules ({rules.length})
        </h3>
        {rules.length === 0 ? (
          <div className="p-4 rounded-lg bg-smoke-charcoal border border-iron-veil text-center text-sm text-bone-gray font-mono">
            No rules active yet. Type a rule in chat or use a preset.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="p-3 rounded-lg bg-smoke-charcoal border border-iron-veil space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gold-leaf">{rule.ruleType}</span>
                  <span className="flex items-center gap-1 text-xs font-mono text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Active
                  </span>
                </div>
                <p className="text-sm text-bone-gray line-clamp-2">{rule.explanation}</p>
                <div className="text-xs text-bone-gray font-mono">{rule.network}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <h3 className="text-caption-tracked uppercase tracking-widest text-bone-gray font-mono mb-3">
          Execution Log ({executions.length})
        </h3>
        <div className="w-full rounded-lg bg-smoke-charcoal border border-iron-veil overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-iron-veil">
                <tr>
                  {['Status', 'Time', 'Amount', 'Recipient', 'Gas', 'Tx Hash'].map((col) => (
                    <th key={col} className="py-2.5 px-3 text-caption-tracked uppercase tracking-wider text-bone-gray font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-iron-veil font-mono text-sm">
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-bone-gray text-sm">
                      No on-chain executions recorded yet.
                    </td>
                  </tr>
                ) : (
                  executions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-iron-veil/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{exec.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-bone-gray">{exec.timestamp}</td>
                      <td className="py-2.5 px-3 text-warm-off-white">{exec.amount} ETH</td>
                      <td className="py-2.5 px-3 text-muted-cobalt">
                        {exec.recipientAddress.slice(0, 6)}...{exec.recipientAddress.slice(-4)}
                      </td>
                      <td className="py-2.5 px-3 text-gold-leaf">
                        {exec.gasUsed || '77,119 units'} (Sponsored)
                      </td>
                      <td className="py-2.5 px-3">
                        {exec.explorerUrl ? (
                          <a
                            href={exec.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-muted-cobalt hover:text-warm-off-white transition-colors"
                          >
                            <span>{exec.txHash ? exec.txHash.slice(0, 8) + '...' + exec.txHash.slice(-6) : 'View'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-bone-gray">{exec.txHash?.slice(0, 10)}...</span>
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
