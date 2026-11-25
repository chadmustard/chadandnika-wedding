import Link from 'next/link';
import { EVENTS } from '@/lib/events';
import { adminBase, requireAdmin } from '@/lib/admin/auth';
import { getGifts, getHouseholds } from '@/lib/admin/data';
import { formatDay, formatMoney } from '@/lib/admin/rooms';
import { deleteGift, setThankYouSent } from '../actions';
import { AutoSubmitCheckbox, SubmitButton } from '@/components/admin/forms';
import { GiftForm } from '@/components/admin/GiftForm';
import { Panel, Stat } from '@/components/admin/ui';

export const metadata = { title: 'Gifts' };

export default async function GiftsPage({ searchParams }: { searchParams?: { owed?: string } }) {
  await requireAdmin();
  const base = adminBase();
  const [gifts, households] = await Promise.all([getGifts(), getHouseholds()]);
  const onlyOwed = searchParams?.owed === '1';
  const shown = onlyOwed ? gifts.filter((g) => !g.thankYouSentOn) : gifts;
  const owed = gifts.filter((g) => !g.thankYouSentOn).length;
  const total = gifts.reduce((sum, g) => sum + (g.amountCents ?? 0), 0);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Gifts" value={gifts.length} />
          <Stat label="Cash total" value={formatMoney(total) || '$0.00'} />
          <Stat label="Thank-yous owed" value={owed} tone={owed ? 'text-wedding-blush' : ''} />
        </div>
      </Panel>

      <Panel title="Log a gift">
        <GiftForm households={households.map((h) => ({ id: h.id, addressee: h.addressee }))} />
        <p className="mt-3 text-xs text-wedding-stone">
          The registry is Venmo, so nothing comes in automatically. Log each gift here as it
          arrives.
        </p>
      </Panel>

      <Panel
        title="Gift log"
        action={
          <Link
            href={onlyOwed ? `${base}/gifts` : `${base}/gifts?owed=1`}
            className="text-sm underline underline-offset-4"
          >
            {onlyOwed ? 'Show all' : 'Only thank-yous owed'}
          </Link>
        }
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-wedding-ink/10 text-xs uppercase tracking-[0.12em] text-wedding-stone">
                <th className="px-5 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">Gift</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">For</th>
                <th className="px-3 py-2 font-medium">Received</th>
                <th className="px-3 py-2 font-medium">Thank-you</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id} className="border-b border-wedding-ink/5 last:border-0">
                  <td className="px-5 py-2.5">
                    {g.household ? (
                      <Link href={`${base}/households/${g.household.id}`} className="underline-offset-4 hover:underline">
                        {g.fromName}
                      </Link>
                    ) : (
                      g.fromName
                    )}
                  </td>
                  <td className="px-3 py-2.5">{g.description}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(g.amountCents)}</td>
                  <td className="px-3 py-2.5 text-wedding-charcoal">
                    {g.event ? (EVENTS[g.event as keyof typeof EVENTS]?.name ?? g.event) : 'Other'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDay(g.receivedOn)}</td>
                  <td className="px-3 py-2.5">
                    <form action={setThankYouSent}>
                      <input type="hidden" name="giftId" value={g.id} />
                      <AutoSubmitCheckbox
                        name="sent"
                        checked={Boolean(g.thankYouSentOn)}
                        label={g.thankYouSentOn ? `Sent ${formatDay(g.thankYouSentOn)}` : 'Not yet'}
                      />
                    </form>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <form action={deleteGift}>
                      <input type="hidden" name="giftId" value={g.id} />
                      <SubmitButton variant="quiet">Remove</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-wedding-stone">
                    {onlyOwed ? 'All caught up on thank-yous.' : 'No gifts logged yet.'}
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
