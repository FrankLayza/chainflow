import crypto from 'crypto';
import { DEFAULT_CHAIN_ID, NETWORK_LABEL, explorerUrl as txExplorerUrl } from '@/lib/keeperhub/config';
import { McpExecutor, RestExecutor } from '@/lib/keeperhub/executor';
import {
  addAuditEvent,
  createAuditRecord,
  registerActiveRule,
  updateActiveRule,
  RecordStatus,
} from '@/repositories/audit-repository';
import { ParsedRule } from '@/types/rule';

export interface BroadcastResult {
  executionId: string | null;
  record: Awaited<ReturnType<typeof createAuditRecord>>;
  viaMcp: boolean;
  khResponse: Record<string, unknown> | null;
}

export interface BroadcastOptions {
  /**
   * One-shot rules (immediate transfers, price-triggered) are re-registered and
   * then marked COMPLETED/FAILED so the cron never re-fires them. Recurring
   * rules (SCHEDULED_INTERVAL) must stay ACTIVE and keep their cadence, so the
   * caller handles scheduling and passes false here.
   */
  markRuleTerminal?: boolean;
}

/**
 * Broadcasts one rule's transfer through a TransferExecutor — MCP first, REST
 * fallback — persists the audit record + event, and — for one-shot rules —
 * marks the active rule terminal so the cron evaluator never re-fires it. Works
 * with or without a browser session: the cron passes the rule's own session_id
 * so a triggered execution appears in the dashboard of whoever armed it.
 */
export async function broadcastTransfer(
  rule: ParsedRule,
  sessionId?: string,
  options: BroadcastOptions = {}
): Promise<BroadcastResult> {
  const { markRuleTerminal = true } = options;
  const { targetAddress, transferAmount } = rule.parameters;
  const idempotencyKey = crypto.randomUUID();

  // Capture the id registerActiveRule actually used. LLM-parsed rules carry no
  // `rule.id`, so registerActiveRule mints its own — and updateActiveRule then
  // needs that id, not `rule.id ?? record.id`, or the one-shot row is left
  // ACTIVE forever (and the cron re-fires a threshold-0 BALANCE_ABOVE).
  let activeRuleId: string | null = null;
  if (markRuleTerminal) {
    activeRuleId = (await registerActiveRule(rule, sessionId)).id;
  }

  let khResponse: Record<string, unknown> | null = null;
  let viaMcp = true;
  let executionId: string | null = null;
  let txHash: string | null = null;
  let explorerUrl: string | null = null;
  let gasUsed: number | null = null;
  let sponsored: boolean | null = null;

  // MCP first, REST fallback. Both satisfy the TransferExecutor seam, so the
  // orchestration below never touches a concrete transport.
  let executor = new McpExecutor();
  try {
    const result = await executor.executeTransfer({
      chainId: DEFAULT_CHAIN_ID,
      targetAddress,
      amount: transferAmount,
      idempotencyKey,
    });
    executionId = result.executionId;
    txHash = result.transactionHash;
    explorerUrl = result.transactionLink;
    gasUsed = result.gasUsed;
    sponsored = result.sponsored;
    khResponse = result as unknown as Record<string, unknown>;
  } catch (mcpError: any) {
    console.warn('MCP execution failed, falling back to REST:', mcpError.message);
    viaMcp = false;
    executor = new RestExecutor();
    const result = await executor.executeTransfer({
      chainId: DEFAULT_CHAIN_ID,
      targetAddress,
      amount: transferAmount,
      idempotencyKey,
    });
    executionId = result.executionId || 'ext-' + Date.now();
    txHash = result.transactionHash;
    explorerUrl = result.transactionLink;
    gasUsed = result.gasUsed;
    sponsored = result.sponsored;
    khResponse = result as unknown as Record<string, unknown>;
  }

  // A transaction hash is the only evidence this reached the chain. Poll once;
  // a scheduler retry or the audit reconciler can settle it later.
  if (executionId && !txHash) {
    try {
      const status = await executor.getExecutionStatus(executionId);
      txHash = status.transactionHash ?? txHash;
      explorerUrl = status.transactionLink ?? explorerUrl;
      gasUsed = status.gasUsed ?? gasUsed;
      sponsored = status.sponsored ?? sponsored;
      khResponse = status as unknown as Record<string, unknown>;
    } catch (error: any) {
      console.warn('Initial status poll warning:', error?.message);
    }
  }

  const finalStatus: RecordStatus = txHash ? 'CONFIRMED' : 'PENDING';

  const record = await createAuditRecord({
    id: executionId || 'ext-' + Date.now(),
    session_id: sessionId,
    idempotency_key: idempotencyKey,
    raw_input: rule.rawInput,
    parsed_rule_json: JSON.stringify(rule),
    network: rule.network || NETWORK_LABEL,
    keeperhub_execution_id: executionId || undefined,
    status: finalStatus,
    transaction_hash: txHash || undefined,
    explorer_url: explorerUrl || (txHash ? txExplorerUrl(DEFAULT_CHAIN_ID, txHash) : undefined),
    gas_used: gasUsed ? `${gasUsed} units` : undefined,
    sponsored: sponsored ?? true,
    recipient_address: targetAddress,
    amount: transferAmount,
    chain_id: DEFAULT_CHAIN_ID,
  });

  await addAuditEvent(
    record.id,
    finalStatus,
    `Execution ${viaMcp ? 'via KeeperHub MCP' : 'via KeeperHub REST (MCP fallback)'}. Tx: ${txHash || 'pending'}`
  );

  if (markRuleTerminal && activeRuleId) {
    try {
      await updateActiveRule(activeRuleId, {
        status: txHash ? 'COMPLETED' : 'FAILED',
        last_executed_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.warn('Failed to mark active rule terminal:', error?.message);
    }
  }

  return { executionId, record, viaMcp, khResponse };
}
