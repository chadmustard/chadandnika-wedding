import type { ReactNode } from 'react';
import type { RsvpStatus } from '@/lib/admin/data';

export const input =
  'w-full rounded-md border border-wedding-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-wedding-sage';

export function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-wedding-ink/10 bg-white/70 shadow-[0_1px_2px_rgba(20,18,16,0.04)]">
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-wedding-ink/10 px-5 py-3">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-wedding-stone">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const CHIP: Record<RsvpStatus | 'none', string> = {
  yes: 'bg-[#e3eadb] text-[#3f4d37]',
  no: 'bg-[#f3dfda] text-[#8a3f33]',
  pending: 'bg-wedding-ink/[0.06] text-wedding-stone',
  none: 'text-wedding-ink/25',
};

const CHIP_LABEL: Record<RsvpStatus | 'none', string> = {
  yes: 'Yes',
  no: 'No',
  pending: 'Awaiting',
  none: '—',
};

export function RsvpChip({ status }: { status: RsvpStatus | 'none' }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP[status]}`}
    >
      {CHIP_LABEL[status]}
    </span>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div>
      <p className={`font-display text-4xl leading-none tracking-tight ${tone ?? ''}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-wedding-stone">{label}</p>
    </div>
  );
}
