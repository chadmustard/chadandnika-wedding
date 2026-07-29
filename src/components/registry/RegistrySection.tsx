'use client';

import { useState } from 'react';
import { copy } from '@/lib/copy';

export function RegistrySection() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="registry"
      className="scroll-mt-16 border-b border-wedding-ink/10 bg-[linear-gradient(180deg,#ebe3d6_0%,#f2ebe1_100%)] px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          {copy.registryHeadline}
        </h2>
        <p className="mt-3 text-wedding-stone">{copy.registrySub}</p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mt-10 block w-full text-left"
        >
          <div className="relative overflow-hidden border border-wedding-ink/10 bg-wedding-night text-wedding-cream transition group-hover:border-wedding-ink/30">
            <div
              className="absolute inset-0 opacity-60 transition duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #2a3a32 0%, #3d2e28 50%, #1a1814 100%)',
              }}
            />
            <div className="relative px-6 py-16 sm:px-10 sm:py-20">
              <p className="text-xs uppercase tracking-[0.2em] text-wedding-mist/60">
                One tile
              </p>
              <h3 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                {copy.honeymoonTitle}
              </h3>
              <p className="mt-3 max-w-md text-sm text-wedding-mist/80 sm:text-base">
                {copy.honeymoonBlurb}
              </p>
              <span className="mt-6 inline-block text-sm tracking-wide underline underline-offset-4">
                Open details
              </span>
            </div>
          </div>
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-wedding-night/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="honeymoon-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg animate-fade-up border border-wedding-ink/10 bg-wedding-cream p-6 text-wedding-ink shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="honeymoon-title"
              className="font-display text-3xl tracking-tight"
            >
              {copy.honeymoonTitle}
            </h3>
            <p className="mt-4 leading-relaxed text-wedding-charcoal">
              {copy.honeymoonBlurb}
            </p>
            <p className="mt-4 leading-relaxed text-wedding-stone">
              {copy.honeymoonVenmoNote}
            </p>
            <a
              href={`https://venmo.com/${copy.honeymoonVenmoHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block bg-wedding-ink px-5 py-3 text-sm tracking-wide text-wedding-cream transition hover:bg-wedding-charcoal"
            >
              Venmo {copy.honeymoonVenmoHandle}
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 block text-sm text-wedding-stone underline-offset-4 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
