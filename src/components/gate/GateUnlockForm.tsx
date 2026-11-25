'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';

export function GateUnlockForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, website: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? 'Something went sideways.');
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went sideways.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-sm text-left">
      <label className="block">
        <span className="text-sm tracking-wide text-wedding-mist/80">
          {copy.gateNameLabel}
        </span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
          placeholder={copy.gateNamePlaceholder}
          className="mt-2 w-full border border-wedding-mist/25 bg-wedding-night/40 px-4 py-3 text-wedding-cream outline-none transition placeholder:text-wedding-stone focus:border-wedding-sage"
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
