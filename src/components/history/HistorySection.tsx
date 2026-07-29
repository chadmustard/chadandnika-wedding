'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { copy } from '@/lib/copy';
import type { AtlasPerson } from './AtlasMap';

const AtlasMap = dynamic(
  () => import('./AtlasMap').then((mod) => mod.AtlasMap),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-wedding-stone">Loading the atlas…</p>
    ),
  },
);

export function HistorySection({
  people: initialPeople,
  viewerPersonId: initialViewerPersonId,
}: {
  people: AtlasPerson[];
  viewerPersonId: string | null;
}) {
  const [people, setPeople] = useState(initialPeople);
  const [viewerPersonId, setViewerPersonId] = useState(initialViewerPersonId);

  useEffect(() => {
    setPeople(initialPeople);
  }, [initialPeople]);

  useEffect(() => {
    setViewerPersonId(initialViewerPersonId);
  }, [initialViewerPersonId]);

  // Resolve session on the client too — covers invite-cookie edge cases
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { id: string };
        if (!cancelled) setViewerPersonId(data.id);
      } catch {
        // keep SSR value
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshPeople() {
    const res = await fetch('/api/history');
    if (!res.ok) return;
    const data = (await res.json()) as { people: AtlasPerson[] };
    setPeople(data.people);
  }

  return (
    <section id="history" className="scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl lg:max-w-6xl">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          {copy.historyHeadline}
        </h2>
        <p className="mt-3 max-w-xl text-wedding-stone">{copy.historySub}</p>

        <div className="mt-10">
          {people.length === 0 ? (
            <p className="text-sm text-wedding-stone">{copy.historyEmpty}</p>
          ) : (
            <AtlasMap
              people={people}
              viewerPersonId={viewerPersonId}
              onPeopleChanged={refreshPeople}
            />
          )}
        </div>
      </div>
    </section>
  );
}
