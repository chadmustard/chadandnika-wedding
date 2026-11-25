'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { copy } from '@/lib/copy';
import { EVENTS } from '@/lib/events';
import { invitationFor, type Guest } from '@/lib/guest-types';
import { RegistrySection } from '@/components/registry/RegistrySection';
import { EnvelopeReveal } from './EnvelopeReveal';
import { InviteCard } from './InviteCard';

/**
 * Home for a signed-in guest: plays the envelope the first time (or on
 * replay), then shows each invitation they have plus the shared registry.
 */
export function InviteHome({ guest }: { guest: Guest }) {
  const reduceMotion = useReducedMotion();
  const unopened = guest.invitations.some((i) => !i.openedAt);
  const [stage, setStage] = useState<'envelope' | 'hub'>(
    unopened ? 'envelope' : 'hub',
  );

  const events = guest.invitations.map((i) => EVENTS[i.event]);

  const onOpened = useCallback(() => {
    setStage('hub');
    window.scrollTo({ top: 0 });
    void fetch('/api/invitations/opened', { method: 'POST' }).catch(() => {});
  }, []);

  // Guests who prefer reduced motion skip straight to their invitations.
  useEffect(() => {
    if (reduceMotion && stage === 'envelope') onOpened();
  }, [reduceMotion, stage, onOpened]);

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="min-h-screen bg-wedding-night text-wedding-cream">
          <div
            className="pointer-events-none fixed inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 25% 15%, rgba(196,120,106,0.28), transparent 50%), radial-gradient(ellipse at 75% 85%, rgba(107,122,98,0.28), transparent 45%)',
            }}
          />

          {stage === 'envelope' ? (
            <EnvelopeReveal
              events={events}
              addressee={guest.addressee}
              onOpened={onOpened}
            />
          ) : (
            <>
              <section className="relative px-5 pb-20 pt-16 sm:pt-24">
                <motion.div
                  className="mx-auto max-w-2xl text-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-wedding-mist/60">
                    {guest.addressee}
                  </p>
                  <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-6xl">
                    {events.length > 1 ? copy.hubTitleMany : copy.hubTitle}
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-wedding-mist/80">
                    {events.length > 1 ? copy.hubBodyMany : copy.hubBody}
                  </p>
                </motion.div>

                <div
                  className={`mx-auto mt-12 grid gap-8 ${
                    events.length > 1 ? 'max-w-5xl md:grid-cols-2' : 'max-w-md'
                  }`}
                >
                  {events.map((event, i) => (
                    <motion.div
                      key={event.slug}
                      layoutId={`invite-${event.slug}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                    >
                      <InviteCard
                        event={event}
                        invitation={invitationFor(guest, event.slug)}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setStage('envelope')}
                    className="text-sm text-wedding-mist/60 underline-offset-4 transition hover:text-wedding-cream hover:underline"
                  >
                    {copy.hubReplay}
                  </button>
                </div>
              </section>

              <div className="relative bg-wedding-cream text-wedding-ink">
                <RegistrySection />
                <footer className="px-6 py-10 text-center">
                  <p className="font-display text-2xl tracking-tight">{copy.brand}</p>
                  <p className="mt-2 text-sm text-wedding-stone">{copy.footerLine}</p>
                </footer>
              </div>
            </>
          )}
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
