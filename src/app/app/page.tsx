"use client";

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel, ExecutionReceipt } from '@/components/chat/ChatPanel';
import { RuleSimulation } from '@/components/chat/ParsedRuleCard';
import { AuditDashboard } from '@/components/dashboard/AuditDashboard';
import { ExecutionRecord, ParsedRule } from '@/types/rule';

interface WalletInfo {
  id: string;
  address: string;
  name?: string;
}

interface AuditLogsResponse {
  success: boolean;
  rules: ParsedRule[];
  executions: ExecutionRecord[];
}

export default function AppPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [auditRules, setAuditRules] = useState<ParsedRule[]>([]);
  const [auditExecutions, setAuditExecutions] = useState<ExecutionRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.wallet) {
          setWallet(data.wallet);
        } else {
          setWalletError(data.error || 'Wallet integration not found');
        }
      })
      .catch(() => setWalletError('Failed to reach KeeperHub wallet check'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAuditLoading(true);
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data: AuditLogsResponse) => {
        if (cancelled) return;
        setAuditRules(data.rules || []);
        setAuditExecutions(data.executions || []);
      })
      .catch(() => {
        if (!cancelled) {
          setAuditRules([]);
          setAuditExecutions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auditRefreshKey]);

  const simulateRule = async (rule: any): Promise<RuleSimulation | null> => {
    const res = await fetch('/api/simulate-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to simulate rule');
    }
    return data.simulation ?? null;
  };

  return (
    <main className="h-screen w-screen bg-absolute text-warm-off-white font-sans overflow-hidden flex flex-col">
      <TopBar />

      {walletError && (
        <div className="px-6 py-2 bg-danger/10 border-b border-danger/30 text-danger text-xs font-mono">
          Wallet unavailable: {walletError}
        </div>
      )}

      <div className="flex-1 w-full bg-absolute overflow-hidden flex">
        <div className="flex-1 min-w-0">
          <ChatPanel
            onParsePrompt={async (prompt) => {
              const res = await fetch('/api/parse-rule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.error || 'Failed to parse rule');
              }
              return data.rule;
            }}
            onSimulateRule={simulateRule}
            onActivateRule={async (rule): Promise<ExecutionReceipt | null> => {
              const res = await fetch('/api/execute-rule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rule }),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.error || 'Failed to execute rule');
              }
              setAuditRefreshKey((key) => key + 1);
              return {
                executionId: data.executionId,
                status: data.record?.status || data.status || 'CONFIRMED',
                txHash: data.record?.transaction_hash || data.khResponse?.transactionHash,
                explorerUrl: data.record?.explorer_url || data.khResponse?.transactionLink,
                gasUsed: data.record?.gas_used,
                viaMcp: Boolean(data.viaMcp),
              };
            }}
          />
        </div>

        <aside className="hidden lg:block w-[420px] shrink-0 border-l border-iron-veil">
          <AuditDashboard
            rules={auditRules}
            executions={auditExecutions}
            isLoading={auditLoading}
            onRefresh={() => setAuditRefreshKey((key) => key + 1)}
          />
        </aside>
      </div>
    </main>
  );
}
