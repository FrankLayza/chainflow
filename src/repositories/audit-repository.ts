import { getDb, ensureSchema } from './db';
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import { DEFAULT_CHAIN_ID } from '@/lib/keeperhub/config';
import type { InValue } from '@libsql/client';

export type RecordStatus =
  | 'PENDING'
  | 'SIMULATED'
  | 'EXECUTING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'RETRYING';

export interface AuditRecord {
  id: string;
  session_id?: string;
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
  session_id?: string;
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

function args(obj: Record<string, unknown>): Record<string, InValue> {
  const result: Record<string, InValue> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = (val === undefined ? null : val) as InValue;
  }
  return result;
}

function toAuditRecord(row: Record<string, unknown>): AuditRecord {
  return { ...row, sponsored: Boolean(row.sponsored) } as AuditRecord;
}

export async function createAuditRecord(
  record: Omit<AuditRecord, 'created_at' | 'updated_at'>
): Promise<AuditRecord> {
  const db = getDb();
  await ensureSchema();
  const now = new Date().toISOString();

  const params = args({
    session_id: null,
    idempotency_key: null,
    parsed_rule_json: null,
    network: null,
    keeperhub_execution_id: null,
    transaction_hash: null,
    explorer_url: null,
    gas_used: null,
    recipient_address: null,
    amount: null,
    chain_id: null,
    error_code: null,
    error_message_safe: null,
    ...record,
    sponsored: record.sponsored === false ? 0 : 1,
    created_at: now,
    updated_at: now,
  });

  await db.execute({
    sql: `INSERT INTO audit_records (
      id, session_id, idempotency_key, raw_input, parsed_rule_json, network,
      keeperhub_execution_id, status, transaction_hash, explorer_url,
      gas_used, sponsored, recipient_address, amount, chain_id,
      error_code, error_message_safe, created_at, updated_at
    ) VALUES (
      :id, :session_id, :idempotency_key, :raw_input, :parsed_rule_json, :network,
      :keeperhub_execution_id, :status, :transaction_hash, :explorer_url,
      :gas_used, :sponsored, :recipient_address, :amount, :chain_id,
      :error_code, :error_message_safe, :created_at, :updated_at
    )`,
    args: params,
  });

  return (await getAuditRecord(record.id))!;
}

// Only these columns may be patched. The UPDATE builds its SET clause from
// caller-supplied keys, so an allowlist is what keeps that interpolation safe.
const UPDATABLE_COLUMNS = new Set([
  'idempotency_key',
  'raw_input',
  'parsed_rule_json',
  'network',
  'keeperhub_execution_id',
  'status',
  'transaction_hash',
  'explorer_url',
  'gas_used',
  'sponsored',
  'recipient_address',
  'amount',
  'chain_id',
  'error_code',
  'error_message_safe',
]);

export async function updateAuditRecord(
  id: string,
  patch: Partial<Omit<AuditRecord, 'id' | 'created_at'>>
): Promise<void> {
  const entries = Object.entries(patch).filter(([key]) => UPDATABLE_COLUMNS.has(key));
  if (entries.length === 0) return;

  const db = getDb();
  await ensureSchema();

  const assignments = entries.map(([key]) => `${key} = :${key}`).join(', ');
  await db.execute({
    sql: `UPDATE audit_records SET ${assignments}, updated_at = :updated_at WHERE id = :id`,
    args: args({
      ...Object.fromEntries(entries),
      updated_at: new Date().toISOString(),
      id,
    }),
  });
}

export async function getAuditRecord(id: string): Promise<AuditRecord | null> {
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM audit_records WHERE id = :id',
    args: { id },
  });
  const row = result.rows[0];
  return row ? toAuditRecord(row as unknown as Record<string, unknown>) : null;
}

export async function getActiveRule(id: string): Promise<ActiveRule | null> {
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM active_rules WHERE id = :id',
    args: { id },
  });
  const row = result.rows[0];
  return row ? (row as unknown as ActiveRule) : null;
}

/**
 * Scoped to one session. Passing no sessionId returns nothing rather than
 * everything — an accidental omission should leak no rows.
 */
export async function listAuditRecords(sessionId?: string, limit = 50): Promise<AuditRecord[]> {
  if (!sessionId) return [];
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT * FROM audit_records WHERE session_id = :session_id
          ORDER BY created_at DESC LIMIT :limit`,
    args: { session_id: sessionId, limit },
  });
  return result.rows.map((row) => toAuditRecord(row as unknown as Record<string, unknown>));
}

/**
 * PENDING rows that carry a KeeperHub execution id, so a later poll can settle
 * them. Scoped to the session for the same reason the list endpoints are.
 */
export async function listPendingExecutions(sessionId?: string): Promise<AuditRecord[]> {
  if (!sessionId) return [];
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT * FROM audit_records
          WHERE session_id = :session_id
            AND status IN ('PENDING', 'EXECUTING', 'RETRYING')
            AND keeperhub_execution_id IS NOT NULL
          ORDER BY created_at DESC`,
    args: { session_id: sessionId },
  });
  return result.rows.map((row) => toAuditRecord(row as unknown as Record<string, unknown>));
}

