/**
 * store.ts — thin facade that delegates to the audit repository.
 * Async throughout since the repository moved to libSQL.
 */
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import {
  legacySaveExecution,
  legacyGetExecutions,
  registerActiveRule,
  listAllRules,
  updateActiveRule,
  updateAuditRecord,
  type ActiveRule,
} from '@/repositories/audit-repository';

export {
  registerActiveRule,
  getQueuedActiveRules,
  updateActiveRule,
  updateAuditRecord,
  addAuditEvent,
  createAuditRecord,
  listAuditRecords,
  getAuditRecord,
  listPendingExecutions,
} from '@/repositories/audit-repository';

export async function saveRule(rule: ParsedRule, sessionId?: string): Promise<ParsedRule> {
  await registerActiveRule(rule, sessionId);
  return rule;
}

export async function getActiveRules(sessionId?: string): Promise<ActiveRule[]> {
  return listAllRules(sessionId);
}

export async function saveExecutionRecord(record: ExecutionRecord): Promise<ExecutionRecord> {
  await legacySaveExecution(record);
  return record;
}

export async function getExecutionRecords(sessionId?: string): Promise<ExecutionRecord[]> {
  return legacyGetExecutions(sessionId);
}

export async function updateRule(
  id: string,
  patch: Partial<Pick<ActiveRule, 'status' | 'last_checked_at' | 'last_executed_at'>>
): Promise<void> {
  await updateActiveRule(id, patch);
}

export async function updateExecutionRecord(
  id: string,
  patch: Partial<ExecutionRecord>
): Promise<void> {
  await updateAuditRecord(id, {
    status: patch.status as any,
    transaction_hash: patch.txHash,
    explorer_url: patch.explorerUrl,
    gas_used: patch.gasUsed,
    error_message_safe: patch.errorMessage,
  });
}
