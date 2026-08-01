"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AuditDashboard } from '@/components/dashboard/AuditDashboard';
import {
  AuditData,
  ExecutionReceipt,
  ParsedRule,
  RuleSimulation,
  WalletInfo,
} from '@/types/rule';
import { Async } from '@/types/async';
import { cn } from '@/lib/utils';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function readJson(res: Response): Promise<any> {
  return res.json().catch(() => null);
}

export default function AppPage() {
  const [wallet, setWallet] = useState<Async<WalletInfo>>({ kind: 'loading' });
  const [audit, setAudit] = useState<Async<AuditData>>({ kind: 'loading' });
  const [isExecuting, setIsExecuting] = useState(false);
  const [auditFetching, setAuditFetching] = useState(true);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<'chat' | 'activity'>('chat');
  const [unseenActivity, setUnseenActivity] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/wallet');
        const data = await readJson(res);
        if (!res.ok || !data?.success || !data.wallet) {
          throw new Error(data?.error || `Wallet service returned ${res.status}`);
        }
        if (!cancelled) setWallet({ kind: 'ready', data: data.wallet });
      } catch (error) {
        if (!cancelled) {
          setWallet({
            kind: 'error',
            message: errorMessage(error, 'Failed to reach KeeperHub wallet check'),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Keep already-loaded rows mounted across a refresh so the panel spins its
    // icon instead of flashing skeletons over data the user is reading.
    setAudit((prev) => (prev.kind === 'ready' ? prev : { kind: 'loading' }));
    setAuditFetching(true);

    (async () => {
      try {
        const res = await fetch('/api/audit-logs');
        const data = await readJson(res);
        // Without this check an HTTP 500 resolves with {error}, `rules` reads
        // undefined, and the panel renders "no executions yet" for what is
        // actually a server failure.
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `Audit service returned ${res.status}`);
        }
        if (!cancelled) {
          setAudit({
            kind: 'ready',
            data: { rules: data.rules ?? [], executions: data.executions ?? [] },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setAudit({
            kind: 'error',
            message: errorMessage(error, 'Could not reach the execution log'),
          });
        }
      } finally {
        if (!cancelled) setAuditFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auditRefreshKey]);

  const parsePrompt = useCallback(async (prompt: string): Promise<ParsedRule | null> => {
    const res = await fetch('/api/parse-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || 'Failed to parse rule');
    return data?.rule ?? null;
  }, []);

  const simulateRule = useCallback(
    async (rule: ParsedRule): Promise<RuleSimulation | null> => {
      const res = await fetch('/api/simulate-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to simulate rule');
      return data?.simulation ?? null;
    },
    [],
  );

  const activateRule = useCallback(
    async (rule: ParsedRule): Promise<ExecutionReceipt | null> => {
      // The route mints a fresh idempotency key per request, so KeeperHub will
      // not dedupe a double-submit. This guard is the only thing preventing a
      // second broadcast.
      if (isExecuting) return null;
      setIsExecuting(true);
      try {
        const res = await fetch('/api/execute-rule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule }),
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data?.error || 'Failed to execute rule');

        setAuditRefreshKey((key) => key + 1);
        setUnseenActivity(true);

        return {
          executionId: data?.executionId ?? undefined,
          // No 'CONFIRMED' fallback: an unknown status must stay unknown so the
          // receipt can render it honestly rather than claim success.
          status: data?.record?.status || data?.status || 'UNKNOWN',
          txHash: data?.record?.transaction_hash || data?.khResponse?.transactionHash,
          explorerUrl: data?.record?.explorer_url || data?.khResponse?.transactionLink,
          gasUsed: data?.record?.gas_used,
          viaMcp: Boolean(data?.viaMcp),
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting],
  );

  const refreshAudit = useCallback(() => setAuditRefreshKey((key) => key + 1), []);

  const executionCount = audit.kind === 'ready' ? audit.data.executions.length : 0;

  return (
    <main className="h-dvh w-screen bg-gray-950 text-white font-sans overflow-hidden flex flex-col">
      <TopBar wallet={wallet} />

      <div className="lg:hidden flex gap-1 p-1 mx-4 mt-3 bg-gray-900 rounded-xl border border-white/[0.06]">
        {(['chat', 'activity'] as const).map((tab) => {
          const isActive = mobileTab === tab;
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setMobileTab(tab);
                if (tab === 'activity') setUnseenActivity(false);
              }}
              className={cn(
                'flex-1 rounded-[10px] py-2 text-[13px] font-medium cursor-pointer',
                'transition-[background-color,color] duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
                isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {tab === 'chat' ? 'Chat' : 'Activity'}
                {tab === 'activity' && executionCount > 0 && (
                  <span className="font-mono text-xs text-gray-500">{executionCount}</span>
                )}
                {tab === 'activity' && unseenActivity && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 w-full flex">
        <div
          className={cn(
            'flex-1 min-w-0',
            mobileTab !== 'chat' && 'hidden lg:block',
          )}
        >
          <ChatPanel
            onParsePrompt={parsePrompt}
            onSimulateRule={simulateRule}
            onActivateRule={activateRule}
            isExecuting={isExecuting}
          />
        </div>

        <aside
          className={cn(
            'shrink-0 lg:w-[420px] lg:border-l lg:border-white/[0.06]',
            mobileTab !== 'activity' ? 'hidden lg:block' : 'flex-1 min-w-0',
          )}
        >
          <AuditDashboard
            audit={audit}
            onRefresh={refreshAudit}
            isRefreshing={auditFetching}
          />
        </aside>
      </div>
    </main>
  );
}
