import { EventPage } from '@/lib/event-page';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Engagement Party' };

export default function Page() {
  return <EventPage slug="engagement" />;
}
