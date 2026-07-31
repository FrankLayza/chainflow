"use client";

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel, ExecutionReceipt } from '@/components/chat/ChatPanel';
import { RuleSimulation } from '@/components/chat/ParsedRuleCard';

interface WalletInfo {
  id: string;
  address: string;
  name?: string;
}

export default function AppPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

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
    <main className="h-screen w-screen bg-absolute text-warm-off-white font-sora overflow-hidden flex flex-col">
      <TopBar />

      {walletError && (
        <div className="px-6 py-2 bg-red-400/10 border-b border-red-400/30 text-red-400 text-xs font-mono">
          Wallet unavailable: {walletError}
        </div>
      )}

      <div className="flex-1 w-full bg-absolute overflow-hidden">
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
    </main>
  );
}
