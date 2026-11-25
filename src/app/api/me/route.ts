import { NextResponse } from 'next/server';
import { getCurrentGuest } from '@/lib/guest';

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: guest.id,
    displayName: guest.displayName,
    events: guest.invitations.map((i) => i.event),
  });
}
