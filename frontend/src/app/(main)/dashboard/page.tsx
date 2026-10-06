'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, CreditCard, Shield, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { marketService } from '@/services/market.service';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { accountsService } from '@/services/accounts.service';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: accountsData = [] as any[], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['trading-accounts'],
    queryFn: accountsService.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardService.getOverview,
  });

  const liveAccounts = (accountsData as any[]).filter((a: any) => a.type === 'LIVE' && !a.isArchived);
  const demoAccounts = (accountsData as any[]).filter((a: any) => a.type === 'DEMO' && !a.isArchived);

  const totalLiveBalance = liveAccounts.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const totalDemoBalance = demoAccounts.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  
  const pnl = data?.portfolio?.pnl || 0;
  const activeOrders = data?.orders?.total || 0;
  const openPositionsCount = data?.portfolio?.items?.length || 0;
  const transactions = Array.isArray(data?.transactions) ? data.transactions.slice(0, 5) : [];
  
  const { data: liveMarketsData } = useQuery({
    queryKey: ['live-markets-dashboard'],
    queryFn: marketService.getLiveMarkets,
    refetchInterval: 5000,
  });

  const liveMarkets = useMemo(() => {
    return Array.isArray(liveMarketsData) 
      ? liveMarketsData.filter((m: any) => ['XAUUSD', 'EURUSD', 'GBPUSD', 'US30'].includes(m.symbol)).slice(0, 4) 
      : [];
  }, [liveMarketsData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || 'Trader'}!</p>
        </div>
        <div className="flex gap-2 items-center">

          <Link href="/wallet?tab=deposit" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md text-sm font-semibold transition">
            Deposit
          </Link>
          <Link href="/wallet?tab=withdraw" className="px-4 py-2 bg-white border rounded-md text-sm font-medium hover:bg-gray-50 transition text-black">
            Withdraw
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Row 1 */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Live Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{totalLiveBalance.toFixed(2)} USD</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Demo Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{totalDemoBalance.toFixed(2)} USD</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Live Accounts</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{liveAccounts.length}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Demo Accounts</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{demoAccounts.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Row 2 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USD
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{openPositionsCount}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{activeOrders}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Account Type</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-xl font-bold mt-1">Standard {user?.demoModeEnabled ? 'Demo' : 'Live'}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Popular Instruments</CardTitle>
            <CardDescription>Major Forex and Indices performance.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : liveMarkets.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">No market data available.</p>
            ) : (
              <div className="space-y-4">
                {liveMarkets.map((market: any) => (
                  <div key={market.symbol} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-500/20 text-yellow-600 flex items-center justify-center rounded-full font-bold">
                        {market.symbol?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="font-medium text-lg">{market.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Bid</p>
                        <p className="font-medium">{market.price.toFixed(5)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ask</p>
                        <p className="font-medium">{(market.price * 1.0001).toFixed(5)}</p>
                      </div>
                      <div className="w-16">
                        <p className={`text-sm font-bold ${market.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest funding history.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : transactions.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <p className="font-medium capitalize">{tx.type.toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{tx.amount} {tx.currency}</p>
                      <p className={`text-xs ${
                        tx.status === 'COMPLETED' ? 'text-green-500' : 
                        tx.status === 'PENDING' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