export async function addAuditEvent(
  auditRecordId: string,
  status: string,
  messageSafe?: string
): Promise<AuditEvent> {
  const db = getDb();
  await ensureSchema();
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    audit_record_id: auditRecordId,
    status,
    message_safe: messageSafe,
    occurred_at: new Date().toISOString(),
  };
  await db.execute({
    sql: `INSERT INTO audit_events (id, audit_record_id, status, message_safe, occurred_at)
          VALUES (:id, :audit_record_id, :status, :message_safe, :occurred_at)`,
    args: args(event as unknown as Record<string, unknown>),
  });
  return event;
}

export async function getAuditEvents(auditRecordId: string): Promise<AuditEvent[]> {
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM audit_events WHERE audit_record_id = :id ORDER BY occurred_at ASC',
    args: { id: auditRecordId },
  });
  return result.rows as unknown as AuditEvent[];
}

export async function registerActiveRule(
  rule: ParsedRule,
  sessionId?: string
): Promise<ActiveRule> {
  const db = getDb();
  await ensureSchema();
  const row: ActiveRule = {
    id: rule.id || crypto.randomUUID(),
    session_id: sessionId,
    raw_input: rule.rawInput,
    rule_type: rule.ruleType,
    action_type: rule.actionType,
    parameters_json: JSON.stringify(rule.parameters),
    explanation: rule.explanation,
    network: rule.network,
    status: 'ACTIVE',
    last_checked_at: null,
    last_executed_at: null,
    created_at: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO active_rules (
      id, session_id, raw_input, rule_type, action_type, parameters_json,
      explanation, network, status, last_checked_at, last_executed_at, created_at
    ) VALUES (
      :id, :session_id, :raw_input, :rule_type, :action_type, :parameters_json,
      :explanation, :network, :status, :last_checked_at, :last_executed_at, :created_at
    )`,
    args: args(row as unknown as Record<string, unknown>),
  });

  return row;
}

export async function getQueuedActiveRules(): Promise<ActiveRule[]> {
  const db = getDb();
  await ensureSchema();
  const result = await db.execute(
    "SELECT * FROM active_rules WHERE status = 'ACTIVE' ORDER BY created_at ASC"
  );
  return result.rows as unknown as ActiveRule[];
}

/**
 * A hard ceiling on armed rules per session. Prevents one caller from flooding
 * the queue with rules the cron would then fire at the shared wallet each tick.
 */
export async function countActiveRules(sessionId?: string): Promise<number> {
  if (!sessionId) return 0;
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM active_rules
          WHERE session_id = :session_id AND status = 'ACTIVE'`,
    args: { session_id: sessionId },
  });
  return Number(result.rows[0]?.n ?? 0);
}

export async function listAllRules(sessionId?: string): Promise<ActiveRule[]> {
  if (!sessionId) return [];
  const db = getDb();
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM active_rules WHERE session_id = :session_id ORDER BY created_at DESC',
    args: { session_id: sessionId },
  });
  return result.rows as unknown as ActiveRule[];
}

export async function updateActiveRule(
  id: string,
  patch: Partial<Pick<ActiveRule, 'status' | 'last_checked_at' | 'last_executed_at'>>
): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  const db = getDb();
  await ensureSchema();
  const assignments = entries.map(([key]) => `${key} = :${key}`).join(', ');
  await db.execute({
    sql: `UPDATE active_rules SET ${assignments} WHERE id = :id`,
    args: args({ ...patch, id }),
  });
}

/**
 * Atomically claims the next fire of a recurring rule. Only succeeds if
 * `last_executed_at` still matches what the caller read, so two overlapping
 * cron ticks (retries, misconfigured schedulers) cannot both broadcast a
 * scheduled transfer. Returns false when another tick won the race.
 */
export async function claimScheduledFire(
  id: string,
  expectedLastExecutedAt: string | null
): Promise<boolean> {
  const db = getDb();
  await ensureSchema();
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `UPDATE active_rules
          SET last_executed_at = :now, last_checked_at = :now
          WHERE id = :id AND last_executed_at IS :expected`,
    args: args({ id, now, expected: expectedLastExecutedAt }),
  });
  return Number(result.rowsAffected) > 0;
}

// ---------------------------------------------------------------------------
// Legacy bridge — keeps the old store.ts API surface working
// Maps ExecutionRecord → AuditRecord
// ---------------------------------------------------------------------------
export async function legacySaveExecution(record: ExecutionRecord): Promise<void> {
  await createAuditRecord({
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

export async function legacyGetExecutions(sessionId?: string): Promise<ExecutionRecord[]> {
  const records = await listAuditRecords(sessionId);
  return records.map((r) => ({
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
    chainId: r.chain_id || DEFAULT_CHAIN_ID,
    errorMessage: r.error_message_safe,
  }));
}
