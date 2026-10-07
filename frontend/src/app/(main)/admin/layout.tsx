import { ReactNode, Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-full bg-[#0a0a0a] text-zinc-100 overflow-hidden rounded-xl border border-[#222]">
        <Suspense fallback={<div className="w-64 bg-[#111111] border-r border-[#222]" />}>
          <AdminSidebar />
        </Suspense>
        <main className="flex-1 overflow-auto bg-[#0a0a0a] p-4 sm:p-8">
          <Suspense fallback={<div />}>
            {children}
          </Suspense>
        </main>
      </div>
    </AdminGuard>
  );
}
