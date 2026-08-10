import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { ParsedRule, ParsedRuleSchema } from '@/types/rule';

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
   - SCHEDULED_INTERVAL: Triggers at a recurring time interval in hours.

2. Supported Actions (actionType):
   - TRANSFER_TOKEN: Transfer native ETH or tokens.
   - SWEEP_WALLET: Sweep remaining balance.
   - TRIGGER_CONTRACT: Execute contract interaction.

3. EVM Address Requirement:
   - Target address MUST be a valid 40-character hexadecimal EVM address starting with 0x.

If the prompt asks for something out of scope or is missing a valid 0x address, make sure the explanation clearly states what is missing.`,
        prompt: trimmed,
      });

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
    const timeMatch = trimmed.match(/([0-9]+)\s*(?:hours?|hrs?|days?)/i);
    thresholdAmount = timeMatch ? timeMatch[1] : '24';
    explanation = `Automatically execute a transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} every ${thresholdAmount} hours via KeeperHub.`;
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
      intervalHours: ruleType === 'SCHEDULED_INTERVAL' ? parseInt(thresholdAmount) : undefined,
    },
    explanation,
    network: 'Ethereum Sepolia',
  };

  return ParsedRuleSchema.parse(rawRule);
}
