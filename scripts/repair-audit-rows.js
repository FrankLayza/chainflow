/**
 * Repairs audit rows written before the honesty fix in
 * `src/app/api/execute-rule/route.ts`.
 *
 * Two classes of bad data, both fixable in place — no need to drop the DB and
 * lose real transaction hashes:
 *
 *  1. Fabricated gas. The old fallback wrote the literal `'77,119 units'` when
 *     KeeperHub reported nothing. Real values are written as `${n} units` from
 *     a number, so they never contain a comma — that comma is how we tell a
 *     fabricated row from a genuine 77119-gas execution.
 *
 *  2. Unearned CONFIRMED. Status was hardcoded regardless of outcome, so rows
 *     can claim confirmation with no transaction hash to back it.
 *
 * Run with the dev server stopped:  node scripts/repair-audit-rows.js
 * Add --dry to preview without writing.
 */
const path = require("node:path");
const Database = require("better-sqlite3");

const DRY = process.argv.includes("--dry");
const dbPath = path.join(__dirname, "..", "src", "data", "chainflow.db");

const db = new Database(dbPath);

const fabricatedGas = db
  .prepare("SELECT COUNT(*) AS n FROM audit_records WHERE gas_used = ?")
  .get("77,119 units").n;

const unearnedConfirmed = db
  .prepare(
    "SELECT COUNT(*) AS n FROM audit_records WHERE transaction_hash IS NULL AND status = 'CONFIRMED'",
  )
  .get().n;

const total = db.prepare("SELECT COUNT(*) AS n FROM audit_records").get().n;
const withHash = db
  .prepare("SELECT COUNT(*) AS n FROM audit_records WHERE transaction_hash IS NOT NULL")
  .get().n;

console.log(`\n  ${dbPath}\n`);
console.log(`  rows total ................. ${total}`);
console.log(`  with a real tx hash ........ ${withHash}   (preserved)`);
console.log(`  fabricated gas ............. ${fabricatedGas}   -> NULL`);
console.log(`  CONFIRMED without hash ..... ${unearnedConfirmed}   -> PENDING\n`);

if (DRY) {
  console.log("  --dry: nothing written.\n");
  db.close();
  process.exit(0);
}

if (fabricatedGas === 0 && unearnedConfirmed === 0) {
  console.log("  Nothing to repair.\n");
  db.close();
  process.exit(0);
}

const repair = db.transaction(() => {
  const gas = db
    .prepare(
      "UPDATE audit_records SET gas_used = NULL, updated_at = datetime('now') WHERE gas_used = ?",
    )
    .run("77,119 units");

  const status = db
    .prepare(
      "UPDATE audit_records SET status = 'PENDING', updated_at = datetime('now') WHERE transaction_hash IS NULL AND status = 'CONFIRMED'",
    )
    .run();

  return { gas: gas.changes, status: status.changes };
});

const result = repair();
console.log(`  gas cleared ................ ${result.gas}`);
console.log(`  status corrected ........... ${result.status}\n`);
console.log("  Done. Transaction hashes untouched.\n");

db.close();
