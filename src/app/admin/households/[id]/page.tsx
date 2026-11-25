import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EVENTS } from '@/lib/events';
import { adminBase, requireAdmin } from '@/lib/admin/auth';
import { getHousehold, invitationOf, rsvpStatus } from '@/lib/admin/data';
import {
  ROOM_TYPES,
  formatDay,
  formatMoney,
  nightsBetween,
  toDateInput,
  toDateTimeInput,
} from '@/lib/admin/rooms';
import { deleteGift, saveRoom, saveTravel, setRsvp, setThankYouSent } from '../../actions';
import { AutoSubmitCheckbox, AutoSubmitSelect, SubmitButton } from '@/components/admin/forms';
import { Field, Panel, RsvpChip, input } from '@/components/admin/ui';
import { GiftForm } from '@/components/admin/GiftForm';

export const metadata = { title: 'Household' };

export default async function HouseholdPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const base = adminBase();
  const household = await getHousehold(params.id);
  if (!household) notFound();

  const nights =
    household.checkIn && household.checkOut
      ? nightsBetween(household.checkIn, household.checkOut).length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/`} className="text-sm text-wedding-stone hover:text-wedding-ink">
          ← All guests
        </Link>
        <h1 className="mt-2 font-display text-5xl tracking-tight">{household.addressee}</h1>
        <p className="mt-1 text-wedding-stone">{household.address}</p>
      </div>

      <Panel title="RSVPs">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                <th className="px-5 py-2 font-medium">Guest</th>
                {household.events.map((e) => (
                  <th key={e} className="px-3 py-2 font-medium">
                    {EVENTS[e].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {household.people.map((p) => (
                <tr key={p.id} className="border-b border-wedding-ink/5 align-top last:border-0">
                  <td className="px-5 py-3 font-medium">{p.displayName}</td>
                  {household.events.map((e) => {
                    const inv = invitationOf(p, e);
                    if (!inv) {
                      return (
                        <td key={e} className="px-3 py-3 text-wedding-ink/25">
                          Not invited
                        </td>
                      );
                    }
                    const status = rsvpStatus(inv);
                    return (
                      <td key={e} className="px-3 py-3">
                        <form action={setRsvp} className="flex items-center gap-2">
                          <input type="hidden" name="personId" value={p.id} />
                          <input type="hidden" name="event" value={e} />
                          <RsvpChip status={status} />
                          <AutoSubmitSelect name="attending" defaultValue={status === 'pending' ? '' : status} aria-label={`Change ${p.displayName}'s RSVP`}>
                            <option value="">Awaiting</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </AutoSubmitSelect>
                        </form>
                        <p className="mt-1.5 text-xs text-wedding-stone">
                          {inv.openedAt ? `Opened ${formatDay(inv.openedAt)}` : 'Hasn’t opened invite'}
                          {inv.respondedAt ? ` · answered ${formatDay(inv.respondedAt)}` : ''}
                        </p>
                        {inv.dietaryRestrictions ? (
                          <p className="mt-1 text-xs text-wedding-charcoal">Dietary: {inv.dietaryRestrictions}</p>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel title="Travel">
          <div className="space-y-6">
            {household.people.map((p) => (
              <form key={p.id} action={saveTravel} className="space-y-3 border-b border-wedding-ink/5 pb-6 last:border-0 last:pb-0">
                <input type="hidden" name="personId" value={p.id} />
                <p className="font-medium">{p.displayName}</p>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <Field label="Arrives">
                    <input type="datetime-local" name="arrivalAt" defaultValue={toDateTimeInput(p.arrivalAt)} className={input} />
                  </Field>
                  <Field label="Flight in">
                    <input name="arrivalFlight" defaultValue={p.arrivalFlight ?? ''} placeholder="AA 1234" className={input} />
                  </Field>
                  <Field label="Departs">
                    <input type="datetime-local" name="departureAt" defaultValue={toDateTimeInput(p.departureAt)} className={input} />
                  </Field>
                  <Field label="Flight out">
                    <input name="departureFlight" defaultValue={p.departureFlight ?? ''} placeholder="AA 4321" className={input} />
                  </Field>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="w-40">
                    <Field label="Flying from">
                      <input name="homeAirport" defaultValue={p.homeAirport ?? ''} placeholder="CVG" className={`${input} uppercase`} />
                    </Field>
                  </div>
                  <SubmitButton>Save travel</SubmitButton>
                </div>
              </form>
            ))}
          </div>
          <p className="mt-4 text-xs text-wedding-stone">Times are local to the wedding.</p>
        </Panel>

        <Panel title="Room">
          <form action={saveRoom} className="space-y-3">
            <input type="hidden" name="householdId" value={household.id} />
            <Field label="Room type">
              <select name="roomType" defaultValue={household.roomType ?? ''} className={input}>
                <option value="">Not booked</option>
                {ROOM_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in">
                <input type="date" name="checkIn" defaultValue={toDateInput(household.checkIn)} className={input} />
              </Field>
              <Field label="Check-out">
                <input type="date" name="checkOut" defaultValue={toDateInput(household.checkOut)} className={input} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea name="roomNotes" rows={2} defaultValue={household.roomNotes ?? ''} placeholder="Confirmation #, crib, sharing with…" className={input} />
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-sm text-wedding-stone">{nights ? `${nights} night${nights === 1 ? '' : 's'}` : ''}</span>
              <SubmitButton>Save room</SubmitButton>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Gifts">
        {household.gifts.length ? (
          <ul className="mb-6 divide-y divide-wedding-ink/5">
            {household.gifts.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
                <div className="min-w-[220px] flex-1">
                  <p className="font-medium">
                    {g.description}
                    {g.amountCents ? <span className="ml-2 text-wedding-charcoal">{formatMoney(g.amountCents)}</span> : null}
                  </p>
                  <p className="text-xs text-wedding-stone">
                    {g.event ? `${EVENTS[g.event as keyof typeof EVENTS]?.name ?? g.event} · ` : ''}
                    received {formatDay(g.receivedOn)}
                    {g.notes ? ` · ${g.notes}` : ''}
                  </p>
                </div>
                <form action={setThankYouSent}>
                  <input type="hidden" name="giftId" value={g.id} />
                  <AutoSubmitCheckbox
                    name="sent"
                    checked={Boolean(g.thankYouSentOn)}
                    label={g.thankYouSentOn ? `Thank-you sent ${formatDay(g.thankYouSentOn)}` : 'Thank-you sent'}
                  />
                </form>
                <form action={deleteGift}>
                  <input type="hidden" name="giftId" value={g.id} />
                  <SubmitButton variant="quiet">Remove</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 text-sm text-wedding-stone">No gifts logged yet.</p>
        )}
        <GiftForm householdId={household.id} />
      </Panel>
    </div>
  );
}
