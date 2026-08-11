import { createClient, type Client } from '@libsql/client';

/**
 * libSQL client. Points at Turso when TURSO_DATABASE_URL is set, otherwise at a
 * local SQLite file so development needs no network or account.
 *
 * Everything here is async: the previous better-sqlite3 driver was synchronous,
 * but it cannot run on Vercel — the filesystem is read-only and the native
 * module doesn't bundle. That constraint is what makes the repository async.
 */
const globalDb = globalThis as unknown as { __chainflow_db?: Client };

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TURSO_DATABASE_URL is required in production. A local file: URL will not persist on Vercel.'
      );
    }
    return createClient({ url: 'file:src/data/chainflow.db' });
  }

  // Embedded replicas and remote Turso both need the token; a file: URL never does.
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!authToken && !url.startsWith('file:')) {
    throw new Error('TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points at Turso.');
  }

  return createClient({ url, authToken });
}

export function getDb(): Client {
  if (!globalDb.__chainflow_db) {
    globalDb.__chainflow_db = createDbClient();
  }
  return globalDb.__chainflow_db;
}

const TABLES = [
  `CREATE TABLE IF NOT EXISTS audit_records (
      id                    TEXT PRIMARY KEY,
      session_id            TEXT,
      idempotency_key       TEXT UNIQUE,
      raw_input             TEXT NOT NULL,
      parsed_rule_json      TEXT,
      network               TEXT,
      keeperhub_execution_id TEXT,
      status                TEXT NOT NULL DEFAULT 'PENDING',
      transaction_hash      TEXT,
      explorer_url          TEXT,
      gas_used              TEXT,
      sponsored             INTEGER DEFAULT 1,
      recipient_address     TEXT,
      amount                TEXT,
      chain_id              INTEGER,
      error_code            TEXT,
      error_message_safe    TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
      id               TEXT PRIMARY KEY,
      audit_record_id  TEXT NOT NULL REFERENCES audit_records(id) ON DELETE CASCADE,
      status           TEXT NOT NULL,
      message_safe     TEXT,
      occurred_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  `CREATE TABLE IF NOT EXISTS active_rules (
      id                TEXT PRIMARY KEY,
      session_id        TEXT,
      raw_input         TEXT NOT NULL,
      rule_type         TEXT NOT NULL,
      action_type       TEXT NOT NULL,
      parameters_json   TEXT NOT NULL,
      explanation       TEXT,
      network           TEXT,
      status            TEXT NOT NULL DEFAULT 'ACTIVE',
      last_checked_at   TEXT,
      last_executed_at  TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  `CREATE TABLE IF NOT EXISTS rate_limit_events (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      bucket      TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    )`,
];

// Separate from TABLES: these reference session_id, which on a pre-existing
// database only exists after the backfill below has run.
const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_audit_records_session ON audit_records(session_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_active_rules_session ON active_rules(session_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_events(session_id, bucket, created_at ASC)`,
];

/**
 * Adds session_id to databases created before scoping existed. CREATE TABLE
 * IF NOT EXISTS is a no-op on an existing table, so a plain schema run would
 * leave those columns missing.
 */
async function backfillSessionColumns(db: Client): Promise<void> {
  for (const table of ['audit_records', 'active_rules']) {
    const columns = await db.execute(`PRAGMA table_info(${table})`);
    const hasSession = columns.rows.some((row) => row.name === 'session_id');
    if (!hasSession) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN session_id TEXT`);
    }
  }
}

let migrated: Promise<void> | null = null;

/**
 * Idempotent, and memoised so concurrent requests in one instance share a
 * single run rather than racing each other through the DDL.
 */
export function ensureSchema(): Promise<void> {
  if (!migrated) {
    migrated = (async () => {
      const db = getDb();
      for (const statement of TABLES) {
        await db.execute(statement);
      }
      await backfillSessionColumns(db);
      for (const statement of INDEXES) {
        await db.execute(statement);
      }
    })().catch((error) => {
      // Leaving a rejected promise cached would fail every later request with a
      // stale error; clearing it lets the next request retry.
      migrated = null;
      throw error;
    });
  }
  return migrated;
}
