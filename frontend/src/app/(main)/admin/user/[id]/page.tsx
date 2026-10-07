'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, BarChart3, Gift, IdCard, Landmark, Mail, Percent, ShieldCheck, TrendingUp, User as UserIcon, Wallet,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { KycPill, StatusPill } from '@/components/admin/pills';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/* eslint-disable @typescript-eslint/no-explicit-any */

const money = (v: unknown, digits = 2) =>
  Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');

function Section({ title, description, icon: Icon, children }: { title: string; description?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-yellow-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500"><Icon className="h-4 w-4" /></span>
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm font-medium break-all">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'pos' | 'neg' }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === 'pos' ? 'text-emerald-500' : tone === 'neg' ? 'text-red-500' : ''}`}>{value}</p>
    </div>
  );
}

function TxTable({ rows, kind }: { rows: any[]; kind: 'deposit' | 'withdrawal' }) {
  if (!rows?.length) return <Empty text={`No ${kind}s yet.`} />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{dt(r.createdAt)}</TableCell>
              <TableCell className="font-medium">{money(r.amount, 4)}</TableCell>
              <TableCell>{r.currency}</TableCell>
              <TableCell className="text-sm">{r.paymentMethod || r.withdrawalMethod || '—'}</TableCell>
              <TableCell>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-500' : r.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-red-500/15 text-red-500'
                }`}>{r.status}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DetailContent({ id }: { id: string }) {
  const { data: u, isLoading, isError } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => adminService.getUserById(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !u) {
    return (
      <div id="admin-user-notfound" className="mx-auto max-w-md space-y-3 py-20 text-center">
        <p className="text-lg font-semibold">User not found</p>
        <p className="text-sm text-muted-foreground">The user does not exist or you do not have permission to view it.</p>
        <Link href="/admin/users" className="text-sm text-yellow-500 hover:underline">← Back to users</Link>
      </div>
    );
  }

  const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ');
  const stats = u.tradingStats ?? {};
  const wallets: any[] = u.wallets ?? [];
  const accounts: any[] = u.tradingAccounts ?? [];
  const referrals: any[] = u.referralsMade ?? [];
  const kycDocs: any[] = u.kycDocuments ?? [];

  return (
    <div id="admin-user-detail" className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link href="/admin/users" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All users
        </Link>
        <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-yellow-500/20 blur-3xl" />
          <CardContent className="relative flex flex-wrap items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-xl font-bold text-black">
              {(u.profile?.firstName?.[0] || u.email[0]).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">{name || u.email}</h2>
              <p className="flex items-center gap-1.5 text-sm text-zinc-400"><Mail className="h-3.5 w-3.5" />{u.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={u.status} />
              <KycPill status={u.profile?.kycStatus} />
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${u.demoModeEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {u.demoModeEnabled ? 'Demo mode' : 'Live mode'}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-300">Read-only view</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Basic Information" icon={UserIcon}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="User ID"><span className="font-mono text-xs">{u.id}</span></Field>
            <Field label="Name">{name || '—'}</Field>
            <Field label="Email">{u.email}</Field>
            <Field label="Phone">{u.phone || '—'}</Field>
            <Field label="Country">{u.profile?.country || '—'}</Field>
            <Field label="Roles">{u.roles?.length ? u.roles.map((r: any) => r.role.name).join(', ') : 'USER'}</Field>
            <Field label="Email Verified">{u.emailVerified ? 'Yes' : 'No'}</Field>
            <Field label="2FA">{u.twoFactorEnabled ? 'Enabled' : 'Disabled'}</Field>
            <Field label="Registered">{dt(u.createdAt)}</Field>
            <Field label="Last Login">{u.lastLoginAt ? dt(u.lastLoginAt) : 'Never'}</Field>
          </div>
        </Section>

        <Section title="KYC Status" icon={ShieldCheck} description="Identity verification">
          <div className="mb-4 flex items-center gap-3">
            <KycPill status={u.profile?.kycStatus} />
            <span className="text-sm text-muted-foreground">{kycDocs.length} document(s) submitted</span>
          </div>
          {kycDocs.length === 0 ? (
            <Empty text="No KYC documents uploaded." />
          ) : (
            <div className="space-y-2">
              {kycDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><IdCard className="h-4 w-4 text-yellow-500" />{d.documentType}</span>
                  <span className="flex items-center gap-3">
                    <KycPill status={d.status} />
                    <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Wallet Summary" icon={Wallet} description="Balances across demo and live wallets">
        {wallets.length === 0 ? (
          <Empty text="No wallets created yet." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Locked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${w.type === 'DEMO' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-blue-500/15 text-blue-500'}`}>{w.type === 'DEMO' ? 'Demo' : 'Live'}</span>
                    </TableCell>
                    <TableCell className="font-medium">{w.currency}</TableCell>
                    <TableCell className="text-right font-mono">{money(w.balance, 4)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{money(w.lockedBalance, 4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <Section title="Trading Accounts" icon={Landmark} description="Standard, Pro and Raw accounts (demo and live)">
        {accounts.length === 0 ? (
          <Empty text="This user has no trading accounts." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Equity</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.accountNumber}</TableCell>
                    <TableCell>{a.name || '—'}</TableCell>
                    <TableCell>{a.accountClass}</TableCell>
                    <TableCell>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${a.type === 'DEMO' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-blue-500/15 text-blue-500'}`}>{a.type === 'DEMO' ? 'Demo' : 'Live'}</span>
                    </TableCell>
                    <TableCell className="text-sm">{a.server}</TableCell>
                    <TableCell>1:{a.leverage}</TableCell>
                    <TableCell className="text-right font-mono">{money(a.balance)}</TableCell>
                    <TableCell className="text-right font-mono">{money(a.equity)}</TableCell>
                    <TableCell className="text-xs">
                      {a.isArchived ? <span className="text-muted-foreground">Archived</span> : a.isActive ? <span className="text-emerald-500">Active</span> : 'Inactive'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Referral Information" icon={Gift}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <Field label="Referral Code"><span className="font-mono">{u.referralCode || '—'}</span></Field>
            <Field label="Referred By">{u.referredByUser ? u.referredByUser.email : 'Direct sign-up'}</Field>
            <Field label="Users Referred">{referrals.length}</Field>
            <Field label="Referral Earnings">${money(referrals.reduce((a: number, r: any) => a + Number(r.rewardAmount), 0))}</Field>
          </div>
          {referrals.length === 0 ? (
            <Empty text="This user has not referred anyone yet." />
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <Link key={r.id} href={`/admin/user/${r.referred.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/5">
                  <span>{r.referred.email}</span>
                  <span className="text-xs text-muted-foreground">{r.status} · {new Date(r.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Trading Statistics" icon={BarChart3} description="Across all trading accounts">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Total Orders" value={stats.totalOrders ?? 0} />
            <Stat label="Open Positions" value={stats.openPositions ?? 0} />
            <Stat label="Closed Positions" value={stats.closedPositions ?? 0} />
            <Stat label="Total Volume (lots)" value={money(stats.totalVolume ?? 0, 2)} />
            <Stat label="Realized P/L" value={`$${money(stats.realizedProfit ?? 0)}`} tone={(stats.realizedProfit ?? 0) > 0 ? 'pos' : (stats.realizedProfit ?? 0) < 0 ? 'neg' : undefined} />
            <Stat label="Win Rate" value={`${money(stats.winRate ?? 0, 1)}%`} />
          </div>
          {(stats.totalPositions ?? 0) === 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> No trading activity recorded yet.</p>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Deposit History" icon={ArrowDownToLine} description="Latest 20 deposits">
          <TxTable rows={u.deposits} kind="deposit" />
        </Section>
        <Section title="Withdrawal History" icon={ArrowUpFromLine} description="Latest 20 withdrawals">
          <TxTable rows={u.withdrawals} kind="withdrawal" />
        </Section>
      </div>

      <p className="flex items-center justify-center gap-1 pb-4 text-xs text-muted-foreground"><Percent className="hidden" />This page is read-only. Use the Users list to enable or disable accounts.</p>
    </div>
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminGuard>
      <DetailContent id={id} />
    </AdminGuard>
  );
}
