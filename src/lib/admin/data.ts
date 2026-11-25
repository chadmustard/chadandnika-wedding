import { prisma } from '../prisma';
import { formatAddressee } from '../names';
import { EVENT_ORDER, isEventSlug, type EventSlug } from '../events';

export type RsvpStatus = 'yes' | 'no' | 'pending';

export function rsvpStatus(inv: { attending: boolean | null; respondedAt: Date | null }): RsvpStatus {
  if (!inv.respondedAt || inv.attending === null) return 'pending';
  return inv.attending ? 'yes' : 'no';
}

const personInclude = {
  invitations: true,
} as const;

/** Every household with its people, invitations, and gifts, in guest-list order. */
export async function getHouseholds() {
  const households = await prisma.household.findMany({
    include: {
      people: { orderBy: { sortOrder: 'asc' }, include: personInclude },
      gifts: { orderBy: { createdAt: 'asc' } },
    },
  });

  return households
    .filter((h) => h.people.length > 0)
    .map((h) => ({
      ...h,
      addressee: formatAddressee(h.people.map((p) => p.displayName)),
      events: EVENT_ORDER.filter((e) =>
        h.people.some((p) => p.invitations.some((i) => i.event === e)),
      ),
    }))
    .sort((a, b) => a.people[0]!.sortOrder - b.people[0]!.sortOrder);
}

export type AdminHousehold = Awaited<ReturnType<typeof getHouseholds>>[number];
export type AdminPerson = AdminHousehold['people'][number];

export async function getHousehold(id: string) {
  const all = await getHouseholds();
  return all.find((h) => h.id === id) ?? null;
}

export function invitationOf(person: AdminPerson, event: EventSlug) {
  return person.invitations.find((i) => i.event === event) ?? null;
}

export type EventStats = {
  event: EventSlug;
  invited: number;
  opened: number;
  yes: number;
  no: number;
  pending: number;
};

export function eventStats(households: AdminHousehold[]): EventStats[] {
  return EVENT_ORDER.map((event) => {
    const stats: EventStats = { event, invited: 0, opened: 0, yes: 0, no: 0, pending: 0 };
    for (const h of households) {
      for (const p of h.people) {
        const inv = invitationOf(p, event);
        if (!inv) continue;
        stats.invited += 1;
        if (inv.openedAt) stats.opened += 1;
        stats[rsvpStatus(inv)] += 1;
      }
    }
    return stats;
  });
}

export async function getGifts() {
  return prisma.gift.findMany({
    orderBy: [{ receivedOn: 'desc' }, { createdAt: 'desc' }],
    include: { household: { select: { id: true, label: true } } },
  });
}

export { isEventSlug };
