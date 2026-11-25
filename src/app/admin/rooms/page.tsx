import Link from 'next/link';
import { adminBase, requireAdmin } from '@/lib/admin/auth';
import { getHouseholds, invitationOf, rsvpStatus } from '@/lib/admin/data';
import {
  ROOM_BLOCK,
  ROOM_TYPES,
  formatDateTime,
  formatDay,
  nightsBetween,
  roomLabel,
} from '@/lib/admin/rooms';
import { Panel, RsvpChip } from '@/components/admin/ui';
import type { RoomType } from '@/generated/prisma/enums';

export const metadata = { title: 'Travel & rooms' };

export default async function RoomsPage() {
  await requireAdmin();
  const base = adminBase();
  const households = (await getHouseholds()).filter((h) => h.events.includes('wedding'));

  // Rooms booked per night, by type
  const perNight = new Map<string, Record<RoomType, number>>();
  for (const h of households) {
    if (!h.roomType || !h.checkIn || !h.checkOut) continue;
    for (const night of nightsBetween(h.checkIn, h.checkOut)) {
      const row =
        perNight.get(night) ??
        ({ QUEENS_GARDEN: 0, QUEENS_OCEAN: 0, KING_GARDEN: 0, KING_OCEAN: 0 } as Record<RoomType, number>);
      row[h.roomType] += 1;
      perNight.set(night, row);
    }
  }
  const nights = Array.from(new Set([...perNight.keys(), ...Object.keys(ROOM_BLOCK)])).sort();
  const hasBlock = Object.keys(ROOM_BLOCK).length > 0;

  const comingHouseholds = households.filter((h) =>
    h.people.some((p) => {
      const inv = invitationOf(p, 'wedding');
      return inv && rsvpStatus(inv) === 'yes';
    }),
  );
  const needsRoom = comingHouseholds.filter((h) => !h.roomType);

  const travelers = households
    .flatMap((h) => h.people.map((p) => ({ ...p, household: h })))
    .filter((p) => {
      const inv = invitationOf(p, 'wedding');
      return inv && rsvpStatus(inv) !== 'no';
    })
    .sort(
      (a, b) =>
        (a.arrivalAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.arrivalAt?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );

  return (
    <div className="space-y-6">
      <Panel
        title="Room block by night"
        action={
          <span className="text-sm text-wedding-stone">
            {hasBlock ? 'booked / held' : 'Add the hotel’s block to compare'}
          </span>
        }
      >
        {nights.length === 0 ? (
          <p className="text-sm text-wedding-stone">
            No rooms booked yet. Set a room type and dates on a household to see it here.
          </p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                  <th className="px-5 py-2 font-medium">Night of</th>
                  {ROOM_TYPES.map((r) => (
                    <th key={r.value} className="px-3 py-2 text-right font-medium">
                      {r.short}
                    </th>
                  ))}
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {nights.map((night) => {
                  const row = perNight.get(night);
                  const block = ROOM_BLOCK[night] ?? {};
                  const total = row ? Object.values(row).reduce((a, b) => a + b, 0) : 0;
                  return (
                    <tr key={night} className="border-b border-wedding-ink/5 last:border-0">
                      <td className="px-5 py-2.5">{formatDay(new Date(`${night}T00:00:00Z`))}</td>
                      {ROOM_TYPES.map((r) => {
                        const booked = row?.[r.value] ?? 0;
                        const held = block[r.value];
                        const over = held != null && booked > held;
                        return (
                          <td
                            key={r.value}
                            className={`px-3 py-2.5 text-right tabular-nums ${over ? 'font-semibold text-wedding-blush' : booked ? '' : 'text-wedding-ink/25'}`}
                          >
                            {booked}
                            {held != null ? <span className="text-wedding-stone"> / {held}</span> : null}
                          </td>
                        );
                      })}
                      <td className="px-5 py-2.5 text-right font-medium tabular-nums">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Rooms by household"
        action={
          needsRoom.length ? (
            <span className="text-sm text-wedding-blush">
              {needsRoom.length} coming without a room
            </span>
          ) : null
        }
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                <th className="px-5 py-2 font-medium">Household</th>
                <th className="px-3 py-2 font-medium">Wedding RSVP</th>
                <th className="px-3 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Check-in</th>
                <th className="px-3 py-2 font-medium">Check-out</th>
                <th className="px-5 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => {
                const statuses = h.people
                  .map((p) => invitationOf(p, 'wedding'))
                  .filter((i) => i !== null)
                  .map(rsvpStatus);
                const status = statuses.includes('yes') ? 'yes' : statuses.every((s) => s === 'no') ? 'no' : 'pending';
                return (
                  <tr key={h.id} className="border-b border-wedding-ink/5 last:border-0">
                    <td className="px-5 py-2.5">
                      <Link href={`${base}/households/${h.id}`} className="underline-offset-4 hover:underline">
                        {h.addressee}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <RsvpChip status={status} />
                    </td>
                    <td className={`px-3 py-2.5 ${h.roomType ? '' : status === 'yes' ? 'text-wedding-blush' : 'text-wedding-ink/25'}`}>
                      {h.roomType ? roomLabel(h.roomType) : status === 'yes' ? 'Needs a room' : '—'}
                    </td>
                    <td className="px-3 py-2.5">{formatDay(h.checkIn)}</td>
                    <td className="px-3 py-2.5">{formatDay(h.checkOut)}</td>
                    <td className="px-5 py-2.5 text-wedding-charcoal">{h.roomNotes ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Arrivals & departures">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                <th className="px-5 py-2 font-medium">Guest</th>
                <th className="px-3 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">Arrives</th>
                <th className="px-3 py-2 font-medium">Flight</th>
                <th className="px-3 py-2 font-medium">Departs</th>
                <th className="px-5 py-2 font-medium">Flight</th>
              </tr>
            </thead>
            <tbody>
              {travelers.map((p) => (
                <tr key={p.id} className="border-b border-wedding-ink/5 last:border-0">
                  <td className="px-5 py-2.5">
                    <Link href={`${base}/households/${p.household.id}`} className="underline-offset-4 hover:underline">
                      {p.displayName}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-medium">{p.homeAirport ?? <span className="text-wedding-ink/25">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDateTime(p.arrivalAt)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{p.arrivalFlight ?? ''}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDateTime(p.departureAt)}</td>
                  <td className="px-5 py-2.5 tabular-nums">{p.departureFlight ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-wedding-stone">
          Wedding guests who haven’t declined, soonest arrival first. Times are local to the wedding.
        </p>
      </Panel>
    </div>
  );
}
