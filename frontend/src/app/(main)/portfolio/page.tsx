'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolio.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioPage() {
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: portfolioService.getSummary,
  });

  const { data: holdingsData, isLoading: isLoadingHoldings } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: () => portfolioService.getPortfolio(),
  });

  const rawSummary = summaryData?.data || summaryData || { totalValue: 0, totalUnrealizedPnL: 0, totalRealizedPnL: 0, totalCost: 0 };
  const totalPnl = (rawSummary.totalUnrealizedPnL || 0) + (rawSummary.totalRealizedPnL || 0);
  const pnlPercentage = rawSummary.totalCost > 0 ? (totalPnl / rawSummary.totalCost) * 100 : 0;
  
  const summary = {
    totalValue: rawSummary.totalValue,
    totalPnl,
    pnlPercentage
  };

  let holdings = [];
  if (Array.isArray(holdingsData?.data)) {
    holdings = holdingsData.data;
  } else if (Array.isArray(holdingsData?.data?.holdings)) {
    holdings = holdingsData.data.holdings;
  } else if (Array.isArray(holdingsData)) {
    holdings = holdingsData;
  } else if (Array.isArray(holdingsData?.holdings)) {
    holdings = holdingsData.holdings;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Portfolio Analytics</h3>
          <p className="text-muted-foreground">
            Track your asset allocation and overall performance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Estimated Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-3xl font-bold">${parseFloat(summary.totalValue || 0).toFixed(2)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">All-Time PNL</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className={`text-3xl font-bold ${summary.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.totalPnl >= 0 ? '+' : ''}${parseFloat(summary.totalPnl as any || 0).toFixed(2)}
                </div>
                <p className={`text-xs mt-1 flex items-center ${summary.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.totalPnl >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {parseFloat(summary.pnlPercentage as any || 0).toFixed(2)}% ROI
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Assets Held</CardTitle>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingHoldings ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold">{holdings.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>Breakdown of your current cryptocurrency holdings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHoldings ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assets in your portfolio yet. Deposit or trade to build your portfolio.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Avg Buy Price</TableHead>
                  <TableHead className="text-right">Realized PNL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((asset: any) => (
                  <TableRow key={asset.asset}>
                    <TableCell className="font-medium">{asset.asset}</TableCell>
                    <TableCell className="text-right">{parseFloat(asset.quantity || 0).toFixed(6)}</TableCell>
                    <TableCell className="text-right">${parseFloat(asset.averageBuyPrice || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                       {parseFloat(asset.realizedPnL || 0) >= 0 ? (
                         <span className="text-green-500">+{parseFloat(asset.realizedPnL || 0).toFixed(2)}</span>
                       ) : (
                         <span className="text-red-500">{parseFloat(asset.realizedPnL || 0).toFixed(2)}</span>
                       )}
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
