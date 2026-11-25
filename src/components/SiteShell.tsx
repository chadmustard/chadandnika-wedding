'use client';

import { useState } from 'react';
import { copy } from '@/lib/copy';
import { Hero } from '@/components/hero/Hero';
import { RsvpSection } from '@/components/rsvp/RsvpSection';
import { RegistrySection } from '@/components/registry/RegistrySection';
import { ScheduleSection } from '@/components/schedule/ScheduleSection';
import { HistorySection } from '@/components/history/HistorySection';
import type { AtlasPerson } from '@/components/history/AtlasMap';

export type HouseholdMember = {
  id: string;
  displayName: string;
  attending: boolean | null;
  dietaryRestrictions: string | null;
  respondedAt: string | null;
};

export type GuestPerson = {
  id: string;
  displayName: string;
  attending: boolean | null;
  dietaryRestrictions: string | null;
  respondedAt: string | null;
  householdMembers: HouseholdMember[];
};

type SectionId = 'rsvp' | 'registry' | 'schedule' | 'history';

const NAV: { id: SectionId; label: string }[] = [
  { id: 'rsvp', label: copy.nav.rsvp },
  { id: 'registry', label: copy.nav.registry },
  { id: 'schedule', label: copy.nav.schedule },
  { id: 'history', label: copy.nav.history },
];

export function SiteShell({
  person,
  historyPeople,
}: {
  person: GuestPerson | null;
  historyPeople: AtlasPerson[];
}) {
  const [active, setActive] = useState<SectionId>('rsvp');

  function goTo(id: SectionId) {
    setActive(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="min-h-screen bg-wedding-cream text-wedding-ink">
      <Hero onCta={() => goTo('rsvp')} onNavigate={goTo} nav={NAV} />

      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 border-b border-wedding-ink/10 bg-wedding-cream/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-3 sm:justify-center sm:gap-2">
          {NAV.map((item) => (
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
        <RsvpSection person={person} />
        <RegistrySection />
        <ScheduleSection />
        <HistorySection
          people={historyPeople}
          viewerPersonId={person?.id ?? null}
        />
      </main>

      <footer className="border-t border-wedding-ink/10 px-6 py-10 text-center">
        <p className="font-display text-2xl tracking-tight">{copy.brand}</p>
        <p className="mt-2 text-sm text-wedding-stone">
          Scan once. RSVP twice if you change your mind. We can handle it.
        </p>
      </footer>
    </div>
  );
}
