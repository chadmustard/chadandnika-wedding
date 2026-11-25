/** Client-safe guest types and helpers (no server imports). */
import type { EventSlug } from './events';

export type GuestInvitation = {
  event: EventSlug;
  attending: boolean | null;
  dietaryRestrictions: string | null;
  respondedAt: string | null;
  openedAt: string | null;
};

export type HouseholdMember = {
  id: string;
  displayName: string;
  invitations: GuestInvitation[];
};

/** Serializable view of the signed-in guest, safe to pass to client components. */
export type Guest = {
  id: string;
  displayName: string;
  /** "Rick & Cindy Mustard" — everyone in the household. */
  addressee: string;
  invitations: GuestInvitation[];
  /** Other people in the guest's household (not including the guest). */
  householdMembers: HouseholdMember[];
};

export function invitationFor(
  guest: Pick<Guest, 'invitations'> | null,
  event: EventSlug,
): GuestInvitation | null {
  return guest?.invitations.find((i) => i.event === event) ?? null;
}
