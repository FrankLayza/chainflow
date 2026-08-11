/**
 * Session identity — a signed, opaque per-browser ID.
 *
 * One shared KeeperHub wallet sits behind this app, so a session is not an
 * account and grants no custody over funds. Its only job is to scope audit rows
 * so two people demoing at the same time don't read each other's history.
 *
 * The signature is the part that matters: without it a client could edit the
 * cookie to another session's ID and read those rows.
 */
import { cookies } from 'next/headers';

const COOKIE_NAME = 'cf_sid';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEV_FALLBACK_SECRET = 'chainflow-development-only-insecure-secret';

const encoder = new TextEncoder();

function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;

  // A predictable secret means forgeable session IDs. Tolerable while developing
  // locally, never in a deployed environment.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is required in production.'
    );
  }
  console.warn('SESSION_SECRET is not set — falling back to an insecure development secret.');
  return DEV_FALLBACK_SECRET;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signSessionId(id: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(id));
  return `${id}.${Buffer.from(signature).toString('base64url')}`;
}

async function readSignedId(token: string): Promise<string | null> {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const id = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), 'base64url');
  if (signature.length === 0) return null;

  const valid = await crypto.subtle.verify('HMAC', await hmacKey(), signature, encoder.encode(id));
  return valid ? id : null;
}

/**
 * The caller's session ID, minting and setting a fresh one when the cookie is
 * absent or its signature doesn't verify. Callable from any Route Handler.
 */
export async function resolveSessionId(): Promise<string> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (token) {
    const id = await readSignedId(token);
    if (id) return id;
  }

  const id = crypto.randomUUID();
  jar.set(COOKIE_NAME, await signSessionId(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return id;
}
