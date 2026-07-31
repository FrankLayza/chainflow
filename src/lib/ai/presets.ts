export interface PresetRule {
  id: string;
  title: string;
  category: 'transfer';
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
];
