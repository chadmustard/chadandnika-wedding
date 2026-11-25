import { redirect } from 'next/navigation';
import { EVENTS, type EventSlug } from './events';
import { getCurrentGuest, invitationFor } from './guest';
import { getHistoryPeople } from './history';
import { SiteShell } from '@/components/SiteShell';

/** Server-side page for one event. Guests not invited to it go back home. */
export async function EventPage({ slug }: { slug: EventSlug }) {
  const guest = await getCurrentGuest();
  if (!guest) redirect('/gate');
  if (!invitationFor(guest, slug)) redirect('/');

  const historyPeople = slug === 'wedding' ? await getHistoryPeople() : [];
  return <SiteShell event={EVENTS[slug]} guest={guest} historyPeople={historyPeople} />;
}
