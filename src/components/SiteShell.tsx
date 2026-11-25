'use client';

import { useState } from 'react';
import { copy } from '@/lib/copy';
import type { EventInfo } from '@/lib/events';
import type { Guest } from '@/lib/guest-types';
import { Hero } from '@/components/hero/Hero';
import { RsvpSection } from '@/components/rsvp/RsvpSection';
import { RegistrySection } from '@/components/registry/RegistrySection';
import { ScheduleSection } from '@/components/schedule/ScheduleSection';
import { DetailsSection } from '@/components/details/DetailsSection';
import { HistorySection } from '@/components/history/HistorySection';
import type { AtlasPerson } from '@/components/history/AtlasMap';

export type SectionId = 'rsvp' | 'details' | 'registry' | 'schedule' | 'history';

/** Sections per event. The atlas is wedding-only; the registry is shared. */
const SECTIONS: Record<EventInfo['slug'], SectionId[]> = {
  engagement: ['rsvp', 'details', 'registry'],
  wedding: ['rsvp', 'registry', 'schedule', 'history'],
};

const HERO_IMAGE: Record<EventInfo['slug'], string> = {
  engagement: '/hero/proposal-2.jpg',
  wedding: '/hero/proposal-3.jpg',
};

/** One event's page: hero, sticky section nav, and that event's sections. */
export function SiteShell({
  event,
  guest,
  historyPeople = [],
}: {
  event: EventInfo;
  guest: Guest;
  historyPeople?: AtlasPerson[];
}) {
  const sections = SECTIONS[event.slug];
  const nav = sections.map((id) => ({ id, label: copy.nav[id] }));
  const [active, setActive] = useState<SectionId>('rsvp');

  function goTo(id: SectionId) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-wedding-cream text-wedding-ink">
      <Hero
        eyebrow={[event.name, event.dateLabel].join(' · ')}
        line={event.slug === 'engagement' ? copy.engagementHeroLine : copy.heroLine}
        image={HERO_IMAGE[event.slug]}
        onCta={() => goTo('rsvp')}
        onNavigate={goTo}
        nav={nav}
      />

      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 border-b border-wedding-ink/10 bg-wedding-cream/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-3 sm:justify-center sm:gap-2">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              className={`shrink-0 px-3 py-1.5 text-sm tracking-wide transition sm:px-4 ${
                active === item.id
                  ? 'text-wedding-ink underline decoration-wedding-sage decoration-2 underline-offset-8'
                  : 'text-wedding-stone hover:text-wedding-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {sections.map((id) => {
          switch (id) {
            case 'rsvp':
              return <RsvpSection key={id} guest={guest} event={event} />;
            case 'details':
              return <DetailsSection key={id} event={event} />;
            case 'registry':
              return <RegistrySection key={id} />;
            case 'schedule':
              return <ScheduleSection key={id} />;
            case 'history':
              return (
                <HistorySection key={id} people={historyPeople} viewerPersonId={guest.id} />
              );
          }
        })}
      </main>

      <footer className="border-t border-wedding-ink/10 px-6 py-10 text-center">
        <p className="font-display text-2xl tracking-tight">{copy.brand}</p>
        <p className="mt-2 text-sm text-wedding-stone">{copy.footerLine}</p>
      </footer>
    </div>
  );
}
