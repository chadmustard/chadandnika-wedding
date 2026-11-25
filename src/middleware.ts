import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  verifySessionToken,
  isDevBypassEnabled,
} from '@/lib/session-edge';
import { anyEventOpen } from '@/lib/events';

const PUBLIC_PATHS = ['/i', '/gate', '/api/unlock'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Dev bypass cookie (local only)
  if (
    isDevBypassEnabled() &&
    request.cookies.get('wedding_dev_bypass')?.value === '1'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // No event open yet: keep guests gated, but allow sessions in local dev.
  if (!anyEventOpen()) {
    if (isDevBypassEnabled() && session) {
      return NextResponse.next();
    }
    const gateUrl = request.nextUrl.clone();
    gateUrl.pathname = '/gate';
    gateUrl.search = '';
    return NextResponse.redirect(gateUrl);
  }

  if (session) {
    return NextResponse.next();
  }

  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = '/gate';
  gateUrl.search = '';
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
