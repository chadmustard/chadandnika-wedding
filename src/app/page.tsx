import { SiteShell } from '@/components/SiteShell';
import { getCurrentPerson } from '@/lib/session';
import { getHistoryPeople } from '@/lib/history';

export default async function HomePage() {
  const person = await getCurrentPerson();
  const historyPeople = await getHistoryPeople();

  return (
    <SiteShell
      person={
        person
          ? {
              id: person.id,
              displayName: person.displayName,
              attending: person.attending,
              dietaryRestrictions: person.dietaryRestrictions,
              respondedAt: person.respondedAt?.toISOString() ?? null,
              householdMembers: (person.household?.people ?? []).map((p) => ({
                id: p.id,
                displayName: p.displayName,
                attending: p.attending,
                dietaryRestrictions: p.dietaryRestrictions,
                respondedAt: p.respondedAt?.toISOString() ?? null,
              })),
            }
          : null
      }
      historyPeople={historyPeople}
    />
  );
}
