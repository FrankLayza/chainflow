/**
 * Repro harness for: "I disabled the rule in the UI and the cron keeps firing it."
 *
 * Asserts the user-facing invariant: after disabling every rule the UI shows for
 * my session, a cron tick must broadcast nothing.
 *
 * Safe by construction — a throwaway file DB (never Turso) and a stub KeeperHub
 * (never a real broadcast). Both redirections are verified before asserting.
 */
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';

const APP = process.env.APP_URL || 'http://localhost:3100';
const STUB = process.env.STUB_URL || 'http://localhost:4599';
const DB_PATH = process.env.REPRO_DB_PATH;
const SECRET = process.env.SESSION_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

if (!DB_PATH) throw new Error('REPRO_DB_PATH is required');
if (!SECRET) throw new Error('SESSION_SECRET is required');

const db = createClient({ url: `file:${DB_PATH}` });

function cookieFor(sessionId) {
  const sig = crypto.createHmac('sha256', SECRET).update(sessionId).digest('base64url');
  return `cf_sid=${sessionId}.${sig}`;
}

const SESSION_UI = crypto.randomUUID();
const SESSION_OLD = crypto.randomUUID();

const RULE_UI = crypto.randomUUID();
const RULE_ORPHAN = crypto.randomUUID();
const RULE_CONTROL = crypto.randomUUID();

const params = JSON.stringify({
  thresholdAmount: '0',
  targetAddress: '0x000000000000000000000000000000000000dEaD',
  transferAmount: '0.0000001',
  tokenSymbol: 'ETH',
  intervalMinutes: 2,
});

async function seed() {
  await db.execute(`CREATE TABLE IF NOT EXISTS active_rules (
    id TEXT PRIMARY KEY, session_id TEXT, raw_input TEXT NOT NULL,
    rule_type TEXT NOT NULL, action_type TEXT NOT NULL, parameters_json TEXT NOT NULL,
    explanation TEXT, network TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
    last_checked_at TEXT, last_executed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  await db.execute('DELETE FROM active_rules');

  const rows = [
    [RULE_UI, SESSION_UI, 'repro-ui-visible', 'ACTIVE'],
    [RULE_ORPHAN, SESSION_OLD, 'repro-orphan-from-older-session', 'ACTIVE'],
    [RULE_CONTROL, SESSION_UI, 'repro-db-redirection-control', 'PAUSED'],
  ];

  for (const [id, session, rawInput, status] of rows) {
    await db.execute({
      sql: `INSERT INTO active_rules (id, session_id, raw_input, rule_type, action_type,
              parameters_json, explanation, network, status, last_checked_at,
              last_executed_at, created_at)
            VALUES (:id, :session, :raw, 'SCHEDULED_INTERVAL', 'TRANSFER_TOKEN', :params,
              'repro', 'Ethereum Sepolia', :status, NULL, NULL, :created)`,
      args: { id, session, raw: rawInput, params, status, created: new Date().toISOString() },
    });
  }
}

async function post(path, body, cookie) {
  const res = await fetch(`${APP}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function statusOf(id) {
  const r = await db.execute({ sql: 'SELECT status FROM active_rules WHERE id = :id', args: { id } });
  return r.rows[0]?.status ?? '(missing)';
}

async function main() {
  await seed();

  // Control: prove the app reads THIS db before anything can broadcast.
  const control = await post('/api/rules/enable', { ruleId: RULE_CONTROL }, cookieFor(SESSION_UI));
  if (control.status !== 200) {
    console.error(
      `ABORT: app is not reading the repro DB (enable control returned ${control.status} ` +
        `${JSON.stringify(control.json)}). Refusing to run — a real broadcast could fire.`
    );
    process.exit(2);
  }
  await db.execute({
    sql: "UPDATE active_rules SET status = 'PAUSED' WHERE id = :id",
    args: { id: RULE_CONTROL },
  });
  console.log('control      app is reading the repro DB ✓');

  // Control: prove broadcasts land on the stub, not on real KeeperHub.
  const stubUp = await fetch(`${STUB}/__reset`).then((r) => r.ok).catch(() => false);
  if (!stubUp) {
    console.error('ABORT: KeeperHub stub is not reachable. Refusing to run.');
    process.exit(2);
  }
  console.log('control      KeeperHub stub reachable ✓');

  // The user's action: disable every rule their UI shows.
  const disable = await post('/api/rules/disable', { ruleId: RULE_UI }, cookieFor(SESSION_UI));
  console.log(`disable      POST /api/rules/disable -> ${disable.status} ${JSON.stringify(disable.json)}`);
  console.log(`             rule status in DB: ${await statusOf(RULE_UI)}`);

  // One cron tick.
  const cron = await fetch(`${APP}/api/cron/check-rules?token=${encodeURIComponent(CRON_SECRET ?? '')}`);
  const cronJson = await cron.json().catch(() => null);
  console.log(`cron         GET /api/cron/check-rules -> ${cron.status}`);
  for (const r of cronJson?.results ?? []) {
    const label =
      r.id === RULE_UI ? 'UI-visible' : r.id === RULE_ORPHAN ? 'ORPHAN(other session)' : r.id;
    console.log(`             [${r.fired ? 'FIRED' : 'skip '}] ${label}: ${r.message}`);
  }

  const { calls } = await fetch(`${STUB}/__calls`).then((r) => r.json());

  console.log('');
  console.log(`broadcasts   ${calls.length}`);
  if (calls.length === 0) {
    console.log('RESULT: PASS — disabling the rules the UI shows stopped all broadcasts.');
    process.exit(0);
  }
  console.log(
    `RESULT: FAIL — ${calls.length} transfer(s) broadcast after the user disabled every rule ` +
      `their UI exposes. This is the reported bug.`
  );
  process.exit(1);
}

main().catch((error) => {
  console.error('harness error:', error);
  process.exit(3);
});
