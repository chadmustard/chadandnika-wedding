import { prisma } from './prisma';
import { getSessionPersonId } from './session';
import { isEventSlug, sortEvents, type EventSlug } from './events';
import type { Guest, GuestInvitation } from './guest-types';

export * from './guest-types';
import { formatAddressee } from './names';

type InvitationRow = {
  event: string;
  attending: boolean | null;
  dietaryRestrictions: string | null;
  respondedAt: Date | null;
  openedAt: Date | null;
};

function toInvitations(rows: InvitationRow[]): GuestInvitation[] {
  return sortEvents(rows)
    .filter((row) => isEventSlug(row.event))
    .map((row) => ({
      event: row.event as EventSlug,
      attending: row.attending,
      dietaryRestrictions: row.dietaryRestrictions,
      respondedAt: row.respondedAt?.toISOString() ?? null,
      openedAt: row.openedAt?.toISOString() ?? null,
    }));
}

const invitationSelect = {
  event: true,
  attending: true,
  dietaryRestrictions: true,
  respondedAt: true,
  openedAt: true,
} as const;

export async function getGuestById(personId: string): Promise<Guest | null> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      invitations: { select: invitationSelect },
      household: {
        include: {
          people: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              displayName: true,
              invitations: { select: invitationSelect },
            },
          },
        },
      },
    },
  });
  if (!person) return null;

  const household = person.household?.people ?? [];
  return {
    id: person.id,
    displayName: person.displayName,
    addressee: formatAddressee(
      household.length ? household.map((p) => p.displayName) : [person.displayName],
    ),
    invitations: toInvitations(person.invitations),
    householdMembers: household
      .filter((p) => p.id !== person.id)
      .map((p) => ({
        id: p.id,
        displayName: p.displayName,
        invitations: toInvitations(p.invitations),
      })),
  };
}

export async function getCurrentGuest(): Promise<Guest | null> {
  const personId = await getSessionPersonId();
  if (!personId) return null;
  return getGuestById(personId);
}
