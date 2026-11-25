import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, isAdminHost, verifyAdminToken } from '../session-edge';

/** True if ADMIN_PASSWORD is set and `attempt` matches it. */
export function checkAdminPassword(attempt: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash('sha256').update(attempt).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Path prefix for admin links. On admin.* hosts the middleware maps `/x` to
 * `/admin/x`, so links drop the prefix; elsewhere (local dev) they keep it.
 */
export function adminBase(): string {
  return isAdminHost(headers().get('host')) ? '' : '/admin';
}

export async function isAdmin(): Promise<boolean> {
  return verifyAdminToken(cookies().get(ADMIN_COOKIE)?.value);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect(`${adminBase()}/login`);
}

/** For server actions: refuse rather than redirect (see actions.ts). */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error('Not signed in to the admin panel.');
}
