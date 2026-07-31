import fs from 'fs';
import path from 'path';
import { ExecutionRecord, ParsedRule } from '@/types/rule';

// ---------------------------------------------------------------------------
// Path to the JSON flat-file database.
// Survives hot-reloads AND server restarts (unlike globalThis).
// ---------------------------------------------------------------------------
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

interface Db {
  rules: (ParsedRule & { status?: string; lastCheckedAt?: string | null; lastExecutedAt?: string | null })[];
  executions: ExecutionRecord[];
}

function readDb(): Db {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as Db;
  } catch {
    // If file is missing or corrupt, start fresh
    return { rules: [], executions: [] };
  }
}

function writeDb(db: Db): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export function saveRule(rule: ParsedRule): ParsedRule {
  const db = readDb();
  // Avoid duplicates by id
  const exists = db.rules.findIndex((r) => r.id === rule.id);
  if (exists !== -1) {
    db.rules[exists] = rule;
  } else {
    db.rules.unshift(rule);
  }
  writeDb(db);
  return rule;
}

export function getActiveRules(): ParsedRule[] {
  const db = readDb();
  return db.rules;
}

export function updateRule(id: string, patch: Partial<ParsedRule & { status: string; lastCheckedAt: string | null; lastExecutedAt: string | null }>): void {
  const db = readDb();
  const idx = db.rules.findIndex((r) => r.id === id);
  if (idx !== -1) {
    db.rules[idx] = { ...db.rules[idx]!, ...patch };
    writeDb(db);
  }
}

export function deleteRule(id: string): void {
  const db = readDb();
  db.rules = db.rules.filter((r) => r.id !== id);
  writeDb(db);
}

// ---------------------------------------------------------------------------
// Execution Records
// ---------------------------------------------------------------------------

export function saveExecutionRecord(record: ExecutionRecord): ExecutionRecord {
  const db = readDb();
  db.executions.unshift(record);
  writeDb(db);
  return record;
}

export function getExecutionRecords(): ExecutionRecord[] {
  const db = readDb();
  return db.executions;
}

export function updateExecutionRecord(id: string, patch: Partial<ExecutionRecord>): void {
  const db = readDb();
  const idx = db.executions.findIndex((e) => e.id === id);
  if (idx !== -1) {
    db.executions[idx] = { ...db.executions[idx]!, ...patch };
    writeDb(db);
  }
}
