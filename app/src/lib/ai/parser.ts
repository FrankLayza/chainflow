import { ParsedRule, ParsedRuleSchema } from '@/types/rule';

/**
 * Intelligent Rule Parser
 * Converts plain English prompt into a validated ParsedRule object.
 */
export async function parseNaturalLanguageRule(input: string): Promise<ParsedRule> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Prompt input cannot be empty');
  }

  // Extract EVM address (default fallback if none found in text)
  const addressMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  const targetAddress = addressMatch
    ? addressMatch[0]
    : '0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1'; // Spike recipient fallback

  // Extract amount
  const amountMatch = trimmed.match(/(?:sweep|send|transfer|value of)\s+([0-9.]+)/i) ||
                       trimmed.match(/([0-9.]+)\s*(?:ETH|testnet ETH)/i);
  const transferAmount = amountMatch ? amountMatch[1] : '0.0001';

  // Determine Rule Type
  let ruleType: 'BALANCE_ABOVE' | 'PRICE_BELOW' | 'SCHEDULED_INTERVAL' = 'BALANCE_ABOVE';
  let thresholdAmount = '0.05';

  if (/price|drops|below|\$/i.test(trimmed)) {
    ruleType = 'PRICE_BELOW';
    const priceMatch = trimmed.match(/(?:below|under|\$)\s*([0-9,.]+)/i);
    thresholdAmount = priceMatch ? priceMatch[1].replace(/,/g, '') : '2500';
  } else if (/every|hours|schedule|daily|recurring/i.test(trimmed)) {
    ruleType = 'SCHEDULED_INTERVAL';
    thresholdAmount = '24';
  } else {
    const balMatch = trimmed.match(/(?:exceeds|above|greater than|>)\s*([0-9.]+)/i);
    if (balMatch) {
      thresholdAmount = balMatch[1];
    }
  }

  // Generate plain English explanation
  let explanation = '';
  if (ruleType === 'BALANCE_ABOVE') {
    explanation = `When demo wallet balance exceeds ${thresholdAmount} ETH, automatically transfer ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} on Ethereum Sepolia via KeeperHub.`;
  } else if (ruleType === 'PRICE_BELOW') {
    explanation = `When ETH price drops below $${thresholdAmount}, trigger a safety transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} via KeeperHub.`;
  } else {
    explanation = `Automatically execute a transfer of ${transferAmount} ETH to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} every ${thresholdAmount} hours via KeeperHub.`;
  }

  const rawParsed = {
    id: crypto.randomUUID(),
    rawInput: trimmed,
    ruleType,
    actionType: 'TRANSFER_TOKEN' as const,
    parameters: {
      thresholdAmount,
      targetAddress,
      transferAmount,
      tokenSymbol: 'ETH',
      intervalHours: ruleType === 'SCHEDULED_INTERVAL' ? Number(thresholdAmount) : undefined,
    },
    explanation,
    network: 'Ethereum Sepolia (Chain ID 11155111)',
  };

  // Validate with Zod schema
  return ParsedRuleSchema.parse(rawParsed);
}
