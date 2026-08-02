/**
 * db:check — verify the configured database is reachable and the schema is
 * usable. With --migrate, creates the tables/indexes without touching rows.
 *
 *   pnpm db:check            # read-only connectivity + schema check
 *   pnpm db:migrate          # also create tables/indexes
 *
 * Runs against whatever the env points at: Turso when TURSO_DATABASE_URL is a
 * remote URL, the local SQLite file when it is unset.
 */
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

// Node does not read .env.local on its own. On a platform like Vercel the vars
// are already in the environment and there is no file to load.
if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const migrate = process.argv.includes('--migrate');
const localPath = path.resolve('src/data/chainflow.db');

if (!url) {
  const exists = fs.existsSync(localPath);
  console.log(`No TURSO_DATABASE_URL — using local file: ${localPath}${exists ? '' : ' (does not exist yet)'}`);
}

const client = createClient({ url: url ?? `file:${localPath}`, authToken });

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
];

async function main() {
  // Migration on an existing database: session_id is missing on pre-scoping
  // tables, and CREATE TABLE IF NOT EXISTS won't add it.
  for (const table of ['audit_records', 'active_rules']) {
    const columns = await client.execute(`PRAGMA table_info(${table})`);
    if (columns.rows.length > 0 && !columns.rows.some((r) => r.name === 'session_id')) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN session_id TEXT`);
    }
  }

  if (migrate) {
    for (const statement of TABLES) {
      await client.execute(statement);
    }
  }

  // With --migrate the tables exist; without it, only verify the connection.
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  );
  const names = result.rows.map((r) => r.name);
  const hasAudit = names.includes('audit_records');
  const hasRules = names.includes('active_rules');

  console.log(`Connected: ${url ?? `local ${localPath}`}`);
  console.log(`Tables: ${names.join(', ') || '(none)'}`);

  if (hasAudit) {
    const { rows } = await client.execute('SELECT COUNT(*) AS n FROM audit_records');
    const scoped = await client.execute(
      'SELECT COUNT(*) AS n FROM audit_records WHERE session_id IS NOT NULL'
    );
    console.log(`audit_records: ${rows[0].n} rows (${scoped.rows[0].n} session-scoped)`);
  } else {
    console.log('audit_records: MISSING (run pnpm db:migrate)');
  }
  console.log(`active_rules: ${hasRules ? 'present' : 'MISSING (run pnpm db:migrate)'}`);

  if (!hasAudit || !hasRules) {
    console.error('\nSchema not ready. Run: pnpm db:migrate');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Database check failed:', error?.message || error);
  process.exit(1);
});
