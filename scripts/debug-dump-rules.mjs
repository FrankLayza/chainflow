import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const rules = await db.execute(
  'SELECT id, session_id, rule_type, status, last_checked_at, last_executed_at, created_at, parameters_json FROM active_rules ORDER BY created_at DESC'
);

console.log(`active_rules: ${rules.rows.length} row(s)\n`);
for (const r of rules.rows) {
  const p = JSON.parse(r.parameters_json || '{}');
  console.log(`id            ${r.id}`);
  console.log(`  session     ${String(r.session_id).slice(0, 8)}…`);
  console.log(`  type        ${r.rule_type}`);
  console.log(`  status      ${r.status}`);
  console.log(`  interval    min=${p.intervalMinutes ?? '-'} hrs=${p.intervalHours ?? '-'}`);
  console.log(`  amount      ${p.transferAmount}`);
  console.log(`  created     ${r.created_at}`);
  console.log(`  lastChecked ${r.last_checked_at ?? 'null'}`);
  console.log(`  lastExec    ${r.last_executed_at ?? 'null'}`);
  console.log('');
}

const recent = await db.execute(
  "SELECT id, session_id, status, amount, recipient_address, created_at FROM audit_records ORDER BY created_at DESC LIMIT 12"
);
console.log(`--- last ${recent.rows.length} audit_records (executions) ---`);
for (const e of recent.rows) {
  console.log(
    `${e.created_at}  ${String(e.status).padEnd(9)} ${String(e.amount).padEnd(8)} sess=${String(e.session_id).slice(0, 8)}… id=${String(e.id).slice(0, 24)}`
  );
}
