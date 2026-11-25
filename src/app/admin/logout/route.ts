import { type NextRequest } from 'next/server';
import { ADMIN_COOKIE, isAdminHost } from '@/lib/session-edge';

export async function POST(request: NextRequest) {
  const base = isAdminHost(request.headers.get('host')) ? '' : '/admin';
  // Relative Location: after the admin.* rewrite, request.url no longer carries
  // the admin subdomain, so an absolute URL would bounce to the guest site.
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${base}/login`,
      'Set-Cookie': `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    },
  });
}
