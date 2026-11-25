import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
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

/** Sign the guest in: stamp visit times and set the session cookie on `response`. */
export async function startGuestSession(
  response: NextResponse,
  person: { id: string; firstVisitAt: Date | null },
) {
  const now = new Date();
  await prisma.person.update({
    where: { id: person.id },
    data: { firstVisitAt: person.firstVisitAt ?? now, lastVisitAt: now },
  });
  const opts = sessionCookieOptions(await createSessionToken(person.id));
  response.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return response;
}
