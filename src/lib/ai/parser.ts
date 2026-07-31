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

  // If OPENAI_API_KEY is available, use Vercel AI SDK generateObject
  if (process.env.OPENAI_API_KEY) {
    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: ParsedRuleSchema,
        system: `You are an expert Web3 Automation Rule Parser for ChainFlow (powered by KeeperHub).
Your task is to parse the user's natural language input into a structured rule object.

STRICT MVP BOUNDARIES:
1. Supported Rule Types (ruleType):
   - BALANCE_ABOVE: Triggers when wallet balance exceeds a threshold.
   - PRICE_BELOW: Triggers when asset price drops below a threshold.
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

  // Requirement 1: Require an EVM address
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
  let ruleType: 'BALANCE_ABOVE' | 'PRICE_BELOW' | 'SCHEDULED_INTERVAL';
  let thresholdAmount = '0';
  let explanation = '';

  const isPrice = /price|drops|below|\$/i.test(trimmed);
  const isScheduled = /every|hours|schedule|daily|recurring/i.test(trimmed);
  const isBalance = /exceeds|above|greater than|balance/i.test(trimmed);

  if (isPrice) {
    ruleType = 'PRICE_BELOW';
    const priceMatch = trimmed.match(/(?:below|under|\$)\s*([0-9,.]+)/i);
    if (!priceMatch) throw new Error('Could not detect the price threshold (e.g., "$2500").');
    thresholdAmount = priceMatch[1].replace(/,/g, '');
    explanation = `When ETH price drops below $${thresholdAmount}, trigger a safety transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  } else if (isScheduled) {
    ruleType = 'SCHEDULED_INTERVAL';
    const timeMatch = trimmed.match(/([0-9]+)\s*(?:hours|days)/i);
    thresholdAmount = timeMatch ? timeMatch[1] : '24';
    explanation = `Automatically execute a transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} every ${thresholdAmount} hours via KeeperHub.`;
  } else if (isBalance) {
    ruleType = 'BALANCE_ABOVE';
    const balMatch = trimmed.match(/(?:exceeds|above|greater than|>)\s*([0-9.]+)/i);
    if (!balMatch) throw new Error('Could not detect the balance threshold (e.g., "exceeds 1.5").');
    thresholdAmount = balMatch[1];
    explanation = `When demo wallet balance exceeds ${thresholdAmount} ETH, automatically transfer ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  } else {
    throw new Error('Unsupported Rule. ChainFlow Demo only supports: Balance thresholds, Price drops, and Scheduled transfers.');
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
