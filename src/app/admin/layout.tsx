import type { Metadata } from 'next';
import Link from 'next/link';
import { copy } from '@/lib/copy';
import { adminBase, isAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: `%s · Admin · ${copy.brand}` },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/', label: 'Guests & RSVPs' },
  { href: '/rooms', label: 'Travel & rooms' },
  { href: '/gifts', label: 'Gifts' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const base = adminBase();
  const signedIn = await isAdmin();

  return (
    <div className="min-h-screen bg-[#f6f2ec] text-wedding-ink">
      {signedIn ? (
        <header className="sticky top-0 z-30 border-b border-wedding-ink/10 bg-wedding-night text-wedding-cream">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-1 px-5 py-3">
            <Link href={`${base}/`} className="font-display text-2xl tracking-tight">
              C&amp;V <span className="text-wedding-mist/60">admin</span>
            </Link>
            <nav className="order-last -mx-2 flex w-full gap-1 overflow-x-auto whitespace-nowrap text-sm sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={`${base}${item.href}`}
                  className="rounded-md px-3 py-1.5 text-wedding-mist/80 transition hover:bg-white/10 hover:text-wedding-cream"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={`${base}/logout`} method="post" className="ml-auto sm:ml-0">
              <button className="text-sm text-wedding-mist/60 transition hover:text-wedding-cream">
                Sign out
              </button>
            </form>
          </div>
        </header>
      ) : null}
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
