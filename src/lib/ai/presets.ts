export interface PresetRule {
  id: string;
  title: string;
  category: 'transfer' | 'scheduled' | 'price' | 'balance';
  promptText: string;
  iconName: string;
  description: string;
}

export const PRESET_RULES: PresetRule[] = [
  {
    id: 'preset-quick-transfer',
    title: 'Quick Transfer',
    category: 'transfer',
    promptText: 'Transfer 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
    iconName: 'ArrowUpRight',
    description: 'Send 0.0001 ETH immediately to the test address',
  },
  {
    id: 'preset-test-transfer',
    title: 'Test Transfer',
    category: 'transfer',
    promptText: 'Send 0.001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
    iconName: 'ArrowUpRight',
    description: 'Send 0.001 ETH immediately to the test address',
  },
  {
    id: 'preset-large-transfer',
    title: 'Larger Transfer',
    category: 'transfer',
    promptText: 'Transfer 0.01 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
    iconName: 'ArrowUpRight',
    description: 'Send 0.01 ETH immediately to the test address',
  },
  {
    id: 'preset-recurring',
    title: 'Recurring Transfer',
    category: 'scheduled',
    promptText: 'Send 0.001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 every 2 minutes',
    iconName: 'RefreshCw',
    description: 'Arms a rule that fires every 2 minutes via the cron evaluator',
  },
  {
    id: 'preset-price-bounce',
    title: 'Price Alert Transfer',
    category: 'price',
    promptText: 'If ETH price drops below $2400, send 0.001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
    iconName: 'TrendingDown',
    description: 'Arms a rule that fires 0.001 ETH when ETH drops below $2,400',
  },
  {
    id: 'preset-balance-trigger',
    title: 'Balance Trigger Transfer',
    category: 'balance',
    promptText: 'Send 0.001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 when balance exceeds 2 ETH',
    iconName: 'Wallet',
    description: 'Arms a rule that fires 0.001 ETH when the wallet balance exceeds 2 ETH',
  },
];
