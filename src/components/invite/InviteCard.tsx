import Link from 'next/link';
import { copy } from '@/lib/copy';
import type { EventInfo } from '@/lib/events';
import type { GuestInvitation } from '@/lib/guest-types';

function rsvpLabel(invitation: GuestInvitation | null) {
  if (!invitation?.respondedAt) return copy.inviteRsvpPending;
  return invitation.attending ? copy.inviteRsvpYes : copy.inviteRsvpNo;
}

/**
 * The invitation itself. `compact` is the version tucked inside the envelope,
 * sized to fit a phone-width envelope. The full version lives on the hub.
 */
export function InviteCard({
  event,
  invitation,
  compact = false,
}: {
  event: EventInfo;
  invitation?: GuestInvitation | null;
  compact?: boolean;
}) {
  const where = [event.venue, event.city].filter(Boolean).join(' · ');
  const when = [event.dateLabel, event.timeLabel].filter(Boolean).join(' · ');

  return (
    <div
      className={`relative h-full w-full overflow-hidden text-center text-wedding-ink shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_40px_-18px_rgba(20,18,16,0.45)] ${
        compact ? 'px-4 py-4 sm:px-8 sm:py-7' : 'px-6 py-10 sm:px-10 sm:py-12'
      }`}
      style={{ background: 'var(--card-paper)' }}
    >
      {/* Inset deckle border */}
      <div className="pointer-events-none absolute inset-2 border border-wedding-ink/15 sm:inset-3" />
      <div className="pointer-events-none absolute inset-3 border border-wedding-ink/5 sm:inset-4" />

      <div className="relative flex h-full flex-col items-center justify-center">
        <p
          className={`uppercase tracking-[0.28em] text-wedding-stone ${
            compact ? 'text-[8px] sm:text-[10px]' : 'text-[11px] sm:text-xs'
          }`}
        >
          {event.kicker}
        </p>
        <p
          className={`font-display leading-[0.95] tracking-tight ${
            compact ? 'mt-2 text-3xl sm:mt-3 sm:text-5xl' : 'mt-5 text-5xl sm:text-6xl'
          }`}
        >
          {copy.brand}
        </p>
        <div
          className={`flex items-center gap-3 text-wedding-blush ${compact ? 'mt-2 sm:mt-3' : 'mt-5'}`}
          aria-hidden="true"
        >
          <span className="h-px w-8 bg-current opacity-60" />
          <span className="text-xs">✦</span>
          <span className="h-px w-8 bg-current opacity-60" />
        </div>
        <p
          className={`font-display italic ${
            compact ? 'mt-1 text-lg sm:mt-2 sm:text-2xl' : 'mt-4 text-3xl'
          }`}
        >
          {event.name}
        </p>
        <p
          className={`text-wedding-charcoal ${
            compact ? 'mt-1 text-[10px] sm:mt-2 sm:text-sm' : 'mt-4 text-base'
          }`}
        >
          {when}
        </p>
        {where ? (
          <p
            className={`text-wedding-stone ${
              compact ? 'text-[10px] sm:text-sm' : 'mt-1 text-base'
            }`}
          >
            {where}
          </p>
        ) : null}

        {!compact ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={`/${event.slug}`}
              className="bg-wedding-ink px-6 py-3 text-sm font-medium tracking-wide text-wedding-cream transition hover:bg-wedding-charcoal"
            >
              {copy.inviteCta}
            </Link>
            <p className="text-xs tracking-wide text-wedding-stone">
              {rsvpLabel(invitation ?? null)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
