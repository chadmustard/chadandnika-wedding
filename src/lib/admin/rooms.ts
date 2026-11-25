import type { RoomType } from '@/generated/prisma/enums';

export const ROOM_TYPES: { value: RoomType; label: string; short: string }[] = [
  { value: 'QUEENS_GARDEN', label: '2 Queens · Garden view', short: '2Q Garden' },
  { value: 'QUEENS_OCEAN', label: '2 Queens · Ocean view', short: '2Q Ocean' },
  { value: 'KING_GARDEN', label: '1 King · Garden view', short: '1K Garden' },
  { value: 'KING_OCEAN', label: '1 King · Ocean view', short: '1K Ocean' },
];

export function roomLabel(type: RoomType | null | undefined): string {
  return ROOM_TYPES.find((r) => r.value === type)?.label ?? '—';
}

/**
 * Rooms held in the hotel block, per night (YYYY-MM-DD) and room type.
 * Fill in from the hotel's room block confirmation; the Rooms page compares
 * assigned rooms against these numbers.
 */
export const ROOM_BLOCK: Record<string, Partial<Record<RoomType, number>>> = {};

// --- Dates --------------------------------------------------------------
// Travel times are destination wall-clock values stored as if UTC, so every
// format/parse here uses UTC and nothing shifts with the viewer's timezone.

export function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '';
}

export function toDateTimeInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 16) : '';
}

export function parseDateInput(value: FormDataEntryValue | null): Date | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : null;
}

export function parseDateTimeInput(value: FormDataEntryValue | null): Date | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? new Date(`${value}:00Z`)
    : null;
}

export function formatDay(d: Date | null | undefined): string {
  return d
    ? d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
    : '—';
}

export function formatDateTime(d: Date | null | undefined): string {
  return d
    ? d.toLocaleString('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
}

/** Each night (YYYY-MM-DD) from check-in up to, not including, check-out. */
export function nightsBetween(checkIn: Date, checkOut: Date): string[] {
  const nights: string[] = [];
  for (let t = checkIn.getTime(); t < checkOut.getTime(); t += 86_400_000) {
    nights.push(new Date(t).toISOString().slice(0, 10));
  }
  return nights;
}

export function formatMoney(cents: number | null | undefined): string {
  return cents == null
    ? ''
    : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
