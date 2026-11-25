import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';
import { rateLimit } from '@/lib/rate-limit';
import { EVENTS, anyEventOpen, isEventSlug } from '@/lib/events';
import { firstName } from '@/lib/names';
import { isDevBypassEnabled, startGuestSession } from '@/lib/session';

function clientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Unlock by phone number. If several guests share the number (a couple on one
 * phone), the first call returns `{ choose: [...] }` and the client calls again
 * with the chosen `personId`.
 */
export async function POST(request: NextRequest) {
  if (!anyEventOpen() && !isDevBypassEnabled()) {
    return NextResponse.json(
      { error: 'The site isn’t open to guests yet.' },
      { status: 403 },
    );
  }

  const allowed = await rateLimit(`unlock:${clientKey(request)}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many tries. Wait a bit, or text Chad.' },
      { status: 429 },
    );
  }

  let body: { phone?: unknown; personId?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const phone =
    typeof body.phone === 'string' ? normalizePhone(body.phone.slice(0, 40)) : null;
  if (!phone) {
    return NextResponse.json(
      { error: 'Enter the phone number we have for you, area code and all.' },
      { status: 400 },
    );
  }

  const matches = await prisma.person.findMany({
    where: { phone },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      displayName: true,
      firstVisitAt: true,
      invitations: { select: { event: true } },
    },
  });

  // Only guests invited to an event that's open (dev: any event).
  const eligible = matches.filter((p) =>
    p.invitations.some(
      (i) => isEventSlug(i.event) && (EVENTS[i.event].open || isDevBypassEnabled()),
    ),
  );

  if (eligible.length === 0) {
    return NextResponse.json(
      { error: 'We don’t have that number on the guest list. Try another, or text Chad.' },
      { status: 404 },
    );
  }

  let person = eligible.length === 1 ? eligible[0]! : null;
  if (!person && typeof body.personId === 'string') {
    person = eligible.find((p) => p.id === body.personId) ?? null;
  }

  if (!person) {
    return NextResponse.json({
      choose: eligible.map((p) => ({ id: p.id, firstName: firstName(p.displayName) })),
    });
  }

  return startGuestSession(NextResponse.json({ ok: true }), person);
}
