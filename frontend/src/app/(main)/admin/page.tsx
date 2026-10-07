'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, DollarSign, ArrowDownToLine, ArrowUpFromLine,
  ShieldCheck, FileText, Search, CheckCircle2, XCircle,
  Activity, PlaySquare, RotateCcw, PlusCircle, MinusCircle, UserCog
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AdminGuard } from '@/components/admin/AdminGuard';
import Link from 'next/link';

function StatCard({ title, value, icon: Icon, description }: {
  title: string; value: string | number; icon: React.ElementType; description?: string;
}) {
  return (
    <Card className="border-[#222] bg-gradient-to-br from-[#111] to-[#0a0a0a] shadow-xl overflow-hidden group">
      <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} description="Registered accounts" />
        <StatCard title="Today's Registrations" value={stats?.todayRegistrations || 0} icon={Users} description="Signed up today" />
        <StatCard title="This Week Registrations" value={stats?.weekRegistrations || 0} icon={Users} description="Signed up in last 7 days" />
        <StatCard title="Verified Users" value={stats?.verifiedUsers || 0} icon={ShieldCheck} description="Approved KYC" />

        <StatCard title="Pending KYC" value={stats?.pendingKyc || 0} icon={ShieldCheck} description="Documents to review" />
        <StatCard title="Referral Users" value={stats?.referralUsers || 0} icon={Users} description="Users with referral links" />
        <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={Activity} description="Active accounts" />
        <StatCard title="Online Users" value={stats?.onlineUsers || 0} icon={Activity} description="Recently active" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Wallet Balances" value={`$${(stats?.totalWalletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} description="Total across all wallets" />
        <StatCard title="Trading Volume" value={`$${(stats?.tradingVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={Activity} description="Total trade volume" />
        <StatCard title="Deposits Today" value={`$${(stats?.depositsToday || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={ArrowDownToLine} description="24h deposit volume" />
        <StatCard title="Withdrawals Today" value={`$${(stats?.withdrawalsToday || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={ArrowUpFromLine} description="24h withdrawal volume" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#222] bg-gradient-to-br from-[#111] to-[#0a0a0a] shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Platform Growth (30D)</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-end gap-2 pt-4">
            {/* Dummy Bar Chart */}
            {[40, 25, 60, 45, 80, 50, 90, 75, 100, 85, 120, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500 transition-colors rounded-t-sm" style={{ height: `${(h / 120) * 100}%` }} />
            ))}
          </CardContent>
        </Card>
        
        <Card className="border-[#222] bg-gradient-to-br from-[#111] to-[#0a0a0a] shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Deposits vs Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-end gap-4 pt-4 px-4">
            {/* Dummy Bar Chart */}
            {[60, 40, 80, 50, 100, 70, 40, 20].map((h, i) => (
              <div key={i} className={`flex-1 transition-colors rounded-t-sm ${i % 2 === 0 ? 'bg-emerald-500/50 hover:bg-emerald-500' : 'bg-red-500/50 hover:bg-red-500'}`} style={{ height: `${(h / 100) * 100}%` }} />
            ))}
          </CardContent>
        </Card>
      </div>

      {stats?.recentUsers?.length > 0 && (
        <Card className="border-[#222] bg-[#111] shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Recent Registrations</CardTitle>
            <CardDescription className="text-zinc-400">Latest users who signed up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-[#222] overflow-hidden">
              <Table>
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow className="border-[#222] hover:bg-transparent">
                    <TableHead className="text-zinc-400">Email</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-right text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((user: { id: string; email: string; status: string; createdAt: string }) => (
                    <TableRow key={user.id} className="border-[#222] hover:bg-[#1a1a1a] transition-colors">
                      <TableCell className="font-medium text-zinc-200">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.status === 'ACTIVE' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'border-zinc-500/50 text-zinc-500 bg-zinc-500/10'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-zinc-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserManagement() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminService.getUsers({ search: search || undefined }),
  });

  const toggleDemoMode = useMutation({
    mutationFn: (userId: string) => adminService.toggleDemoMode(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const resetDemoBalance = useMutation({
    mutationFn: (userId: string) => adminService.resetDemoBalance(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const creditWallet = useMutation({
    mutationFn: (userId: string) => {
      const amount = prompt('Enter amount to credit:');
      if (!amount || isNaN(Number(amount))) return Promise.reject('Invalid amount');
      const currency = prompt('Enter currency (e.g. USDT):');
      if (!currency) return Promise.reject('Invalid currency');
      return adminService.creditWallet(userId, currency, amount);
    },
    onSuccess: () => alert('Wallet credited successfully')
  });

  const debitWallet = useMutation({
    mutationFn: (userId: string) => {
      const amount = prompt('Enter amount to debit:');
      if (!amount || isNaN(Number(amount))) return Promise.reject('Invalid amount');
      const currency = prompt('Enter currency (e.g. USDT):');
      if (!currency) return Promise.reject('Invalid currency');
      return adminService.debitWallet(userId, currency, amount);
    },
    onSuccess: () => alert('Wallet debited successfully')
  });

  const suspendUser = useMutation({
    mutationFn: (userId: string) => adminService.suspendUser(userId),
    onSuccess: () => {
      alert('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const activateUser = useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      alert('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const resetPassword = useMutation({
    mutationFn: (userId: string) => {
      const password = prompt('Enter new temporary password for the user:');
      if (!password) return Promise.reject('Password required');
      return adminService.resetPassword(userId, password);
    },
    onSuccess: () => alert('Password reset successfully')
  });

  const users = data?.data || (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage all registered users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Demo Mode</TableHead>
                <TableHead>Wallets</TableHead>
                <TableHead className="text-right">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: Record<string, unknown>) => (
                <TableRow key={user.id as string}>
                  <TableCell className="font-medium">{user.email as string}</TableCell>
                  <TableCell>
                    {(user.profile as Record<string, unknown>)?.firstName
                      ? `${(user.profile as Record<string, unknown>).firstName} ${(user.profile as Record<string, unknown>).lastName || ''}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(user.profile as Record<string, unknown>)?.kycStatus === 'APPROVED' ? 'default' : 'secondary'}>
                      {((user.profile as Record<string, unknown>)?.kycStatus as string) || 'PENDING'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(user.status as string) === 'ACTIVE' ? 'default' : 'destructive'}>
                      {user.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(user.demoModeEnabled as boolean) ? 'secondary' : 'outline'}>
                      {user.demoModeEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </TableCell>
                  <TableCell>{((user._count as Record<string, number>)?.wallets) || 0}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {new Date(user.createdAt as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => toggleDemoMode.mutate(user.id as string)}>
                          <PlaySquare className="mr-2 h-4 w-4" />
                          Toggle Demo Mode
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => resetDemoBalance.mutate(user.id as string)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Demo Balances
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => creditWallet.mutate(user.id as string)}>
                          <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                          Credit Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => debitWallet.mutate(user.id as string)}>
                          <MinusCircle className="mr-2 h-4 w-4 text-red-500" />
                          Debit Wallet
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => (user.status === 'ACTIVE' ? suspendUser.mutate(user.id as string) : activateUser.mutate(user.id as string))}>
                          <UserCog className="mr-2 h-4 w-4" />
                          {user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => resetPassword.mutate(user.id as string)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DepositApproval() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: () => adminService.getDeposits(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveDeposit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminService.rejectDeposit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  const deposits = data?.data || (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Requests</CardTitle>
        <CardDescription>Review and approve/reject deposit requests</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : deposits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No deposit requests found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit: Record<string, unknown>) => (
                <TableRow key={deposit.id as string}>
                  <TableCell className="font-medium">{(deposit.user as Record<string, unknown>)?.email as string || '—'}</TableCell>
                  <TableCell>{Number(deposit.amount).toFixed(4)}</TableCell>
                  <TableCell>{deposit.currency as string}</TableCell>
                  <TableCell>{deposit.paymentMethod as string}</TableCell>
                  <TableCell>
                    <Badge variant={(deposit.status as string) === 'APPROVED' ? 'default' : (deposit.status as string) === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {deposit.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(deposit.createdAt as string).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {(deposit.status as string) === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => approveMutation.mutate(deposit.id as string)} disabled={approveMutation.isPending}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(deposit.id as string)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalApproval() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => adminService.getWithdrawals(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveWithdrawal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminService.rejectWithdrawal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] }),
  });

  const withdrawals = data?.data || (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>Review and approve/reject withdrawal requests</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No withdrawal requests found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w: Record<string, unknown>) => (
                <TableRow key={w.id as string}>
                  <TableCell className="font-medium">{(w.user as Record<string, unknown>)?.email as string || '—'}</TableCell>
                  <TableCell>{Number(w.amount).toFixed(4)}</TableCell>
                  <TableCell>{w.currency as string}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs font-mono">{w.destination as string}</TableCell>
                  <TableCell>
                    <Badge variant={(w.status as string) === 'APPROVED' ? 'default' : (w.status as string) === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {w.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs font-mono">
                    {(w.txHash as string) || <span className="text-muted-foreground italic">None</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(w.createdAt as string).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {(w.status as string) === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => approveMutation.mutate(w.id as string)} disabled={approveMutation.isPending}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(w.id as string)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function KycManagement() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc'],
    queryFn: () => adminService.getKycDocuments(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => {
      const notes = prompt('Any notes for this approval? (Optional)');
      return adminService.approveKyc(id, notes || undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-kyc'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return Promise.reject('Reason required');
      const notes = prompt('Any admin notes? (Optional)');
      return adminService.rejectKyc(id, reason, notes || undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-kyc'] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (id: string) => {
      const notes = prompt('Enter admin notes:');
      if (!notes) return Promise.reject('Notes required');
      return adminService.addKycNote(id, notes);
    },
    onSuccess: () => {
      alert('Note added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
    }
  });

  const docs = data?.data || (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>Review identity documents and verify users</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No KYC documents to review.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc: Record<string, unknown>) => (
                <TableRow key={doc.id as string}>
                  <TableCell className="font-medium">{(doc.user as Record<string, unknown>)?.email as string || '—'}</TableCell>
                  <TableCell>{doc.documentType as string}</TableCell>
                  <TableCell>
                    <Badge variant={(doc.status as string) === 'APPROVED' ? 'default' : (doc.status as string) === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {doc.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(doc.createdAt as string).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {(doc.status as string) === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => approveMutation.mutate(doc.id as string)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(doc.id as string)}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => addNoteMutation.mutate(doc.id as string)}>
                          <FileText className="h-3 w-3 mr-1" /> Add Note
                        </Button>
                      </div>
                    )}
                    {!!doc.adminNotes && (
                      <div className="text-xs text-muted-foreground mt-2 italic text-right max-w-[200px] truncate ml-auto" title={doc.adminNotes as string}>
                        Note: {doc.adminNotes as string}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
  });

  const logs = data?.data || (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>System activity and change history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No audit logs recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: Record<string, unknown>) => (
                <TableRow key={log.id as string}>
                  <TableCell className="font-medium">{log.action as string}</TableCell>
                  <TableCell>{(log.user as Record<string, unknown>)?.email as string || 'System'}</TableCell>
                  <TableCell className="text-xs">{log.entityType as string}: {(log.entityId as string)?.substring(0, 8)}...</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(log.ipAddress as string) || '—'}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{new Date(log.createdAt as string).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useSearchParams } from 'next/navigation';

function PlaceholderTab({ title, description }: { title: string, description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <p>This module is currently under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'deposits': return <DepositApproval />;
      case 'withdrawals': return <WithdrawalApproval />;
      case 'kyc': return <KycManagement />;
      case 'audit': return <AuditLogs />;
      case 'trading-accounts': return <PlaceholderTab title="Trading Accounts" description="Manage user trading accounts" />;
      case 'transactions': return <PlaceholderTab title="Transactions" description="View system transactions" />;
      case 'referral': return <PlaceholderTab title="Referral Program" description="Manage referral networks and commissions" />;
      case 'wallets': return <PlaceholderTab title="Wallets" description="Manage user wallets and balances" />;
      case 'analytics': return <PlaceholderTab title="Analytics" description="View platform analytics" />;
      case 'revenue': return <PlaceholderTab title="Revenue" description="Platform revenue and PnL" />;
      case 'settings': return <PlaceholderTab title="System Settings" description="Configure platform settings" />;
      case 'roles': return <PlaceholderTab title="Roles & Permissions" description="Manage admin roles and permissions" />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">
          {activeTab.replace('-', ' ')}
        </h2>
        <p className="text-zinc-400">
          Manage platform {activeTab.replace('-', ' ')} and configurations
        </p>
      </div>

      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
}

