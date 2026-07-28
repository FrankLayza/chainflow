export interface PresetRule {
  id: string;
  title: string;
  category: 'sweep' | 'price' | 'scheduled';
  promptText: string;
  iconName: string;
  description: string;
}

export const PRESET_RULES: PresetRule[] = [
  {
    id: 'preset-balance-sweep',
    title: 'Balance Sweep',
    category: 'sweep',
    promptText: 'If my wallet balance exceeds 0.05 ETH, sweep 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 on Sepolia',
    iconName: 'ArrowUpRight',
    description: 'Auto-transfer excess ETH when balance threshold is reached',
  },
  {
    id: 'preset-price-trigger',
    title: 'Price Alert Trigger',
    category: 'price',
    promptText: 'If ETH price drops below $2500, send 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 as a testnet hedge trigger',
    iconName: 'TrendingDown',
    description: 'Execute automated trade/transfer on price dips',
  },
  {
    id: 'preset-scheduled-transfer',
    title: 'Scheduled Transfer',
    category: 'scheduled',
    promptText: 'Send 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 every 24 hours',
    iconName: 'Clock',
    description: 'Recurring automated transfer on a fixed schedule',
  },
];
