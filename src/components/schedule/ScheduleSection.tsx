import { copy } from '@/lib/copy';

export function ScheduleSection() {
  return (
    <section
      id="schedule"
      className="scroll-mt-16 border-b border-wedding-ink/10 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          {copy.scheduleHeadline}
        </h2>
        <p className="mt-3 text-wedding-stone">{copy.scheduleSub}</p>
        <div className="mx-auto mt-10 max-w-sm border border-dashed border-wedding-ink/20 px-6 py-12">
          <p className="font-display text-2xl tracking-tight">TBD</p>
          <p className="mt-3 text-sm leading-relaxed text-wedding-stone">
            {copy.scheduleBody}
          </p>
        </div>
      </div>
    </section>
  );
}
