/** Confirms the scope asymmetry: what the cron fires vs what the UI can show. */
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';

const db = createClient({ url: `file:${process.env.REPRO_DB_PATH}` });
const SECRET = process.env.SESSION_SECRET;

const rows = await db.execute(
  'SELECT id, session_id, status, raw_input FROM active_rules ORDER BY raw_input'
);

console.log('--- repro DB state ---');
for (const r of rows.rows) {
  console.log(`  ${String(r.status).padEnd(7)} sess=${String(r.session_id).slice(0, 8)}…  ${r.raw_input}`);
}

const uiRow = rows.rows.find((r) => r.raw_input === 'repro-ui-visible');
const orphan = rows.rows.find((r) => r.raw_input === 'repro-orphan-from-older-session');

const sid = uiRow.session_id;
const sig = crypto.createHmac('sha256', SECRET).update(sid).digest('base64url');

const res = await fetch('http://localhost:3100/api/audit-logs', {
  headers: { Cookie: `cf_sid=${sid}.${sig}` },
});
const data = await res.json();

console.log(`\n--- GET /api/audit-logs as the UI session (${String(sid).slice(0, 8)}…) ---`);
console.log(`  rules returned: ${data.rules.length}`);
for (const r of data.rules) {
  console.log(`    ${String(r.status).padEnd(7)} ${r.rawInput}`);
}

const orphanVisible = data.rules.some((r) => r.id === orphan.id);
console.log(`\n  orphan ACTIVE rule visible to this session? ${orphanVisible ? 'YES' : 'NO'}`);
console.log(
  orphanVisible
    ? '  => UI could offer a Disable button for it.'
    : '  => UI can never offer a Disable button for it, yet the cron fires it every tick.'
);
