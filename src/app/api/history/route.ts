import { NextResponse } from 'next/server';
import { getSessionPersonId } from '@/lib/session';
import { getHistoryPeople } from '@/lib/history';

export async function GET() {
  const personId = await getSessionPersonId();
  if (!personId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const people = await getHistoryPeople();
  return NextResponse.json({ people });
}
