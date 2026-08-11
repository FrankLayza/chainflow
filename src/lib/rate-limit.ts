import { getDb, ensureSchema } from '@/repositories/db';

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Hard ceilings per session (a session is one browser, mintable by anyone, so
 * these blunt scripted abuse rather than authenticate).
 */
export const LIMITS = {
  /** Real broadcasts per hour — guards the shared wallet balance. */
  broadcastsPerHour: 10,
  /** Minimum spacing between real broadcasts — one per 30s. */
  broadcastCooldownMs: 30_000,
  /** Armed rules per session — caps how often the cron can fire. */
  activeRules: 20,
} as const;

/**
 * Sliding-window limiter backed by the shared database. In serverless each
 * invocation may run on a fresh instance, so an in-memory counter would be
 * wrong on every request except the first — the DB is the only state both a
 * browser session and its cron ticks can agree on.
 */
export async function checkRateLimit(
  sessionId: string,
  bucket: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const db = getDb();
  await ensureSchema();
  const now = Date.now();
  const cutoff = now - windowMs;

  await db.execute({
    sql: `DELETE FROM rate_limit_events
          WHERE session_id = :session_id AND bucket = :bucket AND created_at < :cutoff`,
    args: { session_id: sessionId, bucket, cutoff },
  });

  const rows = await db.execute({
    sql: `SELECT created_at FROM rate_limit_events
          WHERE session_id = :session_id AND bucket = :bucket AND created_at >= :cutoff
          ORDER BY created_at ASC`,
    args: { session_id: sessionId, bucket, cutoff },
  });

  if (rows.rows.length >= limit) {
    const oldest = Number(rows.rows[0].created_at);
    return { ok: false, remaining: 0, retryAfterMs: Math.max(1, oldest + windowMs - now) };
  }

  await db.execute({
    sql: `INSERT INTO rate_limit_events (id, session_id, bucket, created_at)
          VALUES (:id, :session_id, :bucket, :created_at)`,
    args: { id: crypto.randomUUID(), session_id: sessionId, bucket, created_at: now },
  });

  return { ok: true, remaining: limit - rows.rows.length - 1 };
}