import Link from 'next/link';
import { EVENTS, EVENT_ORDER, isEventSlug, type EventSlug } from '@/lib/events';
import { adminBase, requireAdmin } from '@/lib/admin/auth';
import {
  eventStats,
  getGifts,
  getHouseholds,
  invitationOf,
  rsvpStatus,
  type AdminPerson,
} from '@/lib/admin/data';
import { formatDay, roomLabel } from '@/lib/admin/rooms';
import { Panel, RsvpChip, Stat, input } from '@/components/admin/ui';

type Filter = 'all' | 'yes' | 'no' | 'pending' | 'unopened';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'yes', label: 'Coming' },
  { value: 'no', label: 'Not coming' },
  { value: 'pending', label: 'Awaiting RSVP' },
  { value: 'unopened', label: 'Hasn’t opened invite' },
];

function matches(person: AdminPerson, event: EventSlug | 'all', filter: Filter) {
  const invs = person.invitations.filter((i) => event === 'all' || i.event === event);
  if (invs.length === 0) return false;
  if (filter === 'all') return true;
  if (filter === 'unopened') return invs.some((i) => !i.openedAt);
  return invs.some((i) => rsvpStatus(i) === filter);
}

function formatPhone(phone: string | null) {
  const m = phone?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (phone ?? '—');
}

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams?: { event?: string; status?: string; q?: string };
}) {
  await requireAdmin();
  const base = adminBase();
  const [households, gifts] = await Promise.all([getHouseholds(), getGifts()]);
  const stats = eventStats(households);

  const event: EventSlug | 'all' = isEventSlug(searchParams?.event) ? searchParams.event : 'all';
  const filter: Filter = FILTERS.some((f) => f.value === searchParams?.status)
    ? (searchParams!.status as Filter)
    : 'all';
  const q = (searchParams?.q ?? '').trim().toLowerCase();

  const rows = households
    .map((h) => ({
      ...h,
      shown: h.people.filter(
        (p) =>
          matches(p, event, filter) &&
          (!q || p.displayName.toLowerCase().includes(q) || h.label.toLowerCase().includes(q)),
      ),
    }))
    .filter((h) => h.shown.length > 0);
  const shownCount = rows.reduce((n, h) => n + h.shown.length, 0);

  const owed = gifts.filter((g) => !g.thankYouSentOn).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Panel key={s.event}>
            <p className="text-xs uppercase tracking-[0.2em] text-wedding-stone">
              {EVENTS[s.event].name} · {EVENTS[s.event].dateLabel}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <Stat label="Coming" value={s.yes} tone="text-[#3f4d37]" />
              <Stat label="No" value={s.no} tone="text-[#8a3f33]" />
              <Stat label="Awaiting" value={s.pending} />
              <Stat label="Invited" value={s.invited} tone="text-wedding-stone" />
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-wedding-ink/[0.06]">
              <div
                className="h-full bg-wedding-sage"
                style={{ width: `${s.invited ? ((s.yes + s.no) / s.invited) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-wedding-stone">
              {s.yes + s.no} of {s.invited} responded · {s.opened} opened their invite
            </p>
          </Panel>
        ))}
        <Panel>
          <p className="text-xs uppercase tracking-[0.2em] text-wedding-stone">Gifts</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Received" value={gifts.length} />
            <Stat label="Thank-yous owed" value={owed} tone={owed ? 'text-wedding-blush' : ''} />
          </div>
          <Link href={`${base}/gifts`} className="mt-4 inline-block text-sm underline underline-offset-4">
            Open gift log →
          </Link>
        </Panel>
      </div>

      <Panel
        title="Guests"
        action={<span className="text-sm text-wedding-stone">{shownCount} shown</span>}
      >
        <form className="mb-5 flex flex-wrap items-end gap-3" action={`${base}/`}>
          <label className="w-full sm:w-64">
            <span className="text-xs uppercase tracking-[0.14em] text-wedding-stone">Search</span>
            <input name="q" defaultValue={searchParams?.q ?? ''} placeholder="Name or household" className={`${input} mt-1`} />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.14em] text-wedding-stone">Event</span>
            <select name="event" defaultValue={event} className={`${input} mt-1`}>
              <option value="all">Both events</option>
              {EVENT_ORDER.map((e) => (
                <option key={e} value={e}>
                  {EVENTS[e].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.14em] text-wedding-stone">Show</span>
            <select name="status" defaultValue={filter} className={`${input} mt-1`}>
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-md border border-wedding-ink/20 px-4 py-2 text-sm hover:bg-wedding-ink/5">
            Filter
          </button>
        </form>

        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-y border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                <th className="px-5 py-2 font-medium">Guest</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                {EVENT_ORDER.map((e) => (
                  <th key={e} className="px-3 py-2 font-medium">
                    {EVENTS[e].name}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Dietary</th>
                <th className="px-3 py-2 font-medium">Travel</th>
                <th className="px-5 py-2 font-medium">Room</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <HouseholdRows key={h.id} household={h} people={h.shown} base={base} />
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-wedding-stone">
                    Nobody matches that filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HouseholdRows({
  household,
  people,
  base,
}: {
  household: Awaited<ReturnType<typeof getHouseholds>>[number];
  people: AdminPerson[];
  base: string;
}) {
  return (
    <>
      <tr className="border-t border-wedding-ink/10 bg-wedding-ink/[0.025]">
        <td colSpan={7} className="px-5 py-2">
          <Link
            href={`${base}/households/${household.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {household.addressee}
          </Link>
          <span className="ml-3 text-xs text-wedding-stone">{household.address}</span>
        </td>
      </tr>
      {people.map((p, i) => {
        const dietary = p.invitations.map((inv) => inv.dietaryRestrictions).filter(Boolean).join('; ');
        return (
          <tr key={p.id} className="border-t border-wedding-ink/5 align-top">
            <td className="px-5 py-2.5 pl-8">{p.displayName}</td>
            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-wedding-charcoal">
              {formatPhone(p.phone)}
            </td>
            {EVENT_ORDER.map((e) => {
              const inv = invitationOf(p, e);
              return (
                <td key={e} className="px-3 py-2.5">
                  <RsvpChip status={inv ? rsvpStatus(inv) : 'none'} />
                  {inv && !inv.openedAt ? (
                    <span className="ml-2 text-xs text-wedding-stone" title="Hasn’t opened the envelope yet">
                      unopened
                    </span>
                  ) : null}
                </td>
              );
            })}
            <td className="max-w-[180px] px-3 py-2.5 text-wedding-charcoal">{dietary || '—'}</td>
            <td className="whitespace-nowrap px-3 py-2.5 text-wedding-charcoal">
              {p.arrivalAt || p.departureAt ? (
                <>
                  {formatDay(p.arrivalAt)} → {formatDay(p.departureAt)}
                  {p.homeAirport ? <span className="ml-1 text-xs text-wedding-stone">from {p.homeAirport}</span> : null}
                </>
              ) : (
                <span className="text-wedding-ink/25">—</span>
              )}
            </td>
            <td className="whitespace-nowrap px-5 py-2.5 text-wedding-charcoal">
              {i === 0 ? roomLabel(household.roomType) : ''}
            </td>
          </tr>
        );
      })}
    </>
  );
}
