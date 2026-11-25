import { NextResponse } from 'next/server';
import { getCurrentPerson } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const person = await getCurrentPerson();
  if (!person) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    attending?: boolean;
    dietaryRestrictions?: string;
    includePersonIds?: string[];
    website?: string; // honeypot
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  if (typeof body.attending !== 'boolean') {
    return NextResponse.json(
      { error: 'attending is required' },
      { status: 400 },
    );
  }

  const dietaryRestrictions =
    typeof body.dietaryRestrictions === 'string'
      ? body.dietaryRestrictions.trim().slice(0, 1000) || null
      : null;

  const householdMemberIds = new Set(
    (person.household?.people ?? []).map((p) => p.id),
  );
  const requestedIds = Array.isArray(body.includePersonIds)
    ? body.includePersonIds.filter((id): id is string => typeof id === 'string')
    : [];

  const includeIds = requestedIds.filter(
    (id) => id !== person.id && householdMemberIds.has(id),
  );
  const targetIds = [person.id, ...includeIds];

  const now = new Date();
  await prisma.person.updateMany({
    where: { id: { in: targetIds } },
    data: {
      attending: body.attending,
      dietaryRestrictions,
      respondedAt: now,
    },
  });

  const updated = await prisma.person.findUnique({
    where: { id: person.id },
  });

  return NextResponse.json({
    ok: true,
    updatedPersonIds: targetIds,
    person: updated
      ? {
          id: updated.id,
          displayName: updated.displayName,
          attending: updated.attending,
          dietaryRestrictions: updated.dietaryRestrictions,
          respondedAt: updated.respondedAt?.toISOString() ?? null,
        }
      : null,
  });
}
