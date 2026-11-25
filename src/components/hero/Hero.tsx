'use client';

import { copy } from '@/lib/copy';
import { HeroDecor } from '@/components/theme/ThemeDecor';

type NavItem = { id: string; label: string };

export function Hero({
  onCta,
  onNavigate,
  nav,
}: {
  onCta: () => void;
  onNavigate: (id: 'rsvp' | 'registry' | 'schedule' | 'history') => void;
  nav: NavItem[];
}) {
  return (
    <header className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-wedding-onnight">
      {/* Full-bleed visual plane — drop a landscape JPEG at /public/hero/hero.jpg */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 animate-ken-burns bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/hero/proposal-3.jpg'), linear-gradient(160deg, #1a2420 0%, #2c241c 40%, #3d2e28 70%, #1a1814 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wedding-night via-wedding-night/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(12,11,10,0.45)_100%)]" />
      </div>
      <HeroDecor />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-28 sm:pb-20">
        <p className="hero-title animate-fade-up font-display text-6xl leading-none tracking-tight sm:text-7xl md:text-8xl">
          {copy.brand}
        </p>
        <p
          className="mt-5 max-w-md animate-fade-up text-base leading-relaxed text-wedding-mist/90 sm:text-lg"
          style={{ animationDelay: '120ms' }}
        >
          {copy.heroLine}
        </p>
        <div
          className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: '220ms' }}
        >
          <button
            type="button"
            onClick={onCta}
            className="hero-cta px-6 py-3 text-sm font-medium tracking-wide transition"
          >
            {copy.heroCta}
          </button>
          <div className="flex flex-wrap gap-3 text-sm text-wedding-mist/70">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onNavigate(
                    item.id as 'rsvp' | 'registry' | 'schedule' | 'history',
                  )
                }
                className="underline-offset-4 transition hover:text-wedding-onnight hover:underline"
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
