import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE,
  isAdminHost,
  verifyAdminToken,
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

/**
 * admin.<domain> serves the couple's admin panel: `/x` is rewritten to
 * `/admin/x`, and everything but the login page needs the admin cookie.
 * On the guest domain, /admin only exists in local dev.
 */
async function adminMiddleware(request: NextRequest, onAdminHost: boolean) {
  const url = request.nextUrl.clone();
  const path = onAdminHost ? url.pathname : url.pathname.replace(/^\/admin/, '') || '/';
  const base = onAdminHost ? '' : '/admin';

  const authed = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!authed && path !== '/login') {
    url.pathname = `${base}/login`;
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (!onAdminHost) return NextResponse.next();

  if (path === '/admin' || path.startsWith('/admin/')) return NextResponse.next();
  url.pathname = path === '/' ? '/admin' : `/admin${path}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminHost(request.headers.get('host'))) {
    return adminMiddleware(request, true);
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    return adminMiddleware(request, false);
  }

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
