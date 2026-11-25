import { copy } from '@/lib/copy';
import { LoginForm } from '@/components/admin/forms';
import { adminBase } from '@/lib/admin/auth';

export const metadata = { title: 'Sign in' };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto mt-[12vh] max-w-sm">
      <p className="font-display text-4xl tracking-tight">{copy.brand}</p>
      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-wedding-stone">Admin</p>
      <LoginForm home={`${adminBase()}/`} />
    </div>
  );
}
