import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeTransfer } from '@/lib/keeperhub/client';
import { DEFAULT_CHAIN_ID } from '@/lib/keeperhub/config';
import { broadcastTransfer } from '@/lib/keeperhub/broadcast';
import { registerActiveRule } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';
import { ParsedRule } from '@/types/rule';

const DEFERRED_TRIGGERS = new Set(['PRICE_BELOW', 'PRICE_ABOVE', 'SCHEDULED_INTERVAL']);

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

    // Scheduled and price rules do not broadcast on confirmation — they arm and
    // let the cron evaluator fire the transfer when the schedule or price
    // condition is met. Any other rule executes immediately.
    if (DEFERRED_TRIGGERS.has(rule.ruleType)) {
      const activeRule = await registerActiveRule(rule, sessionId);
      const message =
        rule.ruleType === 'SCHEDULED_INTERVAL'
          ? `Rule armed. Will transfer ${transferAmount} ${rule.parameters.tokenSymbol || 'ETH'} every ${rule.parameters.intervalHours ?? 'N'} hours.`
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
