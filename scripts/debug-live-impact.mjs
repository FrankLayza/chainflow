import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const active = await db.execute(
  "SELECT id, session_id, rule_type, last_executed_at, parameters_json FROM active_rules WHERE status = 'ACTIVE' ORDER BY created_at"
);

console.log(`ACTIVE rules the cron will fire right now: ${active.rows.length}`);
let perFire = 0;
for (const r of active.rows) {
  const p = JSON.parse(r.parameters_json || '{}');
  perFire += Number(p.transferAmount) || 0;
  console.log(
    `  ${r.rule_type}  sess=${String(r.session_id).slice(0, 8)}…  ${p.transferAmount} ETH  ` +
      `every ${p.intervalMinutes ?? p.intervalHours ?? '?'}${p.intervalMinutes ? 'm' : 'h'}  ` +
      `lastExec=${r.last_executed_at ?? 'never'}`
  );
}

const today = new Date().toISOString().slice(0, 10);
const spent = await db.execute({
  sql: `SELECT COUNT(*) AS n, SUM(CAST(amount AS REAL)) AS total FROM audit_records
        WHERE created_at >= :since AND status IN ('CONFIRMED','PENDING')`,
  args: { since: `${today}T00:00:00.000Z` },
});
const all = await db.execute(
  "SELECT COUNT(*) AS n, SUM(CAST(amount AS REAL)) AS total FROM audit_records WHERE status IN ('CONFIRMED','PENDING')"
);

console.log(`\nspend today   ${spent.rows[0].n} transfers, ${spent.rows[0].total ?? 0} ETH`);
console.log(`spend total   ${all.rows[0].n} transfers, ${all.rows[0].total ?? 0} ETH`);
console.log(`\nper cron fire ${perFire} ETH across ${active.rows.length} rule(s)`);
