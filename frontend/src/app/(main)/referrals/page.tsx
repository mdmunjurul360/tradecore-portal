'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  Check, Copy, Gift, Share2, Users, UserCheck, Wallet, Hourglass, Link2, Inbox, QrCode, Coins,
} from 'lucide-react';
import { referralService, type ReferralHistoryItem } from '@/services/referral.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({
  title, value, hint, icon: Icon, loading,
}: { title: string; value: string | number; hint: string; icon: React.ElementType; loading: boolean }) {
  return (
    <Card className="relative overflow-hidden border-yellow-500/10 transition-all hover:-translate-y-0.5 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/5">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-yellow-500/10 blur-2xl" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold tracking-tight">{value}</div>}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function HistoryTable({ rows, showActive }: { rows: ReferralHistoryItem[]; showActive?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          {showActive && <TableHead>Activity</TableHead>}
          <TableHead>Reward</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.email}</TableCell>
            <TableCell>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === 'REWARDED' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                }`}
              >
                {item.status}
              </span>
            </TableCell>
            {showActive && (
              <TableCell className="text-sm text-muted-foreground">{item.active ? 'Active trader' : 'Registered'}</TableCell>
            )}
            <TableCell className="font-medium">${Number(item.rewardAmount).toFixed(2)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralService.getStats,
  });
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const referralCode = data?.referralCode || '';
  const referralLink = useMemo(
    () => (typeof window !== 'undefined' && referralCode ? `${window.location.origin}/register?ref=${referralCode}` : ''),
    [referralCode],
  );

  const copy = async (text: string, kind: 'code' | 'link') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === 'code' ? 'Referral code copied to clipboard' : 'Referral link copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Could not copy. Please copy it manually.');
    }
  };

  const share = async () => {
    if (!referralLink) return;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Join me on TradeCore',
          text: `Trade forex, metals and crypto with TradeCore. Use my referral code ${referralCode}.`,
          url: referralLink,
        });
        return;
      } catch {
        /* user cancelled - fall through to copy */
      }
    }
    await copy(referralLink, 'link');
  };

  const stats = data?.stats;
  const history = data?.history ?? [];
  const earnings = data?.earnings ?? [];

  return (
    <div id="referrals-page" className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Referral Programme</h2>
        <p className="text-muted-foreground">Invite friends to TradeCore and earn commission from their trading activity.</p>
      </div>

      {/* Hero: code, link, share, QR */}
      <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white">
        <div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl" />
        <CardContent className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
              <Gift className="h-3.5 w-3.5" /> Your personal invite
            </div>

            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-zinc-400">Referral Code</p>
              {isLoading ? (
                <Skeleton className="h-12 w-60 bg-zinc-800" />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span id="referral-code" className="rounded-lg border border-yellow-500/30 bg-black/40 px-4 py-2 font-mono text-2xl font-bold tracking-widest text-yellow-400">
                    {referralCode || '—'}
                  </span>
                  <Button
                    id="copy-referral-code"
                    size="sm"
                    onClick={() => copy(referralCode, 'code')}
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                  >
                    {copied === 'code' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    Copy Code
                  </Button>
                </div>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-zinc-400">Referral Link</p>
              {isLoading ? (
                <Skeleton className="h-10 w-full bg-zinc-800" />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                    <Link2 className="h-4 w-4 shrink-0 text-yellow-500" />
                    <span id="referral-link" className="truncate font-mono text-sm text-zinc-200">{referralLink || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      id="copy-referral-link"
                      onClick={() => copy(referralLink, 'link')}
                      className="bg-yellow-500 text-black hover:bg-yellow-400"
                    >
                      {copied === 'link' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      Copy Link
                    </Button>
                    <Button
                      id="share-referral-link"
                      variant="outline"
                      onClick={share}
                      className="border-yellow-500/40 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            {isLoading || !referralLink ? (
              <Skeleton className="h-36 w-36 bg-zinc-800" />
            ) : (
              <div id="referral-qr" className="rounded-xl bg-white p-3 shadow-lg shadow-yellow-500/10">
                <QRCodeSVG value={referralLink} size={120} level="M" />
              </div>
            )}
            <p className="flex items-center gap-1 text-xs text-zinc-400"><QrCode className="h-3 w-3" /> Scan to register</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Referrals" value={stats?.totalReferrals ?? 0} hint="Users who joined with your link" icon={Users} loading={isLoading} />
        <StatCard title="Active Referrals" value={stats?.activeReferrals ?? 0} hint="Funded or trading accounts" icon={UserCheck} loading={isLoading} />
        <StatCard title="Total Commission" value={`$${(stats?.totalRewards ?? 0).toFixed(2)}`} hint="Lifetime paid earnings" icon={Wallet} loading={isLoading} />
        <StatCard title="Pending Commission" value={`$${(stats?.pendingRewards ?? 0).toFixed(2)}`} hint="Awaiting settlement" icon={Hourglass} loading={isLoading} />
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Everyone who registered using your code.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : history.length === 0 ? (
            <EmptyState title="No referrals yet" text="Share your link or QR code - your first referral will show up here." />
          ) : (
            <HistoryTable rows={history} showActive />
          )}
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /> Referral Earnings</CardTitle>
          <CardDescription>Commission credited from your referrals&apos; activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : earnings.length === 0 ? (
            <EmptyState title="No earnings yet" text="Commission appears here once your referrals start trading." />
          ) : (
            <HistoryTable rows={earnings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
