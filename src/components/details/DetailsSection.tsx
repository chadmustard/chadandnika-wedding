import { copy } from '@/lib/copy';
import type { EventInfo } from '@/lib/events';

export function DetailsSection({ event }: { event: EventInfo }) {
  const when = [event.dateLabel, event.timeLabel].filter(Boolean).join(' · ');

  return (
    <section
      id="details"
      className="scroll-mt-16 border-b border-wedding-ink/10 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          {copy.detailsHeadline}
        </h2>
        <p className="mt-3 text-wedding-stone">{copy.detailsSub}</p>

        <dl className="mt-10 grid gap-px overflow-hidden border border-wedding-ink/10 bg-wedding-ink/10 sm:grid-cols-2">
          <div className="bg-wedding-cream px-6 py-8">
            <dt className="text-xs uppercase tracking-[0.25em] text-wedding-stone">
              {copy.detailsWhen}
            </dt>
            <dd className="mt-3 font-display text-3xl tracking-tight">{when}</dd>
          </div>
          <div className="bg-wedding-cream px-6 py-8">
            <dt className="text-xs uppercase tracking-[0.25em] text-wedding-stone">
              {copy.detailsWhere}
            </dt>
            <dd className="mt-3 font-display text-3xl tracking-tight">
              {event.venue ?? 'TBD'}
            </dd>
            {event.city ? <dd className="mt-1 text-wedding-stone">{event.city}</dd> : null}
            {event.mapUrl ? (
              <dd className="mt-4">
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline decoration-wedding-sage decoration-2 underline-offset-4 hover:text-wedding-charcoal"
                >
                  {copy.detailsMap} ↗
                </a>
              </dd>
            ) : null}
          </div>
        </dl>

        <p className="mt-8 max-w-xl leading-relaxed text-wedding-charcoal">
          {copy.detailsBody}
        </p>
      </div>
    </section>
  );
}
