import { z } from 'zod';
import { TriggerTypeSchema } from '@/types/rule';

type TriggerType = z.infer<typeof TriggerTypeSchema>;

/**
 * The arm-vs-broadcast axis, defined once. Price and scheduled rules cannot
 * broadcast at confirmation time — they need a trigger, so confirmation arms
 * them and the cron evaluator fires them later. Every other rule broadcasts
 * immediately. Card UI, the execute route, and the cron evaluator all decide
 * from this single interface instead of re-declaring the set.
 */
const DEFERRED_TRIGGERS = new Set<TriggerType>([
  'PRICE_BELOW',
  'PRICE_ABOVE',
  'SCHEDULED_INTERVAL',
]);

export type RuleDisposition = 'arm' | 'broadcast';

export function disposition(ruleType: string): RuleDisposition {
  return DEFERRED_TRIGGERS.has(ruleType as TriggerType) ? 'arm' : 'broadcast';
}

export function isDeferred(ruleType: string): boolean {
  return disposition(ruleType) === 'arm';
}