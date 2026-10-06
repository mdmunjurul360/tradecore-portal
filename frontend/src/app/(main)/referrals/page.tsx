'use client';

import { useQuery } from '@tanstack/react-query';
import { referralService } from '@/services/referral.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralService.getStats,
  });

  const referralLink = typeof window !== 'undefined' && data?.referralCode
    ? `${window.location.origin}/register?ref=${data.referralCode}`
    : '';

  const copyToClipboard = (text: string, type: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Referral System</h3>
        <p className="text-muted-foreground">
          Invite friends and earn rewards for every trade they make.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats?.totalReferrals || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats?.totalReferrals || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Trading active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">${(data?.stats?.totalRewards || 0).toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">$0.00</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting settlement
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Details</CardTitle>
          <CardDescription>Share this code or link to invite new users to the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full max-w-md" />
          ) : (
            <>
              <div>
                <p className="text-sm font-medium mb-1">Referral Code</p>
                <div className="flex gap-2 max-w-xl">
                  <Input
                    readOnly
                    value={data?.referralCode || ''}
                    className="font-mono text-sm max-w-[200px]"
                  />
                  <Button variant="secondary" onClick={() => copyToClipboard(data?.referralCode || '', 'Referral code')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Referral Link</p>
                <div className="flex gap-2 max-w-xl">
                  <Input
                    readOnly
                    value={referralLink}
                    className="font-mono text-sm"
                  />
                  <Button variant="secondary" onClick={() => copyToClipboard(referralLink, 'Referral link')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Recent users who signed up with your link.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !data?.history || data.history.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No referrals yet. Share your link to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.history?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'REWARDED' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${item.rewardAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
