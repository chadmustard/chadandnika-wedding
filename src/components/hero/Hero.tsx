'use client';

import Link from 'next/link';
import { copy } from '@/lib/copy';
import type { SectionId } from '@/components/SiteShell';

type NavItem = { id: SectionId; label: string };

export function Hero({
  eyebrow,
  line,
  image,
  onCta,
  onNavigate,
  nav,
}: {
  eyebrow: string;
  line: string;
  image: string;
  onCta: () => void;
  onNavigate: (id: SectionId) => void;
  nav: NavItem[];
}) {
  return (
    <header className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-wedding-cream">
      {/* Full-bleed visual plane — drop a landscape JPEG at /public/hero/hero.jpg */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 animate-ken-burns bg-cover bg-center"
          style={{
            backgroundImage: `url('${image}'), linear-gradient(160deg, #1a2420 0%, #2c241c 40%, #3d2e28 70%, #1a1814 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wedding-night via-wedding-night/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(12,11,10,0.45)_100%)]" />
      </div>

      <Link
        href="/"
        className="absolute left-6 top-6 z-10 text-xs uppercase tracking-[0.2em] text-wedding-mist/75 transition hover:text-wedding-cream"
      >
        ← {copy.heroBack}
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-28 sm:pb-20">
        <p className="mb-4 animate-fade-up text-xs uppercase tracking-[0.3em] text-wedding-mist/80 sm:text-sm">
          {eyebrow}
        </p>
        <p className="animate-fade-up font-display text-6xl leading-none tracking-tight sm:text-7xl md:text-8xl">
          {copy.brand}
        </p>
        <p
          className="mt-5 max-w-md animate-fade-up text-base leading-relaxed text-wedding-mist/90 sm:text-lg"
          style={{ animationDelay: '120ms' }}
        >
          {line}
        </p>
        <div
          className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: '220ms' }}
        >
          <button
            type="button"
            onClick={onCta}
            className="bg-wedding-cream px-6 py-3 text-sm font-medium tracking-wide text-wedding-ink transition hover:bg-white"
          >
            {copy.heroCta}
          </button>
          <div className="flex flex-wrap gap-3 text-sm text-wedding-mist/70">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="underline-offset-4 transition hover:text-wedding-cream hover:underline"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
