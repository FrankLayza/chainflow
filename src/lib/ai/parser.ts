import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { ParsedRule, ParsedRuleSchema } from '@/types/rule';

interface ExtractedInterval {
  hours?: number;
  minutes?: number;
}

/** Pull "every 2 minutes / 30 mins / 6 hours / 3 days" from a prompt. Days are
    normalised to hours so the stored rule keeps a single unit pair, and the
    given "days" count becomes a real 24x multiplier (previously it was stored
    raw, turning "every 2 days" into "every 2 hours"). */
function extractInterval(input: string): ExtractedInterval | null {
  const match = input.match(/([0-9]+)\s*(days?|hours?|hrs?|minutes?|mins?)/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (/^days?$/i.test(match[2])) return { hours: value * 24 };
  if (/^(minutes?|mins?)$/i.test(match[2])) return { minutes: value };
  return { hours: value };
}

/**
 * Intelligent Rule Parser using Vercel AI SDK
 * Converts plain English prompt into a validated ParsedRule object using LLM structured output.
 * Falls back to deterministic parsing if no API key is present.
 */
export async function parseNaturalLanguageRule(input: string): Promise<ParsedRule> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Prompt input cannot be empty.');
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { object } = await generateObject({
        // gemini-2.5-flash is closed to new API keys and shuts down 2026-10-16.
        // Pinned rather than using a -latest alias: those track experimental
        // builds with tighter rate limits.
        model: google('gemini-3.6-flash'),
        schema: ParsedRuleSchema,
        system: `You are an expert Web3 Automation Rule Parser for ChainFlow (powered by KeeperHub).
Your task is to parse the user's natural language input into a structured rule object.

STRICT MVP BOUNDARIES:
1. Supported Rule Types (ruleType):
   - BALANCE_ABOVE: Triggers when wallet balance exceeds a threshold.
   - PRICE_BELOW: Triggers when a token price drops below a threshold (use the price number, e.g. "$2400").
   - PRICE_ABOVE: Triggers when a token price rises above a threshold (use the price number, e.g. "$2600").
   - SCHEDULED_INTERVAL: Triggers at a recurring time interval. Set intervalHours or intervalMinutes to match the unit the user used ("every 2 minutes" → intervalMinutes: 2, "every 6 hours" → intervalHours: 6). Never invent an interval the user did not state.

2. Supported Actions (actionType):
   - TRANSFER_TOKEN: Transfer native ETH or tokens.
   - SWEEP_WALLET: Sweep remaining balance.
   - TRIGGER_CONTRACT: Execute contract interaction.

3. EVM Address Requirement:
   - Target address MUST be a valid 40-character hexadecimal EVM address starting with 0x.

If the prompt asks for something out of scope or is missing a valid 0x address, make sure the explanation clearly states what is missing.`,
        prompt: trimmed,
      });

      // Post-LLM trigger guard ---------------------------------------------
      // Gemini has invented deferred triggers for bare transfers
      // ("send 0.001 eth to 0x…" became "every 24 hours", or a BALANCE_ABOVE
      // with the transfer amount copied into thresholdAmount). Recompute the
      // trigger-word cues deterministically and refuse any ruleType whose cue
      // the prompt never contained, coercing it back toward the immediate
      // transfer the user actually asked for.
      const hasScheduledCue =
        /every|hours?|hrs?|days?|schedule|daily|recurring|interval|weekly|monthly/i.test(
          trimmed,
        );
      const hasBalanceCue = /exceeds|greater than|balance/i.test(trimmed);
      const hasPriceCue =
        /\$/i.test(trimmed) ||
        /\bprice\b/i.test(trimmed) ||
        (!hasBalanceCue &&
          (/\b(?:trading|trades?|sits|goes)\s+(?:above|below)\b/i.test(trimmed) ||
            /\b(?:drops|falls|rises|surpasses)\b/i.test(trimmed)));

      const scheduledRequested = object.ruleType === 'SCHEDULED_INTERVAL';
      const priceRequested =
        object.ruleType === 'PRICE_BELOW' || object.ruleType === 'PRICE_ABOVE';

      let coerced = false;
      if (scheduledRequested && !hasScheduledCue) {
        object.ruleType = 'BALANCE_ABOVE';
        object.parameters.thresholdAmount = '0';
        object.parameters.intervalHours = undefined;
        coerced = true;
      } else if (priceRequested && !hasPriceCue) {
        // Solicited once, but keep the LLM's threshold so the number still
        // matches the prompt; a bare transfer gets the always-true threshold.
        object.ruleType = 'BALANCE_ABOVE';
        object.parameters.intervalHours = undefined;
        if (!hasBalanceCue) object.parameters.thresholdAmount = '0';
        coerced = true;
      } else if (object.ruleType === 'BALANCE_ABOVE' && !hasBalanceCue) {
        // Gemini labels a bare transfer as BALANCE_ABOVE and copies the amount
        // into thresholdAmount ("send 0.003 eth" → "exceeds 0.003"). With no
        // balance cue that threshold is invented, so flatten it to the
        // always-true zero threshold (fire immediately) — the same treatment
        // the deterministic parser gives a bare transfer.
        object.parameters.thresholdAmount = '0';
        object.parameters.intervalHours = undefined;
        object.parameters.intervalMinutes = undefined;
        coerced = true;
      }

      if (coerced) {
        object.explanation = `Immediately transfer ${object.parameters.transferAmount} ETH to ${object.parameters.targetAddress.slice(0, 6)}...${object.parameters.targetAddress.slice(-4)} via KeeperHub.`;
      }

      // The prompt is the authority on units: recompute the interval from the
      // original text so "every 2 minutes" can never arrive as 2 hours.
      if (object.ruleType === 'SCHEDULED_INTERVAL') {
        const interval = extractInterval(trimmed) ?? { hours: 24 };
        object.parameters.intervalHours = interval.hours;
        object.parameters.intervalMinutes = interval.minutes;
        object.parameters.thresholdAmount = String(
          interval.minutes != null ? interval.minutes : interval.hours ?? 24,
        );
      }

      return object;
    } catch (aiErr: any) {
      console.warn('Vercel AI SDK parsing failed, falling back to deterministic parser:', aiErr.message);
    }
  }

  // --- Fallback Deterministic Parser (No API Key Required) ---


  const addressMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (!addressMatch) {
    throw new Error('Missing target address. ChainFlow requires a valid Ethereum address (0x...) to execute transfers.');
  }
  const targetAddress = addressMatch[0];

  // Extract amount
  const amountMatch = trimmed.match(/(?:sweep|send|transfer|value of)\s+([0-9.]+)/i) ||
                       trimmed.match(/([0-9.]+)\s*(?:ETH|testnet ETH|tokens)/i);
  const transferAmount = amountMatch ? amountMatch[1] : '0.0001';

  // Requirement 2: Enforce MVP Rule Types
  let ruleType: 'BALANCE_ABOVE' | 'PRICE_BELOW' | 'PRICE_ABOVE' | 'SCHEDULED_INTERVAL';
  let thresholdAmount = '0';
  let explanation = '';

  // Balance wording vetoes generic price verbs ("balance goes above 1.5" is not
  // a price). Explicit cues — a $ sign or the word "price" — always win.
  const isBalance = /exceeds|greater than|balance/i.test(trimmed);
  const isPrice =
    /\$/i.test(trimmed) ||
    /\bprice\b/i.test(trimmed) ||
    (!isBalance &&
      (/\b(?:trading|trades?|sits|goes)\s+(?:above|below)\b/i.test(trimmed) ||
        /\b(?:drops|falls|rises|surpasses)\b/i.test(trimmed)));
  const isScheduled = /every|hours|schedule|daily|recurring/i.test(trimmed);

  if (isPrice) {
    // "above" phrasing wins only when it is clearly a price ceiling ("rises
    // above", "price goes above $X", "$X and rising"). A bare "above" leans
    // balance in most prompts, but inside price language it means PRICE_ABOVE.
    const priceAbove = /rises (above|to)|price.*goes above|price.*surpasses|above\s+\$|\$\s*[0-9.,]+\s*(?:and )?rising|trading above|trades? above|price above|moves above|surpasses/i.test(trimmed);
    ruleType = priceAbove ? 'PRICE_ABOVE' : 'PRICE_BELOW';
    const thresholdMatch = trimmed.match(
      /(?:below|above|under|drops to|rises to|surpasses|trading)\s*\$?\s*([0-9,.]+)/i
    ) || trimmed.match(/\$\s*([0-9,.]+)/i);
    if (!thresholdMatch) throw new Error('Could not detect the price threshold (e.g., "$2500").');
    thresholdAmount = thresholdMatch[1].replace(/,/g, '');
    explanation =
      ruleType === 'PRICE_ABOVE'
        ? `When ETH price rises above $${thresholdAmount}, trigger a safety transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`
        : `When ETH price drops below $${thresholdAmount}, trigger a safety transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  } else if (isScheduled) {
    ruleType = 'SCHEDULED_INTERVAL';
    const interval = extractInterval(trimmed) ?? { hours: 24 };
    thresholdAmount = String(
      interval.minutes != null ? interval.minutes : interval.hours ?? 24,
    );
    explanation =
      interval.minutes != null
        ? `Automatically execute a transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} every ${interval.minutes} minutes via KeeperHub.`
        : `Automatically execute a transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} every ${interval.hours ?? 24} hours via KeeperHub.`;
  } else if (isBalance) {
    ruleType = 'BALANCE_ABOVE';
    const balMatch = trimmed.match(/(?:exceeds|above|greater than|>)\s*([0-9.]+)/i);
    if (!balMatch) throw new Error('Could not detect the balance threshold (e.g., "exceeds 1.5").');
    thresholdAmount = balMatch[1];
    explanation = `When demo wallet balance exceeds ${thresholdAmount} ETH, automatically transfer ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  } else {
    // A bare "transfer X to 0x…" carries no trigger word, but it is the most
    // common request and every preset is phrased that way. Treat it as fire-now
    // rather than rejecting it: a zero balance threshold is always satisfied.
    ruleType = 'BALANCE_ABOVE';
    thresholdAmount = '0';
    explanation = `Immediately transfer ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  }

  const scheduledInterval =
    ruleType === 'SCHEDULED_INTERVAL' ? (extractInterval(trimmed) ?? { hours: 24 }) : undefined;

  const rawRule = {
    id: crypto.randomUUID(),
    rawInput: trimmed,
    ruleType,
    actionType: 'TRANSFER_TOKEN' as const,
    parameters: {
      thresholdAmount,
      targetAddress,
      transferAmount,
      tokenSymbol: 'ETH',
      intervalHours: scheduledInterval?.hours,
      intervalMinutes: scheduledInterval?.minutes,
    },
    explanation,
    network: 'Ethereum Sepolia',
  };

  return ParsedRuleSchema.parse(rawRule);
}
