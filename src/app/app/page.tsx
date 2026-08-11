"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Drawer } from '@/components/motion/drawer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AuditDashboard } from '@/components/dashboard/AuditDashboard';
import { toReceipt } from '@/lib/receipt';
import {
  AuditData,
  ExecutionReceipt,
  ParsedRule,
  RuleSimulation,
  WalletInfo,
} from '@/types/rule';
import { Async } from '@/types/async';

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
  const [activityOpen, setActivityOpen] = useState(false);
  const [unseenActivity, setUnseenActivity] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  // Read `?rule=` from the landing page's use-case links. Done with
  // window.location rather than useSearchParams so this route stays static —
  // useSearchParams would force a Suspense boundary and dynamic rendering.
  // The value only ever populates the composer; it is never auto-submitted.
  useEffect(() => {
    const rule = new URLSearchParams(window.location.search).get('rule');
    if (rule) setInitialPrompt(rule.slice(0, 300));
  }, []);

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

        return toReceipt(data);
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting],
  );

  const refreshAudit = useCallback(() => setAuditRefreshKey((key) => key + 1), []);

  const disableRule = useCallback(async (ruleId: string) => {
    const res = await fetch('/api/rules/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || 'Failed to disable rule');
    setAuditRefreshKey((key) => key + 1);
  }, []);

  const enableRule = useCallback(async (ruleId: string) => {
    const res = await fetch('/api/rules/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || 'Failed to enable rule');
    setAuditRefreshKey((key) => key + 1);
  }, []);

  const openActivity = useCallback(() => {
    setActivityOpen(true);
    setUnseenActivity(false);
  }, []);

  return (
    <main className="h-dvh w-screen bg-gray-950 text-white font-sans overflow-hidden flex flex-col">
      <TopBar
        wallet={wallet}
        activityOpen={activityOpen}
        onToggleActivity={() => (activityOpen ? setActivityOpen(false) : openActivity())}
        unseenActivity={unseenActivity}
      />

      <div className="relative flex-1 min-h-0">
        <ChatPanel
          onParsePrompt={parsePrompt}
          onSimulateRule={simulateRule}
          onActivateRule={activateRule}
          isExecuting={isExecuting}
          initialPrompt={initialPrompt}
        />

        <Drawer
          open={activityOpen}
          onOpenChange={setActivityOpen}
          side="right"
          ariaLabel="Activity"
          className="w-[420px] bg-gray-900 border-white/[0.06]"
        >
          <AuditDashboard
            audit={audit}
            onRefresh={refreshAudit}
            isRefreshing={auditFetching}
            onDisableRule={disableRule}
            onEnableRule={enableRule}
            onClose={() => setActivityOpen(false)}
          />
        </Drawer>
      </div>
    </main>
  );
}
