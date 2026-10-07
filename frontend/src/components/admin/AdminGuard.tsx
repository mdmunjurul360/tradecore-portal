'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Client-side gate for admin pages. Normal users are redirected away and never
 * see admin UI. The real protection is the backend RolesGuard (HTTP 403), this
 * just avoids rendering/fetching anything for non-admins.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // zustand/persist hydrates from localStorage on the client only
    const done = useAuthStore.persist.hasHydrated();
    if (done) setHydrated(true);
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const isAdmin = !!user?.roles?.some((r) => ADMIN_ROLES.includes(r));

  useEffect(() => {
    if (hydrated && !isAdmin) router.replace('/dashboard');
  }, [hydrated, isAdmin, router]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div id="admin-access-denied" className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page. Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}
