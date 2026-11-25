import { NextResponse } from 'next/server';
import { getSessionPersonId } from '@/lib/session';
import { getHistoryPeople, hasInvitation } from '@/lib/history';

export async function GET() {
  const personId = await getSessionPersonId();
  if (!personId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await hasInvitation(personId, 'wedding'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const people = await getHistoryPeople();
  return NextResponse.json({ people });
}
