import { NextResponse } from 'next/server';
import { broadcastTransfer } from '@/lib/keeperhub/broadcast';
import { checkSufficientBalance } from '@/lib/keeperhub/balance';
import { registerActiveRule, countActiveRules } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { isDeferred } from '@/lib/rule-disposition';
import { ParsedRuleSchema } from '@/types/rule';
import { formatInterval } from '@/lib/format';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = ParsedRuleSchema.safeParse((body as { rule?: unknown }).rule);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid rule' },
        { status: 400 }
      );
    }
    const rule = parsed.data;

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
