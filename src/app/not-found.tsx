import Link from 'next/link';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-wedding-night px-6 text-center text-wedding-onnight">
      <p className="font-display text-4xl">{copy.brand}</p>
      <h1 className="mt-6 font-display text-3xl">{copy.notFoundTitle}</h1>
      <p className="mt-3 max-w-sm text-wedding-mist/80">{copy.notFoundBody}</p>
      <Link
        href="/"
        className="mt-8 border border-wedding-mist/30 px-5 py-2.5 text-sm tracking-wide transition hover:border-wedding-mist hover:bg-white/5"
      >
        {copy.notFoundCta}
      </Link>
    </main>
  );
}
