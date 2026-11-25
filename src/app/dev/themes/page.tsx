import { notFound } from 'next/navigation';
import { THEMES, themeSwitcherEnabled } from '@/lib/themes';
import { EnvelopeSketch } from '@/components/theme/EnvelopeSketch';

export const metadata = { title: 'Design directions' };

const SWATCHES = [
  ['surface', '--c-surface'],
  ['paper', '--c-paper'],
  ['ink', '--c-ink'],
  ['night', '--c-night'],
  ['accent', '--c-accent'],
  ['accent 2', '--c-accent-2'],
  ['gold', '--c-gold'],
] as const;

/** Dev-only side-by-side of every direction: palette, type, envelope. */
export default function ThemesPage() {
  if (!themeSwitcherEnabled) notFound();

  return (
    <main className="min-h-screen bg-neutral-200 p-4 sm:p-8">
      <h1 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-600">
        Design directions — palette, type, envelope
      </h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {THEMES.flatMap((t) =>
          (['light', 'dark'] as const).map((mode) => (
            <section
              key={`${t.id}-${mode}`}
              data-theme={t.id}
              data-mode={mode}
              className="overflow-hidden rounded-theme bg-wedding-cream p-5 font-sans text-wedding-ink shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-wedding-stone">
                {mode}
              </p>
              <h2 className="display-face font-display text-4xl leading-tight">
                {t.label}
              </h2>
              <p className="mt-1 text-sm text-wedding-stone">{t.blurb}</p>
              <div className="mt-4 flex overflow-hidden rounded-theme ring-1 ring-wedding-ink/10">
                {SWATCHES.map(([name, v]) => (
                  <div
                    key={name}
                    title={name}
                    className="h-10 flex-1"
                    style={{ background: `rgb(var(${v}))` }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="hero-cta mt-4 px-5 py-2 text-xs font-medium tracking-wide"
              >
                RSVP
              </button>
              {mode === 'light' ? <EnvelopeSketch /> : null}
              {mode === 'dark' ? (
                <p className="mt-6 text-xs text-wedding-stone">
                  Envelope colors are physical, so they don’t change in dark
                  mode.
                </p>
              ) : null}
            </section>
          )),
        )}
      </div>
    </main>
  );
}
