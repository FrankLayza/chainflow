import { ExecutionRecord, ParsedRule } from '@/types/rule';

// Global memory store for rules and audit logs (survives dev hot-reloads)
const globalStore = globalThis as unknown as {
  __chainflow_rules?: ParsedRule[];
  __chainflow_executions?: ExecutionRecord[];
};

if (!globalStore.__chainflow_rules) {
  globalStore.__chainflow_rules = [];
}

if (!globalStore.__chainflow_executions) {
  // Pre-seed with the initial verified spike execution for instant audit proof!
  globalStore.__chainflow_executions = [
    {
      id: 'w3jy3s3vt07q8dacxfn20',
      rawInput: 'If wallet balance > 0.05 ETH, transfer 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
      timestamp: '2026-07-28 21:08:50 UTC',
      status: 'CONFIRMED',
      txHash: '0x5b67746e7c5f62da2edc41055dfa9828ea578754748174b47513d99696b4e471',
      explorerUrl: 'https://sepolia.etherscan.io/tx/0x5b67746e7c5f62da2edc41055dfa9828ea578754748174b47513d99696b4e471',
      gasUsed: '77119 units',
      sponsored: true,
      recipientAddress: '0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1',
      amount: '0.0001',
      chainId: 11155111,
    },
  ];
}

export function saveRule(rule: ParsedRule): ParsedRule {
  globalStore.__chainflow_rules!.unshift(rule);
  return rule;
}

export function getActiveRules(): ParsedRule[] {
  return globalStore.__chainflow_rules!;
}

export function saveExecutionRecord(record: ExecutionRecord): ExecutionRecord {
  globalStore.__chainflow_executions!.unshift(record);
  return record;
}

export function getExecutionRecords(): ExecutionRecord[] {
  return globalStore.__chainflow_executions!;
}
