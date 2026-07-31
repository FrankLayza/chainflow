import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Ensure the data directory exists
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'chainflow.db');

// ---------------------------------------------------------------------------
// Singleton pattern — reuse the same connection across hot-reloads in dev
// ---------------------------------------------------------------------------
const globalDb = globalThis as unknown as { __chainflow_db?: Database.Database };

function createDb(): Database.Database {
  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ---------------------------------------------------------------------------
  // Schema — matches hios_architecture.md exactly
  // ---------------------------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_records (
      id                    TEXT PRIMARY KEY,
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
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id               TEXT PRIMARY KEY,
      audit_record_id  TEXT NOT NULL REFERENCES audit_records(id) ON DELETE CASCADE,
      status           TEXT NOT NULL,
      message_safe     TEXT,
      occurred_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS active_rules (
      id                TEXT PRIMARY KEY,
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
    );
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!globalDb.__chainflow_db) {
    globalDb.__chainflow_db = createDb();
  }
  return globalDb.__chainflow_db;
}
