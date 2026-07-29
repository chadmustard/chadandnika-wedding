import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import {
  SESSION_COOKIE,
  verifySessionToken,
  createSessionToken,
  sessionCookieOptions,
  clearSessionCookie,
  isDevBypassEnabled,
} from './session-edge';

export {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
  clearSessionCookie,
  isDevBypassEnabled,
};

export async function getSessionPersonId(
  request?: NextRequest,
): Promise<string | null> {
  const token = request
    ? request.cookies.get(SESSION_COOKIE)?.value
    : (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.personId ?? null;
}

export async function getCurrentPerson() {
  const personId = await getSessionPersonId();
  if (!personId) return null;
  return prisma.person.findUnique({ where: { id: personId } });
}
