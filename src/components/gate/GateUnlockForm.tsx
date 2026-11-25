'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';

type Choice = { id: string; firstName: string };

export function GateUnlockForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function unlock(personId?: string) {
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, personId, website: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        choose?: Choice[];
      } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? 'Something went sideways.');
      }
      if (data?.choose) {
        setChoices(data.choose);
        setStatus('idle');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went sideways.');
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void unlock();
  }

  if (choices) {
    return (
      <div className="mx-auto mt-10 w-full max-w-sm text-left">
        <p className="text-sm tracking-wide text-wedding-mist/80">
          {copy.gateChooseLabel}
        </p>
        <div className="mt-3 space-y-2">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={status === 'submitting'}
              onClick={() => void unlock(c.id)}
              className="w-full border border-wedding-mist/25 bg-wedding-night/40 px-4 py-3 text-left text-wedding-cream transition hover:border-wedding-sage disabled:opacity-60"
            >
              I’m {c.firstName}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-wedding-blush" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setChoices(null)}
          className="mt-4 text-sm text-wedding-stone underline-offset-4 hover:underline"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-sm text-left">
      <label className="block">
        <span className="text-sm tracking-wide text-wedding-mist/80">
          {copy.gatePhoneLabel}
        </span>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
          placeholder={copy.gatePhonePlaceholder}
          className="mt-2 w-full border border-wedding-mist/25 bg-wedding-night/40 px-4 py-3 text-lg tracking-wide text-wedding-cream outline-none transition placeholder:text-wedding-stone focus:border-wedding-sage"
        />
      </label>

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
        <p className="mt-3 text-sm text-wedding-blush" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-5 w-full border border-wedding-cream/80 bg-wedding-cream px-4 py-3 text-sm font-medium tracking-wide text-wedding-night transition hover:bg-wedding-mist disabled:opacity-60"
      >
        {status === 'submitting' ? copy.gateSubmitting : copy.gateSubmit}
      </button>
    </form>
  );
}
