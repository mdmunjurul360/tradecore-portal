'use client';

import { useState, use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { marketService } from '@/services/market.service';
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
  const [amountInput, setAmountInput] = useState('0.01');
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

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    const actualOrderType = orderType === 'MARKET' ? 'MARKET' : pendingType;
    const price = orderType === 'PENDING' ? parseFloat(priceInput) : (orderSide === 'BUY' ? currentPrice : undefined);

    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
    if (orderType === 'PENDING' && (isNaN(price as number) || (price as number) <= 0)) return alert('Invalid price');

    try {
      await orderService.createOrder({
        symbol,
        type: actualOrderType,
        side: orderSide,
        amount,
        price,
        isCfd: true,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
      alert('Order placed successfully!');
      refetchOpenOrders();
      setAmountInput('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to place order.');
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

  const OrderBookComponent = (
    <div className="flex flex-col h-full bg-card rounded border overflow-hidden min-h-[300px] lg:min-h-0">
      <div className="p-2 border-b bg-muted/50 font-semibold text-sm">Order Book</div>
      <div className="flex flex-col h-full overflow-hidden text-xs">
        <div className="flex justify-between px-3 py-1 text-muted-foreground font-medium">
          <span>Price</span>
          <span>Volume</span>
        </div>
        
        {/* Asks (Sell Orders) - Reverse order so lowest price is at bottom */}
        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col-reverse justify-end min-h-full">
            {orderBook?.asks?.length > 0 ? (
              orderBook.asks.slice(0, 20).map((ask: any, i: number) => (
                <div key={i} className="flex justify-between py-1 cursor-pointer hover:bg-muted px-1" onClick={() => setPriceInput(ask.price)}>
                  <span className="text-red-500 font-medium">{parseFloat(ask.price).toFixed(5)}</span>
                  <span>{parseFloat(ask.quantity).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-2 italic">No sell orders</div>
            )}
          </div>
        </ScrollArea>

        {/* Current Price Divider */}
        <div className="flex flex-col items-center justify-center py-1.5 border-y bg-muted/30">
          <span className={`text-lg font-bold ${market.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${currentPrice.toFixed(5)}
          </span>
          {orderBook?.asks?.length > 0 && orderBook?.bids?.length > 0 && (
            <span className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider font-medium">
              Spread: {((Number(orderBook.asks[orderBook.asks.length - 1].price) - Number(orderBook.bids[0].price)) * 10000).toFixed(1)}
            </span>
          )}
        </div>

        {/* Bids (Buy Orders) - Normal order so highest price is at top */}
        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col min-h-full">
            {orderBook?.bids?.length > 0 ? (
              orderBook.bids.slice(0, 20).map((bid: any, i: number) => (
                <div key={i} className="flex justify-between py-1 cursor-pointer hover:bg-muted px-1" onClick={() => setPriceInput(bid.price)}>
                  <span className="text-green-500 font-medium">{parseFloat(bid.price).toFixed(5)}</span>
                  <span>{parseFloat(bid.quantity).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-2 italic">No buy orders</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  const TradingFormComponent = (
    <div className="flex flex-col h-full bg-card rounded border min-h-[400px] lg:min-h-0">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <span className="font-bold text-base">Trade {baseCurrency}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col overflow-auto">
        
        {/* BUY / SELL Toggle */}
        <div className="flex bg-muted p-1 rounded-md mb-6">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-sm transition-all ${orderSide === 'BUY' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`}
            onClick={() => setOrderSide('BUY')}
          >
            Buy
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-sm transition-all ${orderSide === 'SELL' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`}
            onClick={() => setOrderSide('SELL')}
          >
            Sell
          </button>
        </div>

        <Tabs defaultValue="MARKET" onValueChange={(val) => setOrderType(val as 'MARKET'|'PENDING')} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-10 bg-muted/50">
            <TabsTrigger value="MARKET" className="text-sm font-medium">Market Order</TabsTrigger>
            <TabsTrigger value="PENDING" className="text-sm font-medium">Pending Order</TabsTrigger>
          </TabsList>

          <form onSubmit={handleOrder} className="flex flex-col flex-1">
            <div className="space-y-5 flex-1">
              
              {/* Price Input */}
              {orderType === 'PENDING' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Type</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pendingType} onChange={(e) => setPendingType(e.target.value as any)}>
                      <option value="LIMIT">{orderSide === 'BUY' ? 'Buy Limit' : 'Sell Limit'}</option>
                      <option value="STOP">{orderSide === 'BUY' ? 'Buy Stop' : 'Sell Stop'}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</label>
                      <span className="text-xs font-medium text-muted-foreground">{currentPrice ? currentPrice.toFixed(5) : '0.00000'}</span>
                    </div>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.00001" 
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      required 
                      className="h-12 px-3 text-base font-medium"
                      placeholder="0.00000"
                    />
                  </div>
                </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</label>
                  <div className="h-12 bg-muted/50 rounded-md border flex items-center px-3 text-muted-foreground text-sm font-medium">
                    Market Execution
                  </div>
                </div>
              )}
              
              {/* Lot Size Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lot Size</label>
                </div>
                <div className="relative flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-12 w-12" onClick={() => setAmountInput((parseFloat(amountInput || '0') - 0.01).toFixed(2))}>-</Button>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required 
                    className="h-12 px-3 text-center text-base font-medium flex-1"
                    placeholder="1.00" 
                  />
                  <Button type="button" variant="outline" className="h-12 w-12" onClick={() => setAmountInput((parseFloat(amountInput || '0') + 0.01).toFixed(2))}>+</Button>
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stop Loss</label>
                  <Input type="number" step="0.00001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="h-10 text-sm" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Take Profit</label>
                  <Input type="number" step="0.00001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="h-10 text-sm" placeholder="Optional" />
                </div>
              </div>

              {/* Order Value */}
              <div className="flex justify-between items-center py-4 text-sm border-t border-muted/50 mt-4">
                <span className="text-muted-foreground font-medium">Required Margin</span>
                <span className="font-bold text-foreground">
                  {amountInput && currentPrice ? ((parseFloat(amountInput) * 100000 * currentPrice) / 100).toFixed(2) /* Mock 1:100 leverage */ : '0.00'} USD
                </span>
              </div>
            </div>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full h-12 mt-6 text-base font-bold shadow-md transition-all ${
                orderSide === 'BUY' 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {orderSide === 'BUY' ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
            </Button>
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
              
              <Panel defaultSize={25} minSize={20} maxSize={40}>
                <PanelGroup direction="vertical" autoSaveId="trading-right-col">
                  <Panel defaultSize={50} minSize={30}>
                    {OrderBookComponent}
                  </Panel>
                  <PanelResizeHandle className="h-1.5 flex flex-row items-center justify-center bg-transparent cursor-row-resize group">
                    <div className="w-8 h-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
                  </PanelResizeHandle>
                  <Panel defaultSize={50} minSize={30}>
                    {TradingFormComponent}
                  </Panel>
                </PanelGroup>
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
                    <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">Order History</TabsTrigger>
                    <TabsTrigger value="trades" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs py-1">Trade History</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-auto">
            <TabsContent value="open" className="m-0 h-full">
              {openPositionsList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No open positions</div>
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
                      <TableHead className="text-right">Swap</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openPositionsList.map((o: any) => {
                      const openPrice = parseFloat(o.price || '0');
                      const volume = parseFloat(o.quantity || '0');
                      let profit = 0;
                      if (openPrice > 0 && currentPrice > 0) {
                        profit = o.side === 'BUY' ? (currentPrice - openPrice) * volume * 100000 : (openPrice - currentPrice) * volume * 100000;
                      }
                      
                      return (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="font-medium">{o.tradingPair?.symbol}</TableCell>
                        <TableCell>#{o.id.substring(0, 8)}</TableCell>
                        <TableCell suppressHydrationWarning>{new Date(o.createdAt).toLocaleString()}</TableCell>
                        <TableCell className={o.side === 'BUY' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{o.side}</TableCell>
                        <TableCell className="text-right">{volume.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{openPrice.toFixed(5)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.stopLoss ? parseFloat(o.metadata.stopLoss).toFixed(5) : '0.00000'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{o.metadata?.takeProfit ? parseFloat(o.metadata.takeProfit).toFixed(5) : '0.00000'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">0.00</TableCell>
                        <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profit >= 0 ? '+' : ''}{profit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 hover:bg-muted" onClick={() => handleCancel(o.id)}>Close</Button>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
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

            <TabsContent value="history" className="m-0 h-full">
              {historyOrdersList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No order history</div>
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

            <TabsContent value="trades" className="m-0 h-full">
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
        <div className="flex flex-col gap-2 h-full overflow-y-auto">
          <div className="h-[300px] shrink-0">
            <MarketSelector currentSymbol={`${baseCurrency}USDT`} />
          </div>
          <div className="h-[400px] shrink-0">
            {ChartComponent}
          </div>
          <div className="h-[400px] shrink-0">
            {OrderBookComponent}
          </div>
          <div className="h-[400px] shrink-0">
            {TradingFormComponent}
          </div>
        </div>
      )}
    </div>
  );
}
