import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EVENTS, anyEventOpen, isEventSlug } from '@/lib/events';
import { isDevBypassEnabled, startGuestSession } from '@/lib/session';

type Params = { params: { token: string } };

/** QR / link entry: `/i/{inviteToken}` signs the guest in and opens their envelope. */
export async function GET(request: NextRequest, { params }: Params) {
  const { token } = params;
  const origin = request.nextUrl.origin;

  if (token === 'dev-bypass' && isDevBypassEnabled()) {
    const response = NextResponse.redirect(new URL('/', origin));
    response.cookies.set('wedding_dev_bypass', '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  // In local dev, invite tokens still work while events are closed.
  const dev = isDevBypassEnabled();
  if (!anyEventOpen() && !dev) {
    return NextResponse.redirect(new URL('/gate?closed=1', origin));
  }

  const person = await prisma.person.findUnique({
    where: { inviteToken: token },
    select: { id: true, firstVisitAt: true, invitations: { select: { event: true } } },
  });

  const invitedToOpenEvent = person?.invitations.some(
    (i) => isEventSlug(i.event) && (EVENTS[i.event].open || dev),
  );
  if (!person || !invitedToOpenEvent) {
    return NextResponse.redirect(new URL('/gate?invalid=1', origin));
  }

  return startGuestSession(NextResponse.redirect(new URL('/', origin)), person);
}
