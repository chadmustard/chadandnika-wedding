import Link from 'next/link';
import { copy } from '@/lib/copy';
import { anyEventOpen } from '@/lib/events';
import { isDevBypassEnabled } from '@/lib/session-edge';
import { GateUnlockForm } from '@/components/gate/GateUnlockForm';

export const metadata = {
  title: 'Invite only',
};

type Props = {
  searchParams?: { invalid?: string; closed?: string };
};

export default function GatePage({ searchParams }: Props) {
  const showDevHint = isDevBypassEnabled();
  const open = anyEventOpen();
  const invalid = searchParams?.invalid === '1';
  // Local dev can unlock while every event is still closed.
  const closed = (!open && !showDevHint) || searchParams?.closed === '1';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-wedding-night px-6 text-wedding-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 30% 20%, rgba(196,120,106,0.35), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(107,122,98,0.3), transparent 45%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 max-w-lg text-center animate-fade-up">
        <p className="font-display text-5xl tracking-tight sm:text-6xl">
          {copy.brand}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-wedding-mist/40" />
        <h1 className="mt-8 font-display text-3xl tracking-tight sm:text-4xl">
          {invalid
            ? 'That invite didn’t scan.'
            : closed
              ? copy.gateClosedTitle
              : copy.gateTitle}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-wedding-mist/85 sm:text-lg">
          {invalid
            ? 'Double-check the QR, or text Chad. He loves mysteries.'
            : closed
              ? copy.gateClosedBody
              : copy.gateBody}
        </p>
        {!closed && !invalid ? (
          <p className="mt-4 text-sm leading-relaxed text-wedding-stone sm:text-base">
            {copy.gateHint}
          </p>
        ) : null}

        {!closed ? <GateUnlockForm /> : null}

        {showDevHint ? (
          <p className="mt-10 text-xs text-wedding-stone">
            Dev bypass:{' '}
            <Link
              href="/i/dev-bypass"
              className="underline decoration-wedding-sage/60 underline-offset-4 hover:text-wedding-cream"
            >
              /i/dev-bypass
            </Link>{' '}
            or seed tokens like{' '}
            <Link
              href="/i/dev-chad"
              className="underline decoration-wedding-sage/60 underline-offset-4 hover:text-wedding-cream"
            >
              /i/dev-chad
            </Link>
            {!open ? (
              <span className="mt-2 block text-wedding-mist/60">
                Every event in src/lib/events.ts is closed. Guests stay gated; dev unlock still works.
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </main>
  );
}
