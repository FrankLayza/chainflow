import { NextRequest, NextResponse } from 'next/server';
import {
  getQueuedActiveRules,
  updateActiveRule,
  claimScheduledFire,
  ActiveRule,
} from '@/repositories/audit-repository';
import { broadcastTransfer } from '@/lib/keeperhub/broadcast';
import { getTokenUsdPrice } from '@/lib/coingecko';
import { ParsedRule, ParsedRuleSchema } from '@/types/rule';
import { formatInterval } from '@/lib/format';
import { checkSufficientBalance } from '@/lib/keeperhub/balance';

export const maxDuration = 60;

/**
 * Trigger guard — the route must never be callable as an open endpoint. Ways
 * in: Vercel's built-in cron header, a bearer CRON_SECRET header, a matching
 * `?token=` query param (for schedulers that cannot send custom headers), or no
 * secret configured at all (local development only).
 */
function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron') === '1') return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const bearer = request.headers.get('authorization')?.trim();
  if (bearer === `Bearer ${secret}`) return true;

  const queryToken = request.nextUrl.searchParams.get('token');
  return queryToken === secret;
}

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

interface RuleCheck {
  id: string;
  ruleType: string;
  fired: boolean;
  price?: number;
  message: string;
}

function parseRule(rule: ActiveRule): ParsedRule | null {
  try {
    const parameters = JSON.parse(rule.parameters_json || '{}');
    return ParsedRuleSchema.parse({
      id: rule.id,
      rawInput: rule.raw_input,
      ruleType: rule.rule_type,
      actionType: rule.action_type,
      parameters,
      explanation: rule.explanation,
      network: rule.network,
    });
  } catch (error: any) {
    console.warn(`Invalid stored rule ${rule.id}:`, error?.message);
    return null;
  }
}

async function evaluateScheduled(rule: ActiveRule, parsed: ParsedRule): Promise<RuleCheck> {
  const base: RuleCheck = {
    id: rule.id,
    ruleType: rule.rule_type,
    fired: false,
    message: '',
  };

  const interval = formatInterval(parsed.parameters);
  const intervalMinutes = parsed.parameters.intervalMinutes;
  const intervalHours = parsed.parameters.intervalHours;
  const intervalMs =
    intervalMinutes != null
      ? intervalMinutes * MINUTE_MS
      : intervalHours != null
        ? intervalHours * HOUR_MS
        : Number.NaN;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    await updateActiveRule(rule.id, { status: 'FAILED' });
    return { ...base, message: 'Invalid interval; rule disabled.' };
  }

  const lastExec = rule.last_executed_at ? Date.parse(rule.last_executed_at) : null;
  // A rule with no execution yet fires on its first tick, then once per
  // interval. The interval itself lives here, not in the scheduler, so any
  // pinger cadence (1 min, 5 min, hourly) is fine as long as it is finer than
  // the interval.
  const due = lastExec === null || Date.now() - lastExec >= intervalMs;

  if (!due) {
    await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
    return { ...base, message: `Not due yet (every ${interval}).` };
  }

  // Never broadcast what the wallet cannot cover. The rule stays ACTIVE so it
  // retries on a later tick once the balance is topped up.
  const guard = await checkSufficientBalance(parsed.parameters.transferAmount);
  if (!guard.ok) {
    await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
    return { ...base, message: `${guard.reason || 'Insufficient balance'} Skipped this fire.` };
  }

  // Optimistic claim: only the tick that flips last_executed_at wins the race,
  // so a scheduler retry cannot double-broadcast.
  const claimed = await claimScheduledFire(rule.id, rule.last_executed_at ?? null);
  if (!claimed) {
    await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
    return { ...base, message: 'Another tick claimed this fire; skipped.' };
  }

  await broadcastTransfer(parsed, rule.session_id, { markRuleTerminal: false });
  return { ...base, fired: true, message: `Recurring transfer fired (every ${interval}).` };
}

async function evaluatePrice(rule: ActiveRule, price: number): Promise<RuleCheck> {
  const base: RuleCheck = {
    id: rule.id,
    ruleType: rule.rule_type,
    fired: false,
    price,
    message: '',
  };

  const parsed = parseRule(rule);
  if (!parsed) {
    await updateActiveRule(rule.id, { status: 'FAILED' });
    return { ...base, message: 'Invalid stored rule; disabled.' };
  }

  const threshold = Number(parsed.parameters.thresholdAmount);
  if (!Number.isFinite(threshold)) {
    await updateActiveRule(rule.id, { status: 'FAILED' });
    return { ...base, message: 'Threshold is not a number; rule disabled.' };
  }

  const triggered = rule.rule_type === 'PRICE_BELOW' ? price < threshold : price > threshold;

  if (!triggered) {
    await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
    return {
      ...base,
      message: `${rule.rule_type} not triggered (ETH $${price} vs $${threshold}).`,
    };
  }

  // Refuse to broadcast an amount the wallet cannot cover. A price rule stays
  // ACTIVE and re-checks on the next tick.
  const guard = await checkSufficientBalance(parsed.parameters.transferAmount);
  if (!guard.ok) {
    await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
    return { ...base, message: `${guard.reason || 'Insufficient balance'} Skipped this fire.` };
  }

  await broadcastTransfer(parsed, rule.session_id);
  return {
    ...base,
    fired: true,
    message: `${rule.rule_type} fired (ETH $${price} vs $${threshold}); transfer broadcast.`,
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rules = await getQueuedActiveRules();

    const needsPrice = rules.some(
      (r) => r.rule_type === 'PRICE_BELOW' || r.rule_type === 'PRICE_ABOVE'
    );
    const price = needsPrice ? await getTokenUsdPrice('ethereum') : undefined;

    const results: RuleCheck[] = [];
    for (const rule of rules) {
      try {
        if (rule.rule_type === 'SCHEDULED_INTERVAL') {
          const parsed = parseRule(rule);
          if (!parsed) {
            await updateActiveRule(rule.id, { status: 'FAILED' });
            results.push({
              id: rule.id,
              ruleType: rule.rule_type,
              fired: false,
              message: 'Invalid stored rule; disabled.',
            });
          } else {
            results.push(await evaluateScheduled(rule, parsed));
          }
        } else if (rule.rule_type === 'PRICE_BELOW' || rule.rule_type === 'PRICE_ABOVE') {
          results.push(price !== undefined ? await evaluatePrice(rule, price) : {
            id: rule.id,
            ruleType: rule.rule_type,
            fired: false,
            message: 'Skipped: price feed unavailable.',
          });
        } else {
          await updateActiveRule(rule.id, { last_checked_at: new Date().toISOString() });
          results.push({
            id: rule.id,
            ruleType: rule.rule_type,
            fired: false,
            message: `${rule.rule_type} evaluation not wired; checked only.`,
          });
        }
      } catch (error: any) {
        console.error(`Cron eval failed for rule ${rule.id}:`, error?.message);
        try {
          await updateActiveRule(rule.id, { status: 'FAILED' });
        } catch {}
        results.push({
          id: rule.id,
          ruleType: rule.rule_type,
          fired: false,
          price,
          message: `Evaluation error: ${error?.message ?? 'unknown'}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      fired: results.filter((r) => r.fired).length,
      ethUsd: price,
      results,
    });
  } catch (error: any) {
    console.error('API /api/cron/check-rules error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron evaluation failed' },
      { status: 500 }
    );
  }
}
