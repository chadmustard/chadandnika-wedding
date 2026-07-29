import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSessionToken,
  sessionCookieOptions,
  isDevBypassEnabled,
} from '@/lib/session';

type Params = { params: { token: string } };

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

  const person = await prisma.person.findUnique({
    where: { inviteToken: token },
  });

  if (!person) {
    return NextResponse.redirect(new URL('/gate?invalid=1', origin));
  }

  const now = new Date();
  await prisma.person.update({
    where: { id: person.id },
    data: {
      firstVisitAt: person.firstVisitAt ?? now,
      lastVisitAt: now,
    },
  });

  const sessionToken = await createSessionToken(person.id);
  const response = NextResponse.redirect(new URL('/', origin));
  const opts = sessionCookieOptions(sessionToken);
  response.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return response;
}
