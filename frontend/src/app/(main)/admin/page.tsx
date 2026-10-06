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

function StatCard({ title, value, icon: Icon, description }: {
  title: string; value: string | number; icon: React.ElementType; description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} description="Registered accounts" />
        <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={Activity} description="Active accounts" />
        <StatCard title="Wallet Balances" value={`$${(stats?.totalWalletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={DollarSign} description="Total across all wallets" />
        <StatCard title="Trading Volume" value={`$${(stats?.tradingVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={Activity} description="Total trade volume" />
        
        <StatCard title="Deposits Today" value={`$${(stats?.depositsToday || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={ArrowDownToLine} description="24h deposit volume" />
        <StatCard title="Withdrawals Today" value={`$${(stats?.withdrawalsToday || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={ArrowUpFromLine} description="24h withdrawal volume" />
        <StatCard title="Pending KYC" value={stats?.pendingKyc || 0} icon={ShieldCheck} description="Documents to review" />
        <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} icon={ArrowUpFromLine} description="Awaiting approval" />
      </div>

      {stats?.recentUsers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest users who signed up</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.map((user: { id: string; email: string; status: string; createdAt: string }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Admin Panel
          </h3>
          <p className="text-muted-foreground">
            Platform administration and monitoring
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start mb-4 bg-muted/50">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="deposits"><DepositApproval /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalApproval /></TabsContent>
        <TabsContent value="kyc"><KycManagement /></TabsContent>
        <TabsContent value="audit"><AuditLogs /></TabsContent>
      </Tabs>
    </div>
  );
}
