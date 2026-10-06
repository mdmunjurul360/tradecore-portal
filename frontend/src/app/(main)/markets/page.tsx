'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketService } from '@/services/market.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [marketCategory, setMarketCategory] = useState<'FAVORITES' | 'FOREX' | 'METALS' | 'INDICES' | 'COMMODITIES' | 'CRYPTO'>('FAVORITES');
  
  const defaultFavorites = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];
  const [favorites, setFavorites] = useState<string[]>(defaultFavorites);

  // Load favorites from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('market_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem('market_favorites', JSON.stringify(next));
      return next;
    });
  };

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: marketService.getLiveMarkets,
    refetchInterval: 5000,
  });

  const getCategoryForSymbol = (symbol: string) => {
    if (['XAUUSD', 'XAGUSD'].includes(symbol)) return 'METALS';
    if (['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'USDCHF', 'USDCAD', 'NZDUSD', 'EURJPY', 'EURGBP'].includes(symbol)) return 'FOREX';
    if (['US30', 'NAS100', 'SPX500', 'GER40', 'UK100'].includes(symbol)) return 'INDICES';
    if (['UKOIL', 'USOIL', 'NGAS'].includes(symbol)) return 'COMMODITIES';
    if (['BTCUSD', 'ETHUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD'].includes(symbol)) return 'CRYPTO';
    return 'FOREX';
  };

  const filteredMarkets = markets.filter((market: any) => {
    const matchesSearch = market.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          market.name.toLowerCase().includes(search.toLowerCase());
    
    let matchesCategory = false;
    if (marketCategory === 'FAVORITES') {
      matchesCategory = favorites.includes(market.symbol);
    } else {
      matchesCategory = getCategoryForSymbol(market.symbol) === marketCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const renderMarketContent = () => {
    return (
      <>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No markets found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead className="text-right">Bid</TableHead>
                  <TableHead className="text-right">Ask</TableHead>
                  <TableHead className="text-right">Spread</TableHead>
                  <TableHead className="text-right">Daily Change</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Volume</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarkets.map((market: any) => {
                  const isFavorite = favorites.includes(market.symbol);
                  return (
                  <TableRow key={market.symbol} className="hover:bg-muted/50 cursor-pointer group">
                    <TableCell onClick={() => toggleFavorite(market.symbol)}>
                      <Star className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{market.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {market.price.toFixed(market.price < 1 ? 5 : 2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {(market.price * 1.0001).toFixed(market.price < 1 ? 5 : 2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {((market.price * 1.0001) - market.price).toFixed(market.price < 1 ? 5 : 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        market.change24h >= 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {market.change24h >= 0 ? '+' : ''}
                        {market.change24h.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground text-sm">
                      {market.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/trading/${market.symbol}`}>
                        <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-500 hover:bg-yellow-600 text-black">
                          Trade
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Market Watch</h3>
          <p className="text-muted-foreground">
            Monitor real-time prices for Forex, Metals, Indices, and Commodities.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 space-y-0 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search instruments..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Button variant={marketCategory === 'FAVORITES' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('FAVORITES')}>Favorites <Star className={`ml-2 h-3 w-3 ${marketCategory === 'FAVORITES' ? 'fill-yellow-500 text-yellow-500' : ''}`} /></Button>
            <Button variant={marketCategory === 'FOREX' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('FOREX')}>Forex</Button>
            <Button variant={marketCategory === 'METALS' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('METALS')}>Metals</Button>
            <Button variant={marketCategory === 'INDICES' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('INDICES')}>Indices</Button>
            <Button variant={marketCategory === 'COMMODITIES' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('COMMODITIES')}>Commodities</Button>
            <Button variant={marketCategory === 'CRYPTO' ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => setMarketCategory('CRYPTO')}>Crypto</Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderMarketContent()}
        </CardContent>
      </Card>
    </div>
  );
}
