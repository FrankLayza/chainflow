/**
 * store.ts — thin facade that delegates to the SQLite audit repository.
 * Preserves the original API surface so existing route handlers need no changes.
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

// ---------------------------------------------------------------------------
// Re-export repository helpers needed by the evaluator engine directly
// ---------------------------------------------------------------------------
export {
  registerActiveRule,
  getQueuedActiveRules,
  updateActiveRule,
  updateAuditRecord,
  addAuditEvent,
  createAuditRecord,
  listAuditRecords,
  getAuditRecord,
} from '@/repositories/audit-repository';

// ---------------------------------------------------------------------------
// Legacy API — used by existing /api/execute-rule and /api/audit-logs routes
// ---------------------------------------------------------------------------

export function saveRule(rule: ParsedRule): ParsedRule {
  registerActiveRule(rule);
  return rule;
}

export function getActiveRules(): ActiveRule[] {
  return listAllRules();
}

export function saveExecutionRecord(record: ExecutionRecord): ExecutionRecord {
  legacySaveExecution(record);
  return record;
}

export function getExecutionRecords(): ExecutionRecord[] {
  return legacyGetExecutions();
}

export function updateRule(
  id: string,
  patch: Partial<Pick<ActiveRule, 'status' | 'last_checked_at' | 'last_executed_at'>>
): void {
  updateActiveRule(id, patch);
}

export function updateExecutionRecord(id: string, patch: Partial<ExecutionRecord>): void {
  updateAuditRecord(id, {
    status: patch.status as any,
    transaction_hash: patch.txHash,
    explorer_url: patch.explorerUrl,
    gas_used: patch.gasUsed,
    error_message_safe: patch.errorMessage,
  });
}
