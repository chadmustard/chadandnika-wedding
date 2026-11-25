import { redirect } from 'next/navigation';
import { getCurrentGuest } from '@/lib/guest';
import { InviteHome } from '@/components/invite/InviteHome';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const guest = await getCurrentGuest();
  if (!guest || guest.invitations.length === 0) redirect('/gate');

  return <InviteHome guest={guest} />;
}
