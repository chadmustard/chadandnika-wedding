import { NextResponse } from 'next/server';
import { getCurrentPerson } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const person = await getCurrentPerson();
  if (!person) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    displayName?: string;
    attending?: boolean;
    dietaryRestrictions?: string;
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

  const displayName =
    typeof body.displayName === 'string' && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120)
      : person.displayName;

  const dietaryRestrictions =
    typeof body.dietaryRestrictions === 'string'
      ? body.dietaryRestrictions.trim().slice(0, 1000) || null
      : null;

  const updated = await prisma.person.update({
    where: { id: person.id },
    data: {
      displayName,
      attending: body.attending,
      dietaryRestrictions,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    person: {
      id: updated.id,
      displayName: updated.displayName,
      attending: updated.attending,
      dietaryRestrictions: updated.dietaryRestrictions,
      respondedAt: updated.respondedAt?.toISOString() ?? null,
    },
  });
}
