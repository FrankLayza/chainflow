"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Drawer } from '@/components/motion/drawer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AuditDashboard } from '@/components/dashboard/AuditDashboard';
import { ToastProvider, toast } from '@/components/godui/toast';
import { toReceipt } from '@/lib/receipt';
import { truncateAddress } from '@/lib/format';
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

  // Execution ids already known to this tab, seeded from each audit load. The
  // cron evaluator writes fired transfers into the arming session's ledger, so a
  // light poll diffing this set is what turns a cron fire into a toast.
  const knownExecutionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (audit.kind !== 'ready') return;
    for (const e of audit.data.executions) knownExecutionIds.current.add(e.id);
  }, [audit]);

  // Poll for cron-fired executions. Nothing pushes them to the browser — the
  // cron route has no event channel — so we diff the audit feed every 10s and
  // toast anything new that the current tab did not itself broadcast. The first
  // successful response seeds the baseline without toasting so pre-existing
  // executions never fire on mount.
  const seeded = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const diff = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch('/api/audit-logs');
        const data = await readJson(res);
        if (!res.ok || !data?.success || cancelled) return;

        const executions = (data?.executions ?? []) as AuditData['executions'];

        if (!seeded.current) {
          for (const e of executions) knownExecutionIds.current.add(e.id);
          seeded.current = true;
          return;
        }

        const fresh = executions.filter((e) => !knownExecutionIds.current.has(e.id));
        if (fresh.length === 0) return;

        for (const e of fresh) knownExecutionIds.current.add(e.id);

        for (const execution of fresh) {
          toast.success({
            title: 'Rule executed',
            description: `${execution.amount} ETH → ${truncateAddress(execution.recipientAddress)} · ${
              execution.txHash ? 'confirmed' : 'pending'
            }`,
            action: execution.explorerUrl
              ? {
                  label: 'View tx',
                  onClick: () => window.open(execution.explorerUrl, '_blank', 'noopener'),
                }
              : undefined,
          });
        }

        setAuditRefreshKey((key) => key + 1);
        setUnseenActivity(true);
      } catch {
        // Poll failures are expected to be transient; the next tick retries.
      }
    };

    diff();
    const id = window.setInterval(diff, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
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

        // The audit record just created is not "fresh" to the poll — toast it
        // now via the receipt card in chat, never again from the cron diff.
        if (data?.record?.id) knownExecutionIds.current.add(data.record.id);

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
    <>
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
      <ToastProvider position="bottom-right" />
    </>
  );
}
