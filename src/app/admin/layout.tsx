import { AdminRail } from '@/components/admin/admin-rail';
import { getAdminSession } from '@/lib/admin';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin · Pick Flick',
  robots: { index: false, follow: false },
};

/** The only gate: non-admins (and signed-out visitors) get a 404, so the route does not advertise itself. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) notFound();

  return (
    <div className="min-h-dvh bg-background">
      <AdminRail name={session.user?.name?.split(' ')[0] ?? 'Admin'} />
      <main className="px-4 py-8 md:ml-[220px] md:px-10 md:py-10">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
