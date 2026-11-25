/**
 * The events this site invites people to. Guests get an `Invitation` row per
 * event (see `prisma/schema.prisma`); everything else about an event lives here.
 *
 * Flip `open` to let guests unlock the site for that event. While no event is
 * open, everyone stays on /gate (local dev bypass still works).
 */
export type EventSlug = 'engagement' | 'wedding';

export type EventInfo = {
  slug: EventSlug;
  name: string;
  /** Line above the couple's names on the invite card. */
  kicker: string;
  dateLabel: string;
  timeLabel: string | null;
  venue: string | null;
  city: string | null;
  /** Google Maps search link, when there's a venue. */
  mapUrl: string | null;
  /** Guests can unlock + RSVP for this event. */
  open: boolean;
  /** Seed-time label used in guests.csv's Events column. */
  csvKey: string;
};

export const EVENTS: Record<EventSlug, EventInfo> = {
  engagement: {
    slug: 'engagement',
    name: 'Engagement Party',
    kicker: 'Come celebrate the engagement of',
    // Placeholder details — confirm before invites go out.
    dateLabel: 'Saturday, May 8, 2027',
    timeLabel: '6:00 PM',
    venue: 'Parks and Rec',
    city: 'Blue Ash, Ohio',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Parks+and+Rec+Blue+Ash+Ohio',
    open: false,
    csvKey: 'engagement',
  },
  wedding: {
    slug: 'wedding',
    name: 'Wedding',
    kicker: 'Request the pleasure of your company at the wedding of',
    dateLabel: 'Date to come',
    timeLabel: null,
    venue: null,
    city: null,
    mapUrl: null,
    open: false,
    csvKey: 'wedding',
  },
};

/** Display order: soonest first. */
export const EVENT_ORDER: EventSlug[] = ['engagement', 'wedding'];

export function isEventSlug(value: unknown): value is EventSlug {
  return typeof value === 'string' && value in EVENTS;
}

export function anyEventOpen(): boolean {
  return EVENT_ORDER.some((slug) => EVENTS[slug].open);
}

export function sortEvents<T extends { event: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      EVENT_ORDER.indexOf(a.event as EventSlug) -
      EVENT_ORDER.indexOf(b.event as EventSlug),
  );
}
