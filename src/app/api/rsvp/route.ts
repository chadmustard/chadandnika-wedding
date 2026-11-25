import { NextResponse } from 'next/server';
import { getSessionPersonId } from '@/lib/session';
import { getGuestById, invitationFor } from '@/lib/guest';
import { isEventSlug } from '@/lib/events';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const personId = await getSessionPersonId();
  const guest = personId ? await getGuestById(personId) : null;
  if (!guest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    event?: unknown;
    attending?: unknown;
    dietaryRestrictions?: unknown;
    includePersonIds?: unknown;
    website?: unknown; // honeypot
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  if (!isEventSlug(body.event)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  }
  const event = body.event;

  if (!invitationFor(guest, event)) {
    return NextResponse.json(
      { error: 'You’re not on the list for this one.' },
      { status: 403 },
    );
  }

  if (typeof body.attending !== 'boolean') {
    return NextResponse.json({ error: 'attending is required' }, { status: 400 });
  }

  const dietaryRestrictions =
    typeof body.dietaryRestrictions === 'string'
      ? body.dietaryRestrictions.trim().slice(0, 1000) || null
      : null;

  // Household members can be RSVP'd for, but only for events they're invited to.
  const allowedOthers = new Set(
    guest.householdMembers
      .filter((m) => invitationFor(m, event))
      .map((m) => m.id),
  );
  const requested = Array.isArray(body.includePersonIds)
    ? body.includePersonIds.filter((id): id is string => typeof id === 'string')
    : [];
  const targetIds = [guest.id, ...requested.filter((id) => allowedOthers.has(id))];

  await prisma.invitation.updateMany({
    where: { event, personId: { in: targetIds } },
    data: {
      attending: body.attending,
      dietaryRestrictions,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, updatedPersonIds: targetIds });
}
