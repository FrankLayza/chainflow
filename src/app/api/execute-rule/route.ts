import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeTransfer } from '@/lib/keeperhub/client';
import { DEFAULT_CHAIN_ID } from '@/lib/keeperhub/config';
import { broadcastTransfer } from '@/lib/keeperhub/broadcast';
import { checkSufficientBalance } from '@/lib/keeperhub/balance';
import { registerActiveRule, countActiveRules } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { isDeferred } from '@/lib/rule-disposition';
import { ParsedRule } from '@/types/rule';
import { formatInterval } from '@/lib/format';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rule, simulate } = body as { rule: ParsedRule; simulate?: boolean };

    if (!rule || !rule.parameters) {
      return NextResponse.json(
        { error: 'Valid rule with parameters is required' },
        { status: 400 }
      );
    }

    const sessionId = await resolveSessionId();
    const { targetAddress, transferAmount } = rule.parameters;

    // Deferred triggers do not broadcast on confirmation — they arm and let the
    // cron evaluator fire the transfer when the condition is met. Any other
    // rule executes immediately.
    if (isDeferred(rule.ruleType)) {
      const activeCount = await countActiveRules(sessionId);
      if (activeCount >= LIMITS.activeRules) {
        return NextResponse.json(
          { error: `Active rule limit (${LIMITS.activeRules}) reached for this session.` },
          { status: 429 }
        );
      }

      const activeRule = await registerActiveRule(rule, sessionId);
      const message =
        rule.ruleType === 'SCHEDULED_INTERVAL'
          ? `Rule armed. Will transfer ${transferAmount} ${rule.parameters.tokenSymbol || 'ETH'} every ${formatInterval(rule.parameters)}.`
          : `Rule armed. Will transfer ${transferAmount} ${rule.parameters.tokenSymbol || 'ETH'} when the price crosses the threshold.`;
      return NextResponse.json({
        success: true,
        registered: true,
        message,
        activeRule,
      });
    }

    if (simulate) {
      const khResponse = await executeTransfer(
        {
          chainId: DEFAULT_CHAIN_ID,
          recipientAddress: targetAddress,
          amount: transferAmount,
          simulate: true,
        },
        crypto.randomUUID()
      );

      return NextResponse.json({
        success: true,
        status: 'SIMULATED',
        khResponse,
      });
    }

    const cooldown = await checkRateLimit(
      sessionId,
      'broadcast-cooldown',
      1,
      LIMITS.broadcastCooldownMs
    );
    if (!cooldown.ok) {
      return NextResponse.json(
        {
          error: 'Broadcast rate limited: please wait before sending another transfer.',
          retryAfterMs: cooldown.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const budget = await checkRateLimit(sessionId, 'broadcast-budget', LIMITS.broadcastsPerHour, 3600_000);
    if (!budget.ok) {
      return NextResponse.json(
        {
          error: `Broadcast limit reached (${LIMITS.broadcastsPerHour}/hour).`,
          retryAfterMs: budget.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const guard = await checkSufficientBalance(transferAmount);
    if (!guard.ok) {
      throw new Error(guard.reason || 'Insufficient balance to execute this transfer.');
    }

    const { record, viaMcp, khResponse, executionId } = await broadcastTransfer(rule, sessionId);

    return NextResponse.json({
      success: true,
      executionId,
      record,
      viaMcp,
      khResponse,
    });
  } catch (error: any) {
    console.error('API /execute-rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
