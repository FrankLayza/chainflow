import { getDb } from './db';
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type RecordStatus =
  | 'PENDING'
  | 'SIMULATED'
  | 'EXECUTING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'RETRYING';

export interface AuditRecord {
  id: string;
  idempotency_key?: string;
  raw_input: string;
  parsed_rule_json?: string;
  network?: string;
  keeperhub_execution_id?: string;
  status: RecordStatus;
  transaction_hash?: string;
  explorer_url?: string;
  gas_used?: string;
  sponsored?: boolean;
  recipient_address?: string;
  amount?: string;
  chain_id?: number;
  error_code?: string;
  error_message_safe?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  audit_record_id: string;
  status: string;
  message_safe?: string;
  occurred_at: string;
}

export type ActiveRuleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export interface ActiveRule {
  id: string;
  raw_input: string;
  rule_type: string;
  action_type: string;
  parameters_json: string;
  explanation?: string;
  network?: string;
  status: ActiveRuleStatus;
  last_checked_at?: string | null;
  last_executed_at?: string | null;
  created_at: string;
}

function cleanParams<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = val === undefined ? null : val;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Audit Records
// ---------------------------------------------------------------------------

export function createAuditRecord(
  record: Omit<AuditRecord, 'created_at' | 'updated_at'>
): AuditRecord {
  const db = getDb();
  const now = new Date().toISOString();

  const defaultRecord = {
    id: '',
    idempotency_key: null,
    raw_input: '',
    parsed_rule_json: null,
    network: null,
    keeperhub_execution_id: null,
    status: 'PENDING',
    transaction_hash: null,
    explorer_url: null,
    gas_used: null,
    sponsored: 1,
    recipient_address: null,
    amount: null,
    chain_id: null,
    error_code: null,
    error_message_safe: null,
    created_at: now,
    updated_at: now,
  };

  const params = cleanParams({
    ...defaultRecord,
    ...record,
    sponsored: record.sponsored ? 1 : 0,
    created_at: now,
    updated_at: now,
  });

  db.prepare(`
    INSERT INTO audit_records (
      id, idempotency_key, raw_input, parsed_rule_json, network,
      keeperhub_execution_id, status, transaction_hash, explorer_url,
      gas_used, sponsored, recipient_address, amount, chain_id,
      error_code, error_message_safe, created_at, updated_at
    ) VALUES (
      @id, @idempotency_key, @raw_input, @parsed_rule_json, @network,
      @keeperhub_execution_id, @status, @transaction_hash, @explorer_url,
      @gas_used, @sponsored, @recipient_address, @amount, @chain_id,
      @error_code, @error_message_safe, @created_at, @updated_at
    )
  `).run(params);

  return getAuditRecord(record.id)!;
}

export function updateAuditRecord(
  id: string,
  patch: Partial<Omit<AuditRecord, 'id' | 'created_at'>>
): void {
  const db = getDb();
  const cleanPatch = cleanParams(patch);
  const fields = Object.keys(cleanPatch)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  db.prepare(
    `UPDATE audit_records SET ${fields}, updated_at = @updated_at WHERE id = @id`
  ).run({ ...cleanPatch, updated_at: new Date().toISOString(), id });
}

export function getAuditRecord(id: string): AuditRecord | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM audit_records WHERE id = ?').get(id) as AuditRecord) ?? null;
}

export function listAuditRecords(limit = 50): AuditRecord[] {
  const db = getDb();
  return db.prepare('SELECT * FROM audit_records ORDER BY created_at DESC LIMIT ?').all(limit) as AuditRecord[];
}

// ---------------------------------------------------------------------------
// Audit Events
// ---------------------------------------------------------------------------

export function addAuditEvent(
  auditRecordId: string,
  status: string,
  messageSafe?: string
): AuditEvent {
  const db = getDb();
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    audit_record_id: auditRecordId,
    status,
    message_safe: messageSafe,
    occurred_at: new Date().toISOString(),
  };
  db.prepare(`
    INSERT INTO audit_events (id, audit_record_id, status, message_safe, occurred_at)
    VALUES (@id, @audit_record_id, @status, @message_safe, @occurred_at)
  `).run(cleanParams(event));
  return event;
}

export function getAuditEvents(auditRecordId: string): AuditEvent[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM audit_events WHERE audit_record_id = ? ORDER BY occurred_at ASC')
    .all(auditRecordId) as AuditEvent[];
}

// ---------------------------------------------------------------------------
// Active Rules
// ---------------------------------------------------------------------------

export function registerActiveRule(rule: ParsedRule): ActiveRule {
  const db = getDb();
  const now = new Date().toISOString();
  const row: ActiveRule = {
    id: rule.id || crypto.randomUUID(),
    raw_input: rule.rawInput,
    rule_type: rule.ruleType,
    action_type: rule.actionType,
    parameters_json: JSON.stringify(rule.parameters),
    explanation: rule.explanation,
    network: rule.network,
    status: 'ACTIVE',
    last_checked_at: null,
    last_executed_at: null,
    created_at: now,
  };

  db.prepare(`
    INSERT OR REPLACE INTO active_rules (
      id, raw_input, rule_type, action_type, parameters_json,
      explanation, network, status, last_checked_at, last_executed_at, created_at
    ) VALUES (
      @id, @raw_input, @rule_type, @action_type, @parameters_json,
      @explanation, @network, @status, @last_checked_at, @last_executed_at, @created_at
    )
  `).run(cleanParams(row));

  return row;
}

export function getQueuedActiveRules(): ActiveRule[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM active_rules WHERE status = 'ACTIVE' ORDER BY created_at ASC")
    .all() as ActiveRule[];
}

export function listAllRules(): ActiveRule[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM active_rules ORDER BY created_at DESC')
    .all() as ActiveRule[];
}

export function updateActiveRule(
  id: string,
  patch: Partial<Pick<ActiveRule, 'status' | 'last_checked_at' | 'last_executed_at'>>
): void {
  const db = getDb();
  const fields = Object.keys(patch).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE active_rules SET ${fields} WHERE id = @id`).run({ ...patch, id });
}

// ---------------------------------------------------------------------------
// Legacy bridge — keeps the old store.ts API surface working
// Maps ExecutionRecord → AuditRecord
// ---------------------------------------------------------------------------
export function legacySaveExecution(record: ExecutionRecord): void {
  createAuditRecord({
    id: record.id,
    raw_input: record.rawInput,
    network: 'Ethereum Sepolia',
    keeperhub_execution_id: record.id,
    status: record.status as RecordStatus,
    transaction_hash: record.txHash,
    explorer_url: record.explorerUrl,
    gas_used: record.gasUsed,
    sponsored: record.sponsored,
    recipient_address: record.recipientAddress,
    amount: record.amount,
    chain_id: record.chainId,
    error_message_safe: record.errorMessage,
  });
}

export function legacyGetExecutions(): ExecutionRecord[] {
  return listAuditRecords().map((r) => ({
    id: r.id,
    rawInput: r.raw_input,
    timestamp: r.created_at,
    status: r.status as ExecutionRecord['status'],
    txHash: r.transaction_hash,
    explorerUrl: r.explorer_url,
    gasUsed: r.gas_used,
    sponsored: Boolean(r.sponsored),
    recipientAddress: r.recipient_address || '',
    amount: r.amount || '0',
    chainId: r.chain_id || 11155111,
    errorMessage: r.error_message_safe,
  }));
}
