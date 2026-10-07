'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { KycPill, StatusPill } from '@/components/admin/pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserDrawer } from '@/components/admin/UserDrawer';

interface AdminUserRow {
  id: string;
  email: string;
  status: string;
  demoModeEnabled: boolean;
  referralCode: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  profile?: { firstName?: string | null; lastName?: string | null; kycStatus?: string } | null;
  roles?: { role: { name: string } }[];
  referredByUser?: { id: string; email: string } | null;
}

const PAGE_SIZE = 15;

function UsersContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users-page', search, status, page],
    queryFn: () => adminService.getUsers({ search: search || undefined, status: status || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const users: AdminUserRow[] = data?.data ?? [];
  const meta = data?.meta;

  const statusMutation = useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      enable ? adminService.enableUser(id) : adminService.disableUser(id),
    onSuccess: (_res, vars) => {
      toast.success(vars.enable ? 'User enabled' : 'User disabled');
      queryClient.invalidateQueries({ queryKey: ['admin-users-page'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Action failed'),
  });

  const confirmToggle = (u: AdminUserRow, enable: boolean) => {
    if (enable || window.confirm(`Disable ${u.email}? They will be logged out and unable to sign in.`)) {
      statusMutation.mutate({ id: u.id, enable });
    }
  };

  const isAdminUser = (u: AdminUserRow) => u.roles?.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r.role.name));

  return (
    <div id="admin-users-page" className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Admin Panel
          </Link>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-yellow-500" /> User Management
          </h2>
          <p className="text-muted-foreground">Monitor registrations, KYC, referrals and account status.</p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total users </span>
          <span className="font-bold text-yellow-500">{meta?.total ?? '—'}</span>
        </div>
      </div>

      <Card className="border-[#222] bg-[#111] shadow-xl overflow-hidden">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-users-search"
                placeholder="Search email, name or referral code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <select
              id="admin-users-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Disabled</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-red-500">Failed to load users. You may not have permission.</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500"><Users className="h-6 w-6" /></div>
              <p className="font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow className="border-[#222] hover:bg-transparent">
                    <TableHead className="text-zinc-400">User ID</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Email</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">KYC</TableHead>
                    <TableHead className="text-zinc-400">Mode</TableHead>
                    <TableHead className="text-zinc-400">Registered</TableHead>
                    <TableHead className="text-zinc-400">Referral Code</TableHead>
                    <TableHead className="text-zinc-400">Referred By</TableHead>
                    <TableHead className="text-zinc-400">Last Login</TableHead>
                    <TableHead className="text-right text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ');
                    const disabled = u.status !== 'ACTIVE';
                    return (
                      <TableRow key={u.id} className="border-[#222] hover:bg-[#1a1a1a] transition-colors">
                        <TableCell className="font-mono text-xs text-zinc-500" title={u.id}>{u.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-zinc-200">{name || '—'}</TableCell>
                        <TableCell className="font-medium text-zinc-100">
                          {u.email}
                          {isAdminUser(u) && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-500">
                              <ShieldCheck className="h-3 w-3" /> ADMIN
                            </span>
                          )}
                        </TableCell>
                        <TableCell><StatusPill status={u.status} /></TableCell>
                        <TableCell><KycPill status={u.profile?.kycStatus} /></TableCell>
                        <TableCell>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${u.demoModeEnabled ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                            {u.demoModeEnabled ? 'Demo' : 'Live'}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">{u.referralCode || '—'}</TableCell>
                        <TableCell className="text-sm text-zinc-300">{u.referredByUser?.email || <span className="text-zinc-600">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-zinc-400">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="border-[#333] hover:bg-[#222] text-zinc-300 hover:text-white" id={`view-user-${u.id}`} onClick={() => setSelectedUserId(u.id)}>
                              <Eye className="mr-1 h-3.5 w-3.5" /> View
                            </Button>
                            {disabled ? (
                              <Button size="sm" id={`enable-user-${u.id}`} disabled={statusMutation.isPending} onClick={() => confirmToggle(u, true)}
                                className="bg-emerald-600 text-white hover:bg-emerald-500">
                                <UserCheck className="mr-1 h-3.5 w-3.5" /> Enable
                              </Button>
                            ) : (
                              <Button size="sm" variant="destructive" id={`disable-user-${u.id}`} disabled={statusMutation.isPending || isAdminUser(u)}
                                title={isAdminUser(u) ? 'Administrator accounts cannot be disabled' : undefined}
                                onClick={() => confirmToggle(u, false)}>
                                <UserX className="mr-1 h-3.5 w-3.5" /> Disable
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}
