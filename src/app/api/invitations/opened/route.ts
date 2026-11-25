import { NextResponse } from 'next/server';
import { getSessionPersonId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/** The guest watched their envelope open; don't auto-play it next visit. */
export async function POST() {
  const personId = await getSessionPersonId();
  if (!personId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.invitation.updateMany({
    where: { personId, openedAt: null },
    data: { openedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
