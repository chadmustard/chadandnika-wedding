import { addGift } from '@/app/admin/actions';
import { SubmitButton } from './forms';
import { Field, input } from './ui';

/**
 * Log a gift. On a household page pass `householdId`; on the gift log pass
 * `households` to pick who it's from (or type a name for non-guests).
 */
export function GiftForm({
  householdId,
  households,
}: {
  householdId?: string;
  households?: { id: string; addressee: string }[];
}) {
  return (
    <form action={addGift} className="space-y-3 rounded-lg bg-wedding-ink/[0.03] p-4">
      {householdId ? <input type="hidden" name="householdId" value={householdId} /> : null}
      {households ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From (guest)">
            <select name="householdId" defaultValue="" className={input}>
              <option value="">Not on the guest list</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.addressee}
                </option>
              ))}
            </select>
          </Field>
          <Field label="…or name on the card">
            <input name="fromName" placeholder="Aunt Linda’s book club" className={input} />
          </Field>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
        <Field label="Gift">
          <input name="description" required placeholder="Venmo — honeymoon fund" className={input} />
        </Field>
        <Field label="Amount">
          <input name="amount" inputMode="decimal" placeholder="$100" className={input} />
        </Field>
        <Field label="For">
          <select name="event" defaultValue="wedding" className={input}>
            <option value="wedding">Wedding</option>
            <option value="engagement">Engagement</option>
            <option value="">Other</option>
          </select>
        </Field>
        <Field label="Received">
          <input type="date" name="receivedOn" className={input} />
        </Field>
        <SubmitButton>Log gift</SubmitButton>
      </div>
    </form>
  );
}
