import type { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'wedding_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export type SessionPayload = {
  personId: string;
};

function getSecretBytes() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    'raw',
    getSecretBytes(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(data: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data),
  );
  return b64urlEncode(sig);
}

async function verifySig(data: string, signature: string): Promise<boolean> {
  const key = await hmacKey();
  const sigBytes = b64urlDecode(signature);
  return crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes.buffer as ArrayBuffer,
    new TextEncoder().encode(data),
  );
}

export async function createSessionToken(personId: string): Promise<string> {
  const payload = {
    personId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(body);
  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const ok = await verifySig(body, signature);
    if (!ok) return null;
    const json = new TextDecoder().decode(b64urlDecode(body));
    const payload = JSON.parse(json) as { personId?: unknown; exp?: unknown };
    if (typeof payload.personId !== 'string' || !payload.personId) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
      return null;
    }
    return { personId: payload.personId };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Dev-only preview without scanning a QR. Never enable in production. */
export function isDevBypassEnabled() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_DEV_BYPASS === 'true'
  );
}
