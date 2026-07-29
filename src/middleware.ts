import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  verifySessionToken,
  isDevBypassEnabled,
} from '@/lib/session-edge';

const PUBLIC_PATHS = ['/i', '/gate'];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Dev bypass: allow browsing without a session when explicitly enabled
  if (isDevBypassEnabled() && request.cookies.get('wedding_dev_bypass')?.value === '1') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.next();
    }
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
