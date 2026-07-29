import { NextResponse } from 'next/server';
import { getCurrentPerson } from '@/lib/session';

export async function GET() {
  const person = await getCurrentPerson();
  if (!person) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: person.id,
    displayName: person.displayName,
  });
}
