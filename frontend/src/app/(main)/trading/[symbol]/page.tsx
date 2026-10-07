'use client';

import { useState, use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { marketService } from '@/services/market.service';
import { accountsService } from '@/services/accounts.service';
import { useTradingSocket } from '@/hooks/useTradingSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TradingChart } from '@/components/trading/Chart';
import { MarketSelector } from '@/components/trading/MarketSelector';

import { useParams } from 'next/navigation';

export default function TradingPage() {
  const params = useParams();
  const symbol = params?.symbol ? (params.symbol as string).toUpperCase() : 'XAUUSD';
  const baseCurrency = symbol;

  const [orderType, setOrderType] = useState<'MARKET' | 'PENDING'>('MARKET');
  const [pendingType, setPendingType] = useState<'LIMIT' | 'STOP'>('LIMIT');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState('');
  const [amountInput, setAmountInput] = useState('100');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [chartInterval, setChartInterval] = useState('15m');

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { orderBook, trades: wsTrades, price: wsPrice, userOrderUpdate, kline } = useTradingSocket(symbol, chartInterval);

  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ['market', baseCurrency],
    queryFn: () => marketService.getSingleMarket(baseCurrency),
    refetchInterval: 5000, // slower refetch since we have ws
  });

  const { data: openOrders, refetch: refetchOpenOrders } = useQuery({
    queryKey: ['orders', 'OPEN', symbol],
    queryFn: () => orderService.getOpenOrders(symbol),
  });

  const { data: orderHistory, refetch: refetchOrderHistory } = useQuery({
    queryKey: ['orders', 'HISTORY', symbol],
    queryFn: () => orderService.getOrderHistory(symbol),
  });

  useEffect(() => {
    if (userOrderUpdate) {
      refetchOpenOrders();
      refetchOrderHistory();
    }
  }, [userOrderUpdate, refetchOpenOrders, refetchOrderHistory]);

  const { data: accounts = [] } = useQuery({
    queryKey: ['trading-accounts'],
    queryFn: accountsService.list,
  });
  const currentAccount = accounts.find((a) => a.isCurrent) || null;

  if (!isMounted) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] max-w-[1600px] mx-auto space-y-2 animate-pulse p-4">
        <div className="h-16 bg-muted/50 rounded border shrink-0"></div>
        <div className="flex-1 bg-muted/50 rounded border"></div>
        <div className="h-64 bg-muted/50 rounded border shrink-0"></div>
      </div>
    );
  }

  const market = marketData || { price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0 };
  const currentPrice = wsPrice || market.price;
  
  const allOpen = Array.isArray(openOrders) ? openOrders : [];
  const openPositionsList = allOpen.filter((o: any) => o.metadata?.isPosition === true);
  const pendingOrdersList = allOpen.filter((o: any) => o.metadata?.isPosition !== true);
  const historyOrdersList = Array.isArray(orderHistory) ? orderHistory : [];

  const floatingPnL = openPositionsList.reduce((acc: number, o: any) => {
    const openPrice = parseFloat(o.price || '0');
    const volume = parseFloat(o.quantity || '0');
    if (openPrice > 0 && currentPrice > 0) {
      const profit = o.side === 'BUY' ? (currentPrice - openPrice) * volume * 100000 : (openPrice - currentPrice) * volume * 100000;
      return acc + profit;
    }
    return acc;
  }, 0);

  const handleCloseAll = async () => {
    if (!confirm('Are you sure you want to close all open positions for this symbol?')) return;
    try {
      await Promise.all(openPositionsList.map((o: any) => orderService.cancelOrder(o.id, currentPrice)));
      alert('All positions closed!');
      refetchOpenOrders();
      refetchOrderHistory();
    } catch (err: any) {
      alert('Failed to close some positions.');
    }
  };

  const handleOrder = async (e: React.FormEvent, forceSide?: 'BUY' | 'SELL') => {
    e.preventDefault();
    const actualOrderSide = forceSide || orderSide;
    const usdMargin = parseFloat(amountInput || '100');
    const actualOrderType = orderType === 'MARKET' ? 'MARKET' : pendingType;
    const price = orderType === 'PENDING' ? parseFloat(priceInput) : currentPrice;

    if (isNaN(usdMargin) || usdMargin <= 0) return alert('Invalid amount');
    if (orderType === 'PENDING' && (isNaN(price as number) || (price as number) <= 0)) return alert('Invalid price');

    const instrumentDetails = marketService.getInstrumentDetails(symbol);
    const leverage = Number(instrumentDetails.leverage);
    const contractSize = Number(instrumentDetails.contractSize);
    const minLot = Number(instrumentDetails.minLot || 0.01);

    // Calculate raw Lot Size from USD Margin
    const rawAmount = (usdMargin * leverage) / (contractSize * currentPrice);
    
    // Round down to the nearest minLot step (e.g. 0.01)
    const precision = Math.max(0, -Math.floor(Math.log10(minLot)));
    const factor = Math.pow(10, precision);
    const amount = Math.floor(rawAmount * factor) / factor;

    if (!isFinite(amount) || amount < minLot) {
      return alert(`Amount too low. With $${usdMargin} margin and 1:${leverage} leverage, you can afford ${rawAmount.toFixed(4)} lots, but the minimum order size is ${minLot} lots.`);
    }

    if (!currentPrice || currentPrice <= 0) return alert('Live price is unavailable. Please wait.');

    try {
      await orderService.createOrder({
        symbol,
        type: actualOrderType,
        side: actualOrderSide,
        amount,
        price,
        isCfd: true,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
      alert('Order placed successfully!');
      refetchOpenOrders();
    } catch (err: any) {
      console.error('ORDER PLACEMENT ERROR:', err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to place order.';
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    }
  };

  const handleCancel = async (id: string, customPrice?: number) => {
    try {
      await orderService.cancelOrder(id, customPrice || currentPrice);
      alert('Order cancelled!');
      refetchOpenOrders();
      refetchOrderHistory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const ChartComponent = (
    <div className="h-full w-full bg-card rounded border min-h-[400px] lg:min-h-0 relative">
      <TradingChart symbol={baseCurrency} kline={kline} interval={chartInterval} onIntervalChange={setChartInterval} />
    </div>
  );



    const TradingFormComponent = (
    <div className="flex flex-col h-full bg-card rounded border min-h-[400px] lg:min-h-0">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
        <span className="font-bold text-sm">Trade {baseCurrency}</span>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          Spread: <span className="font-bold text-foreground">0.3</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Tabs defaultValue="MARKET" onValueChange={(val) => {
          setOrderType(val === 'MARKET' ? 'MARKET' : 'PENDING');
          if (val !== 'MARKET') setPendingType(val);
        }} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50 rounded-none shrink-0">
            <TabsTrigger value="MARKET" className="text-xs font-medium">Market</TabsTrigger>
            <TabsTrigger value="LIMIT" className="text-xs font-medium">Limit</TabsTrigger>
            <TabsTrigger value="STOP" className="text-xs font-medium">Stop</TabsTrigger>
          </TabsList>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-3 space-y-4 flex-1">
              {orderType === 'PENDING' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price</label>
                    <span className="text-[10px] font-medium text-muted-foreground">{currentPrice ? currentPrice.toFixed(5) : '0.00000'}</span>
                  </div>
                  <Input 
                    type="number" step="0.00001" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} required 
                    className="h-9 px-2 text-sm font-medium" placeholder="0.00000"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount (Margin)</label>
                  <span className="font-bold text-primary text-xs">${parseFloat(amountInput || '100').toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[50, 100, 200, 500, 1000, 5000].map(amt => (
                    <button key={amt} type="button" onClick={() => setAmountInput(amt.toString())}
                      className={`h-8 text-[10px] font-bold rounded border transition-colors ${parseFloat(amountInput || '100') === amt ? 'bg-primary/10 border-primary text-primary' : 'border-muted hover:bg-muted text-muted-foreground bg-card'}`}>
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stop Loss</label>
                  <Input type="number" step="0.00001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="h-9 text-sm" placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Take Profit</label>
                  <Input type="number" step="0.00001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="h-9 text-sm" placeholder="Optional" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium text-[10px]">Contract Size</span>
                  <span className="font-semibold text-foreground text-[10px]">{marketService.getInstrumentDetails(symbol).contractSizeLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium text-[10px]">Position Size (Lots)</span>
                  <span className="font-bold text-foreground text-[10px]">{amountInput && currentPrice ? ((parseFloat(amountInput || '100') * Number(marketService.getInstrumentDetails(symbol).leverage)) / (Number(marketService.getInstrumentDetails(symbol).contractSize) * currentPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} Lots</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-card border-t shrink-0 flex gap-2">
              <Button type="button" onClick={(e) => { setOrderSide('SELL'); handleOrder(e, 'SELL'); }}
                className="flex-1 h-12 flex flex-col items-center justify-center gap-0.5 bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md">
                <span className="text-sm">Sell {orderType === 'PENDING' ? pendingType : ''}</span>
                {orderType === 'MARKET' && <span className="text-[10px] font-normal opacity-80">{currentPrice ? (currentPrice - 0.00010).toFixed(5) : '0.00000'}</span>}
              </Button>
              <Button type="button" onClick={(e) => { setOrderSide('BUY'); handleOrder(e, 'BUY'); }}
                className="flex-1 h-12 flex flex-col items-center justify-center gap-0.5 bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-md">
                <span className="text-sm">Buy {orderType === 'PENDING' ? pendingType : ''}</span>
                {orderType === 'MARKET' && <span className="text-[10px] font-normal opacity-80">{currentPrice ? (currentPrice + 0.00010).toFixed(5) : '0.00000'}</span>}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col ${isMobile ? 'h-auto overflow-visible' : 'h-[calc(100vh-6rem)] overflow-hidden'} space-y-2 max-w-[1600px] mx-auto`}>
      {/* Top Ticker */}
      <div className="flex justify-between items-center bg-card p-3 rounded border shrink-0">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold">{baseCurrency}/USDT</div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase">Last Price</div>
            <div className={`font-semibold ${market.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] text-muted-foreground uppercase">24h Change</div>
            <div className={`font-semibold ${market.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] text-muted-foreground uppercase">24h High</div>
            <div className="font-semibold text-sm">
              ${market.high24h.toFixed(market.high24h < 1 ? 6 : 2)}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] text-muted-foreground uppercase">24h Low</div>
            <div className="font-semibold text-sm">
              ${market.low24h.toFixed(market.low24h < 1 ? 6 : 2)}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-[10px] text-muted-foreground uppercase">24h Vol</div>
            <div className="font-semibold text-sm">
              {market.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {!isMobile ? (
        <PanelGroup direction="vertical" className="h-full min-h-0 w-full" autoSaveId="trading-root">
          <Panel defaultSize={70} minSize={40}>
            <PanelGroup direction="horizontal" autoSaveId="trading-top-row">
              <Panel defaultSize={15} minSize={10} maxSize={25}>
                <MarketSelector currentSymbol={symbol} />
              </Panel>
              
              <PanelResizeHandle className="w-1.5 flex flex-col items-center justify-center bg-transparent cursor-col-resize group">
                <div className="h-8 w-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
              </PanelResizeHandle>
              
              <Panel defaultSize={60} minSize={30}>
                {ChartComponent}
              </Panel>
              
              <PanelResizeHandle className="w-1.5 flex flex-col items-center justify-center bg-transparent cursor-col-resize group">
                <div className="h-8 w-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
              </PanelResizeHandle>
              
              <Panel defaultSize={25} minSize={22} maxSize={35}>
                {TradingFormComponent}
              </Panel>
            </PanelGroup>
          </Panel>
          
          <PanelResizeHandle className="h-1.5 flex flex-row items-center justify-center bg-transparent cursor-row-resize group">
            <div className="w-8 h-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
          </PanelResizeHandle>
          
          <Panel defaultSize={30} minSize={15} maxSize={60}>
            {/* Bottom: Orders Table */}
            <div className="h-full bg-card rounded border flex flex-col overflow-hidden">
              <Tabs defaultValue="open" className="w-full h-full flex flex-col">
                <div className="border-b px-2 pt-2 bg-muted/30">
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger value="open" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">Open Positions</TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">Pending Orders</TabsTrigger>
                    <TabsTrigger value="closed" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">Closed Orders</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">History</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-auto">
            <TabsContent value="open" className="m-0 flex flex-col h-full">
              <div className="flex items-center justify-between p-2 border-b bg-muted/10 shrink-0">
                <div className="flex items-center gap-4 text-sm">
                  {currentAccount && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Balance:</span> <span className="font-medium">${Number(currentAccount.balance).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Floating P/L:</span>{' '}
                        <span className={`font-bold ${floatingPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {floatingPnL >= 0 ? '+' : ''}{floatingPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-muted-foreground">Margin Level:</span> <span className="font-medium">{currentAccount.marginLevel !== null ? `${currentAccount.marginLevel.toFixed(2)}%` : '—'}</span>
                      </div>
                    </>
                  )}
                </div>
                {openPositionsList.length > 0 && (
                  <Button variant="destructive" size="sm" className="h-7 text-xs px-3" onClick={handleCloseAll}>
                    Close All {symbol}
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
              {openPositionsList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No open positions</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="text-xs">
                      <TableHead>Pair</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Lot</TableHead>
                      <TableHead className="text-right">Open Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">TP</TableHead>
                      <TableHead className="text-right">Floating P/L</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openPositionsList.map((o: any) => {
                      const openPrice = parseFloat(o.price || '0');
                      const volume = parseFloat(o.quantity || '0');
                      const contractSize = Number(marketService.getInstrumentDetails(symbol).contractSize);
                      const leverage = Number(marketService.getInstrumentDetails(symbol).leverage);
                      let profit = 0;
                      if (openPrice > 0 && currentPrice > 0) {
                        profit = o.side === 'BUY' ? (currentPrice - openPrice) * volume * contractSize : (openPrice - currentPrice) * volume * contractSize;
                      }
                      const margin = (openPrice * volume * contractSize) / leverage;
                      
                      return (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="font-bold">{o.tradingPair?.symbol}</TableCell>
                        <TableCell className={o.side === 'BUY' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{o.side}</TableCell>
                        <TableCell className="text-right">{volume.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{openPrice.toFixed(5)}</TableCell>
                        <TableCell className="text-right font-medium">{currentPrice.toFixed(5)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.stopLoss ? parseFloat(o.metadata.stopLoss).toFixed(5) : '—'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.takeProfit ? parseFloat(o.metadata.takeProfit).toFixed(5) : '—'}</TableCell>
                        <TableCell className={`text-right font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profit >= 0 ? '+' : ''}{profit.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{margin.toFixed(2)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => alert('Modify not implemented')}>Modify</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 bg-red-500/10 text-red-500 hover:bg-red-500/20" onClick={() => handleCancel(o.id)}>Close</Button>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="m-0 h-full">
              {pendingOrdersList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No pending orders</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="text-xs">
                      <TableHead>Symbol</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Open Price</TableHead>
                      <TableHead className="text-right">S/L</TableHead>
                      <TableHead className="text-right">T/P</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrdersList.map((o: any) => (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="font-medium">{o.tradingPair?.symbol}</TableCell>
                        <TableCell>#{o.id.substring(0, 8)}</TableCell>
                        <TableCell suppressHydrationWarning>{new Date(o.createdAt).toLocaleString()}</TableCell>
                        <TableCell className={o.side === 'BUY' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{o.side} {o.type}</TableCell>
                        <TableCell className="text-right">{parseFloat(o.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{parseFloat(o.price || '0').toFixed(5)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.stopLoss ? parseFloat(o.metadata.stopLoss).toFixed(5) : '0.00000'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.takeProfit ? parseFloat(o.metadata.takeProfit).toFixed(5) : '0.00000'}</TableCell>
                        <TableCell className="text-right">{o.status}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 hover:bg-muted" onClick={() => handleCancel(o.id)}>Cancel</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="closed" className="m-0 h-full">
              {historyOrdersList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No closed orders</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="text-xs">
                      <TableHead>Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyOrdersList.map((o: any) => (
                      <TableRow key={o.id} className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                        <TableCell suppressHydrationWarning>{new Date(o.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{o.tradingPair?.symbol}</TableCell>
                        <TableCell>{o.type}</TableCell>
                        <TableCell className={o.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>{o.side}</TableCell>
                        <TableCell className="text-right">{o.type === 'MARKET' ? 'Market' : parseFloat(o.price || '0').toFixed(5)}</TableCell>
                        <TableCell className="text-right">{parseFloat(o.quantity).toFixed(4)}</TableCell>
                        <TableCell className="text-right font-medium">{o.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0 h-full">
               <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="text-xs">
                      <TableHead>Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wsTrades.map((t: any) => (
                      <TableRow key={t.id} className="text-xs">
                        <TableCell className="text-muted-foreground" suppressHydrationWarning>{new Date(t.createdAt).toLocaleTimeString()}</TableCell>
                        <TableCell className={t.side === 'BUY' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                          {parseFloat(t.price).toFixed(5)}
                        </TableCell>
                        <TableCell className="text-right">{parseFloat(t.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {wsTrades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Waiting for live trades...</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      </Panel>
    </PanelGroup>
    ) : (
      <>
        <div className="flex flex-col gap-2 h-full overflow-y-auto pb-32">
          <div className="h-[300px] shrink-0">
            <MarketSelector currentSymbol={`${baseCurrency}USDT`} />
          </div>
          <div className="h-[400px] shrink-0">
            {ChartComponent}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-2xl">
          <div className="h-[50vh] overflow-y-auto">
            {TradingFormComponent}
          </div>
        </div>
      </>
    )}
    </div>
  );
}
