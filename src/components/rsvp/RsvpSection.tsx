'use client';

import { useState, type FormEvent } from 'react';
import { copy } from '@/lib/copy';
import type { GuestPerson } from '@/components/SiteShell';

export function RsvpSection({ person }: { person: GuestPerson | null }) {
  const [displayName, setDisplayName] = useState(person?.displayName ?? '');
  const [attending, setAttending] = useState<boolean | null>(
    person?.attending ?? null,
  );
  const [dietary, setDietary] = useState(person?.dietaryRestrictions ?? '');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>(
    person?.respondedAt ? 'done' : 'idle',
  );
  const [savedAttending, setSavedAttending] = useState(person?.attending ?? null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (attending === null) {
      setError('Yes or no. We can handle either.');
      return;
    }
    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          attending,
          dietaryRestrictions: dietary,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? 'Something went sideways.');
      }
      setSavedAttending(attending);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went sideways.');
    }
  }

  return (
    <section
      id="rsvp"
      className="scroll-mt-16 border-b border-wedding-ink/10 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-xl">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          {copy.rsvpHeadline}
        </h2>
        <p className="mt-3 text-wedding-stone">{copy.rsvpSub}</p>

        {status === 'done' ? (
          <div className="mt-10 animate-fade-up border-l-2 border-wedding-sage pl-5">
            <p className="text-lg leading-relaxed">
              {savedAttending ? copy.rsvpSuccessYes : copy.rsvpSuccessNo}
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm text-wedding-stone underline-offset-4 hover:underline"
            >
              Change your mind
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <label className="block">
              <span className="text-sm tracking-wide text-wedding-stone">
                {copy.rsvpNameLabel}
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-2 w-full border border-wedding-ink/15 rounded-theme bg-wedding-field px-4 py-3 outline-none transition focus:border-wedding-sage"
              />
            </label>

            <fieldset>
              <legend className="text-sm tracking-wide text-wedding-stone">
                {copy.rsvpAttendingLabel}
              </legend>
              <div className="mt-3 flex gap-3">
                {[
                  { value: true, label: copy.rsvpAttendingYes },
                  { value: false, label: copy.rsvpAttendingNo },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setAttending(opt.value)}
                    className={`flex-1 rounded-btn border px-4 py-3 text-sm tracking-wide transition ${
                      attending === opt.value
                        ? 'border-wedding-ink bg-wedding-ink text-wedding-cream'
                        : 'border-wedding-ink/15 bg-wedding-field/60 hover:border-wedding-ink/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm tracking-wide text-wedding-stone">
                {copy.rsvpDietaryLabel}
              </span>
              <textarea
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                rows={3}
                placeholder={copy.rsvpDietaryPlaceholder}
                className="mt-2 w-full resize-y border border-wedding-ink/15 rounded-theme bg-wedding-field px-4 py-3 outline-none transition focus:border-wedding-sage"
              />
            </label>

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            {error ? (
              <p className="text-sm text-wedding-blush" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="rounded-btn bg-wedding-ink px-6 py-3 text-sm font-medium tracking-wide text-wedding-cream transition hover:bg-wedding-charcoal disabled:opacity-60"
            >
              {status === 'submitting' ? copy.rsvpSubmitting : copy.rsvpSubmit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
