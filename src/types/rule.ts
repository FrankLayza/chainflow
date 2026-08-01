import { z } from 'zod';

export const TriggerTypeSchema = z.enum(['BALANCE_ABOVE', 'PRICE_BELOW', 'SCHEDULED_INTERVAL']);

export const ActionTypeSchema = z.enum(['TRANSFER_TOKEN', 'SWEEP_WALLET', 'TRIGGER_CONTRACT']);

export const ParsedRuleSchema = z.object({
  id: z.string().uuid().optional(),
  rawInput: z.string(),
  ruleType: TriggerTypeSchema,
  actionType: ActionTypeSchema,
  parameters: z.object({
    thresholdAmount: z.string().describe('Numeric value e.g. "2.0" or price threshold "2500"'),
    targetAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address'),
    transferAmount: z.string().describe('Amount to transfer e.g. "0.0001"'),
    tokenSymbol: z.string().default('ETH'),
    intervalHours: z.number().optional().describe('Interval in hours for scheduled triggers'),
  }),
  explanation: z.string().describe('Plain English summary of what will happen'),
  network: z.string().default('Ethereum Sepolia'),
});

export type ParsedRule = z.infer<typeof ParsedRuleSchema>;

export interface ExecutionRecord {
  id: string;
  ruleId?: string;
  rawInput: string;
  timestamp: string;
  status: 'PENDING' | 'SIMULATED' | 'EXECUTING' | 'CONFIRMED' | 'FAILED' | 'RETRYING';
  txHash?: string;
  explorerUrl?: string;
  gasUsed?: string;
  sponsored?: boolean;
  errorMessage?: string;
  recipientAddress: string;
  amount: string;
  chainId: number;
}

export interface RuleSimulation {
  status: string;
  passed: boolean;
  wouldRevert: boolean;
  gasEstimate?: number | null;
  gasEstimateUsd?: number | null;
  from?: string | null;
  to?: string | null;
  amount: string;
  sponsored: boolean;
}

export interface ExecutionReceipt {
  executionId?: string;
  status: string;
  txHash?: string;
  explorerUrl?: string;
  gasUsed?: string;
  viaMcp: boolean;
}

export interface WalletInfo {
  id: string;
  address?: string;
  name?: string;
}

export interface AuditData {
  rules: ParsedRule[];
  executions: ExecutionRecord[];
}

/**
 * A boolean `isSimulating` had no value for "not simulating, but no result
 * either", which is what let a failed simulation leave a spinner running
 * forever. The union closes that hole.
 */
export type SimState =
  | { phase: 'simulating' }
  | { phase: 'done'; simulation: RuleSimulation }
  | { phase: 'error'; message: string };

/**
 * Tracked per message, not per panel: a global flag flips back to idle when the
 * request settles and re-arms the button on a card that has already broadcast.
 */
export type ExecState = 'idle' | 'confirming' | 'executing' | 'done' | 'failed';
