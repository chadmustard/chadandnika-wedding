'use client';

import { useEffect, useState } from 'react';
import { motion, type Transition } from 'motion/react';
import { copy } from '@/lib/copy';
import type { EventInfo } from '@/lib/events';
import { InviteCard } from './InviteCard';

/**
 * arrive   envelope flies in from off-screen
 * sealed   waits for a tap on the wax seal
 * breaking seal cracks in two
 * opening  flap folds back
 * rising   invite card(s) slide up out of the envelope
 * leaving  envelope falls away; cards stay put, then morph into the hub
 */
type Phase = 'arrive' | 'sealed' | 'breaking' | 'opening' | 'rising' | 'leaving';

const ORDER: Phase[] = ['arrive', 'sealed', 'breaking', 'opening', 'rising', 'leaving'];
const after = (phase: Phase, ref: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(ref);

const EASE: Transition['ease'] = [0.22, 1, 0.36, 1];

const SEAL_CLASS =
  'absolute inset-0 flex items-center justify-center rounded-full font-display text-lg text-[#f3d9cf] sm:text-2xl';
const SEAL_BG = 'radial-gradient(circle at 35% 30%, var(--seal-light), var(--seal) 62%)';

// Envelope is 100 × 64 units; the flap's tip sits at y = 36.
const FLAP_TIP = 36 / 64;

export function EnvelopeReveal({
  events,
  addressee,
  onOpened,
}: {
  events: EventInfo[];
  addressee: string;
  onOpened: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('arrive');

  // Timed steps once the guest breaks the seal.
  useEffect(() => {
    const next: Partial<Record<Phase, [Phase | 'done', number]>> = {
      breaking: ['opening', 420],
      opening: ['rising', 650],
      rising: ['leaving', 1300],
      leaving: ['done', 520],
    };
    const step = next[phase];
    if (!step) return;
    const t = setTimeout(() => {
      if (step[0] === 'done') onOpened();
      else setPhase(step[0]);
    }, step[1]);
    return () => clearTimeout(t);
  }, [phase, onOpened]);

  const open = () => {
    if (phase === 'sealed' || phase === 'arrive') setPhase('breaking');
  };

  const leaving = phase === 'leaving';
  const bodyFade = {
    opacity: leaving ? 0 : 1,
    transition: { duration: 0.45, ease: EASE },
  };
  const flapOpen = after(phase, 'opening');
  const count = events.length;

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4">
      <button
        type="button"
        onClick={onOpened}
        className="absolute right-4 top-4 z-50 text-xs uppercase tracking-[0.2em] text-wedding-mist/60 transition hover:text-wedding-cream sm:right-6 sm:top-6"
      >
        {copy.envelopeSkip}
      </button>

      <motion.div
        className="relative"
        style={{ width: 'min(88vw, 560px)', aspectRatio: '100 / 64' }}
        initial={{ x: '-120vw', y: 80, rotate: -16 }}
        animate={{
          x: 0,
          y: after(phase, 'rising') ? '22%' : 0,
          rotate: after(phase, 'breaking') ? 0 : -2,
        }}
        transition={{
          x: { duration: 1.15, ease: EASE },
          y: { duration: after(phase, 'rising') ? 0.9 : 1.15, ease: EASE },
          rotate: { duration: 1.3, ease: EASE },
        }}
        onAnimationComplete={() => setPhase((p) => (p === 'arrive' ? 'sealed' : p))}
      >
        {/* Back wall + liner peeking out the top */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-[3px] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--envelope-shade)', zIndex: 0 }}
          animate={bodyFade}
        >
          <svg viewBox="0 0 100 64" preserveAspectRatio="none" className="h-full w-full">
            <polygon points="0,0 100,0 50,36" fill="var(--envelope-liner)" />
          </svg>
        </motion.div>

        {/* Invite cards */}
        <div className="absolute inset-x-[5%] bottom-[5%] top-[4%]" style={{ zIndex: 10 }}>
          {events.map((event, i) => {
            const fan = count > 1 ? (i - (count - 1) / 2) * 2 : 0; // -1, 1
            return (
              <motion.div
                key={event.slug}
                layoutId={`invite-${event.slug}`}
                className="absolute inset-0"
                style={{ zIndex: count - i }}
                animate={
                  after(phase, 'rising')
                    ? { y: '-62%', x: `${fan * 9}%`, rotate: fan * 4 }
                    : { y: 0, x: 0, rotate: 0 }
                }
                transition={{ duration: 0.95, ease: EASE, delay: i * 0.12 }}
              >
                <InviteCard event={event} compact />
              </motion.div>
            );
          })}
        </div>

        {/* Front pocket */}
        <motion.svg
          viewBox="0 0 100 64"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 20 }}
          animate={bodyFade}
        >
          <polygon points="0,0 50,35 0,64" fill="var(--envelope-paper)" />
          <polygon points="100,0 50,35 100,64" fill="var(--envelope-paper)" />
          <polyline
            points="0,0 50,35 100,0"
            fill="none"
            stroke="var(--envelope-edge)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points="0,64 50,29 100,64"
            fill="var(--envelope-paper)"
            stroke="var(--envelope-edge)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </motion.svg>

        {/* Addressed to */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-[9%] px-6 text-center"
          style={{ zIndex: 21 }}
          animate={bodyFade}
        >
          <p className="text-[9px] uppercase tracking-[0.3em] text-wedding-stone sm:text-[11px]">
            {copy.envelopeTo}
          </p>
          <p className="mt-1 font-display text-xl italic leading-tight text-wedding-ink sm:text-3xl">
            {addressee}
          </p>
        </motion.div>

        {/* Stamp */}
        <motion.div
          className="pointer-events-none absolute right-[4%] top-[6%] flex aspect-[4/5] w-[11%] items-center justify-center border-2 border-dotted border-[var(--envelope-paper)] text-center font-display text-[10px] leading-none text-white/90 sm:text-sm"
          style={{ zIndex: 35, background: 'var(--envelope-liner-accent)' }}
          animate={{ opacity: flapOpen ? 0 : 1, transition: { duration: 0.3 } }}
        >
          C&amp;V
        </motion.div>

        {/* Flap. Its wrapper owns z-index; drop it behind the cards once folded back. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: `${FLAP_TIP * 100}%`,
            zIndex: after(phase, 'rising') ? 5 : 30,
            perspective: 900,
          }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformOrigin: 'top', transformStyle: 'preserve-3d' }}
            animate={{ rotateX: flapOpen ? 180 : 0, ...bodyFade }}
            transition={{ rotateX: { duration: 0.65, ease: [0.45, 0, 0.2, 1] } }}
          >
            <svg
              viewBox="0 0 100 36"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.12)]"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <polygon points="0,0 100,0 50,36" fill="var(--envelope-paper)" />
              <polyline
                points="0,0 50,36 100,0"
                fill="none"
                stroke="var(--envelope-edge)"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <svg
              viewBox="0 0 100 36"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <polygon points="0,0 100,0 50,36" fill="var(--envelope-liner)" />
            </svg>
          </motion.div>
        </div>

        {/* Wax seal */}
        <button
          type="button"
          onClick={open}
          aria-label={copy.envelopeOpenLabel}
          disabled={after(phase, 'breaking')}
          className="absolute aspect-square w-[15%] min-w-[54px] max-w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wedding-cream"
          style={{ left: '50%', top: `${FLAP_TIP * 100}%`, zIndex: 40 }}
        >
          {!after(phase, 'breaking') ? (
            <motion.span
              className={`${SEAL_CLASS} shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35),inset_0_3px_5px_rgba(255,255,255,0.18),0_4px_10px_rgba(0,0,0,0.35)]`}
              style={{ background: SEAL_BG }}
              animate={phase === 'sealed' ? { scale: [1, 1.07, 1] } : { scale: 1 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              C&amp;V
            </motion.span>
          ) : (
            (['left', 'right'] as const).map((side) => (
              <motion.span
                key={side}
                className={`${SEAL_CLASS} shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35),inset_0_3px_5px_rgba(255,255,255,0.18)]`}
                style={{
                  background: SEAL_BG,
                  clipPath: side === 'left' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: side === 'left' ? -26 : 26,
                  y: 34,
                  rotate: side === 'left' ? -28 : 28,
                  opacity: 0,
                }}
                transition={{ duration: 0.45, ease: 'easeIn' }}
              >
                C&amp;V
              </motion.span>
            ))
          )}
        </button>

      </motion.div>

      <motion.p
        className="mt-10 text-sm tracking-wide text-wedding-mist/75"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: phase === 'sealed' ? 1 : 0, y: phase === 'sealed' ? 0 : 8 }}
        transition={{ duration: 0.5 }}
      >
        {count > 1 ? copy.envelopeHintMany : copy.envelopeHint}
      </motion.p>
    </div>
  );
}
