import { copy } from '@/lib/copy';

/**
 * Static sketch of the upcoming animated invite, styled only from the
 * active theme's --env-* tokens. Not the real animation — just enough to
 * judge how each direction would dress the envelope, seal and card.
 */
export function EnvelopeSketch() {
  return (
    <div className="relative mx-auto mt-28 h-44 w-72">
      {/* open flap, folded up behind the card */}
      <div
        className="absolute inset-x-0 bottom-full h-20"
        style={{
          background: 'var(--env-liner)',
          clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
        }}
      />
      {/* card popping out */}
      <div
        className="absolute inset-x-5 -top-14 h-40 rounded-theme px-4 pt-5 text-center shadow-md"
        style={{ background: 'var(--env-card)', color: 'rgb(var(--c-ink))' }}
      >
        <p className="text-[9px] uppercase tracking-[0.3em] opacity-60">
          You’re invited
        </p>
        <p className="display-face mt-1 font-display text-2xl leading-none">
          {copy.brand}
        </p>
        <p className="mt-2 text-[10px] opacity-70">May 8, 2027 · Blue Ash, OH</p>
      </div>
      {/* envelope front pocket */}
      <div
        className="absolute inset-0 shadow-xl"
        style={{
          background: 'var(--env-paper)',
          clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)',
        }}
      />
      {/* wax seal */}
      <div
        className="absolute left-1/2 top-[44%] grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full font-display text-sm text-white shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35),0_3px_6px_rgba(0,0,0,0.25)]"
        style={{ background: 'var(--env-seal)' }}
      >
        C&amp;V
      </div>
    </div>
  );
}
