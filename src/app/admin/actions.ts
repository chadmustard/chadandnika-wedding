'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { isEventSlug } from '@/lib/events';
import { adminCookieOptions, createAdminToken } from '@/lib/session-edge';
import { assertAdmin, checkAdminPassword } from '@/lib/admin/auth';
import { ROOM_TYPES, parseDateInput, parseDateTimeInput } from '@/lib/admin/rooms';
import type { RoomType } from '@/generated/prisma/enums';

function text(form: FormData, key: string, max = 200): string | null {
  const value = form.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function refresh() {
  revalidatePath('/admin', 'layout');
}

// --- Auth -----------------------------------------------------------------

// Login/logout finish with a full page load on the client (see LoginForm and
// logout/route.ts): a server-action redirect would render the target route
// directly, skipping the admin.* host rewrite in middleware.
export type LoginState = { error: string | null; ok?: boolean };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await rateLimit(`admin-login:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 }))) {
    return { error: 'Too many tries. Wait 15 minutes.' };
  }
  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'ADMIN_PASSWORD isn’t set on the server.' };
  }
  if (!checkAdminPassword(String(form.get('password') ?? ''))) {
    return { error: 'Wrong password.' };
  }

  const opts = adminCookieOptions(await createAdminToken());
  cookies().set(opts.name, opts.value, opts);
  return { error: null, ok: true };
}

// --- RSVPs (e.g. Grandma called instead of using the site) -----------------

export async function setRsvp(form: FormData) {
  await assertAdmin();
  const personId = text(form, 'personId');
  const event = form.get('event');
  const value = form.get('attending');
  if (!personId || !isEventSlug(event)) return;

  await prisma.invitation.update({
    where: { personId_event: { personId, event } },
    data:
      value === 'yes' || value === 'no'
        ? { attending: value === 'yes', respondedAt: new Date() }
        : { attending: null, respondedAt: null },
  });
  refresh();
}

// --- Travel ------------------------------------------------------------------

export async function saveTravel(form: FormData) {
  await assertAdmin();
  const personId = text(form, 'personId');
  if (!personId) return;

  await prisma.person.update({
    where: { id: personId },
    data: {
      arrivalAt: parseDateTimeInput(form.get('arrivalAt')),
      arrivalFlight: text(form, 'arrivalFlight', 20)?.toUpperCase() ?? null,
      departureAt: parseDateTimeInput(form.get('departureAt')),
      departureFlight: text(form, 'departureFlight', 20)?.toUpperCase() ?? null,
      homeAirport: text(form, 'homeAirport', 10)?.toUpperCase() ?? null,
    },
  });
  refresh();
}

// --- Rooms -------------------------------------------------------------------

export async function saveRoom(form: FormData) {
  await assertAdmin();
  const householdId = text(form, 'householdId');
  if (!householdId) return;

  const rawType = form.get('roomType');
  const roomType = ROOM_TYPES.some((r) => r.value === rawType) ? (rawType as RoomType) : null;

  await prisma.household.update({
    where: { id: householdId },
    data: {
      roomType,
      checkIn: parseDateInput(form.get('checkIn')),
      checkOut: parseDateInput(form.get('checkOut')),
      roomNotes: text(form, 'roomNotes', 500),
    },
  });
  refresh();
}

// --- Gifts -------------------------------------------------------------------

export async function addGift(form: FormData) {
  await assertAdmin();
  const householdId = text(form, 'householdId');
  const description = text(form, 'description', 300);
  let fromName = text(form, 'fromName', 120);

  if (!fromName && householdId) {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { label: true, people: { select: { displayName: true } } },
    });
    fromName = household?.people.map((p) => p.displayName).join(' & ') || household?.label || null;
  }
  if (!fromName || !description) return;

  const amount = Number(String(form.get('amount') ?? '').replace(/[$,\s]/g, ''));
  const event = form.get('event');

  await prisma.gift.create({
    data: {
      householdId,
      fromName,
      description,
      event: isEventSlug(event) ? event : null,
      amountCents: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null,
      receivedOn: parseDateInput(form.get('receivedOn')) ?? new Date(new Date().toISOString().slice(0, 10)),
      notes: text(form, 'notes', 500),
    },
  });
  refresh();
}

export async function setThankYouSent(form: FormData) {
  await assertAdmin();
  const giftId = text(form, 'giftId');
  if (!giftId) return;
  await prisma.gift.update({
    where: { id: giftId },
    data: {
      thankYouSentOn:
        form.get('sent') === '1' ? new Date(new Date().toISOString().slice(0, 10)) : null,
    },
  });
  refresh();
}

export async function deleteGift(form: FormData) {
  await assertAdmin();
  const giftId = text(form, 'giftId');
  if (!giftId) return;
  await prisma.gift.delete({ where: { id: giftId } });
  refresh();
}
