import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeGuestName } from '@/lib/names';
import { rateLimit } from '@/lib/rate-limit';
import { SITE_OPEN } from '@/lib/site';
import {
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/session';

function clientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  if (!SITE_OPEN) {
    return NextResponse.json(
      { error: 'The site isn’t open to guests yet.' },
      { status: 403 },
    );
  }

  if (
    !rateLimit(`unlock:${clientKey(request)}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    })
  ) {
    return NextResponse.json(
      { error: 'Too many tries. Wait a bit, or text Chad.' },
      { status: 429 },
    );
  }

  let body: { fullName?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const fullName =
    typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : '';
  if (!fullName) {
    return NextResponse.json(
      { error: 'Enter your first and last name.' },
      { status: 400 },
    );
  }

  const needle = normalizeGuestName(fullName);
  const people = await prisma.person.findMany({
    select: { id: true, displayName: true, firstVisitAt: true },
  });
  const person = people.find((p) => normalizeGuestName(p.displayName) === needle);

  if (!person) {
    return NextResponse.json(
      { error: 'We couldn’t find that name on the guest list.' },
      { status: 404 },
    );
  }

  const now = new Date();
  await prisma.person.update({
    where: { id: person.id },
    data: {
      firstVisitAt: person.firstVisitAt ?? now,
      lastVisitAt: now,
    },
  });

  const sessionToken = await createSessionToken(person.id);
  const opts = sessionCookieOptions(sessionToken);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return response;
}
