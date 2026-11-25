'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, type ReactNode, type SelectHTMLAttributes } from 'react';
import { login, type LoginState } from '@/app/admin/actions';

export function SubmitButton({
  children,
  variant = 'primary',
}: {
  children: ReactNode;
  variant?: 'primary' | 'quiet';
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === 'primary'
          ? 'rounded-md bg-wedding-ink px-4 py-2 text-sm font-medium text-wedding-cream transition hover:bg-wedding-charcoal disabled:opacity-60'
          : 'text-sm text-wedding-stone underline-offset-4 transition hover:text-wedding-blush hover:underline disabled:opacity-60'
      }
    >
      {pending ? 'Saving…' : children}
    </button>
  );
}

/** A select that saves as soon as it changes (inside a server-action form). */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { pending } = useFormStatus();
  return (
    <select
      {...props}
      disabled={pending || props.disabled}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`rounded-md border border-wedding-ink/15 bg-white px-2 py-1 text-sm outline-none focus:border-wedding-sage disabled:opacity-60 ${props.className ?? ''}`}
    />
  );
}

/** A checkbox that saves as soon as it's toggled. */
export function AutoSubmitCheckbox({
  name,
  checked,
  label,
}: {
  name: string;
  checked: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="hidden" name={name} value={checked ? '0' : '1'} />
      <input
        type="checkbox"
        defaultChecked={checked}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-4 w-4 accent-wedding-sage"
      />
      <span className={checked ? 'text-wedding-sage' : 'text-wedding-stone'}>{label}</span>
    </label>
  );
}

export function LoginForm({ home }: { home: string }) {
  const [state, action] = useFormState<LoginState, FormData>(login, { error: null });
  // Full page load so the request goes through the admin host rewrite.
  useEffect(() => {
    if (state.ok) window.location.assign(home);
  }, [state.ok, home]);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm text-wedding-stone">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-wedding-ink/15 bg-white px-3 py-2 outline-none focus:border-wedding-sage"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-wedding-blush" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
