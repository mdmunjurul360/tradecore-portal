'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Filter, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TradeHistoryPage() {
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterSide, setFilterSide] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('30d');

  const { data: orderHistory, isLoading } = useQuery({
    queryKey: ['orders', 'HISTORY', filterSymbol],
    queryFn: () => orderService.getOrderHistory(filterSymbol || undefined),
  });

  const allOrders = Array.isArray(orderHistory?.data) ? orderHistory.data : Array.isArray(orderHistory) ? orderHistory : [];

  const filteredOrders = allOrders.filter((o: any) => {
    if (filterSide !== 'ALL' && o.side !== filterSide) return false;
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    return true;
  });

  const handleExport = (type: 'csv' | 'pdf') => {
    alert(`Export to ${type.toUpperCase()} feature is currently a placeholder. Coming soon.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Trade History & Statements</h3>
          <p className="text-muted-foreground">View your past trades, filter results, and download account statements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <Input 
                placeholder="Search Symbol (e.g. XAUUSD)" 
                className="pl-9 h-10" 
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterSide} onChange={(e) => setFilterSide(e.target.value)}>
                <option value="ALL">All Sides</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="FILLED">Filled</option>
                <option value="PARTIALLY_FILLED">Partially Filled</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No trade history found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-muted-foreground text-sm" suppressHydrationWarning>
                        {new Date(o.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-bold">{o.tradingPair?.symbol}</TableCell>
                      <TableCell className={`font-semibold ${o.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                        {o.side}
                      </TableCell>
                      <TableCell>{o.type}</TableCell>
                      <TableCell className="text-right font-mono">{parseFloat(o.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {o.type === 'MARKET' && !o.price ? 'Market' : parseFloat(o.price || '0').toFixed(5)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          o.status === 'FILLED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          o.status === 'CANCELLED' ? 'bg-muted text-muted-foreground' : 
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {o.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
