import { EventPage } from '@/lib/event-page';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wedding' };

export default function Page() {
  return <EventPage slug="wedding" />;
}
