import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tradingService, MarketPair, OrderBook, CandleData, TradeOrder } from '../../services/mock/tradingService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Star,
  Search,
  RefreshCw,
  Clock,
  X,
  ChevronDown,
  BarChart2,
  Zap,
  ShieldCheck,
  Activity,
} from 'lucide-react';

type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit' | 'stop';
type MarketCategory = 'all' | 'crypto' | 'forex' | 'commodities' | 'indices';

export const TradingPage: React.FC = () => {
  const { showToast } = useToast();

  // Market state
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<MarketPair | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [recentTrades, setRecentTrades] = useState<{ price: number; amount: number; side: 'buy' | 'sell'; time: string }[]>([]);
  const [myOrders, setMyOrders] = useState<TradeOrder[]>([]);
  const [category, setCategory] = useState<MarketCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Order form state
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Order tab
  const [orderTab, setOrderTab] = useState<'open' | 'history'>('open');

  const chartRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ──────── Data Loading ────────

  const loadMarketData = useCallback(async () => {
    const [marketPairs, orders] = await Promise.all([
      tradingService.getMarketPairs(category !== 'all' ? category : undefined),
      tradingService.getOrders(),
    ]);
    setPairs(marketPairs);
    setMyOrders(orders);

    if (!selectedPair && marketPairs.length > 0) {
      setSelectedPair(marketPairs[0]);
    }
  }, [category, selectedPair]);

  const loadPairData = useCallback(async (symbol: string) => {
    const [book, candleData, trades] = await Promise.all([
      tradingService.getOrderBook(symbol),
      tradingService.getCandles(symbol),
      tradingService.getRecentTrades(symbol),
    ]);
    setOrderBook(book);
    setCandles(candleData);
    setRecentTrades(trades);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadMarketData().then(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (selectedPair) {
      loadPairData(selectedPair.symbol);
      setOrderPrice(selectedPair.price.toString());
    }
  }, [selectedPair?.symbol]);

  // Polling for live updates
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const updatedPairs = await tradingService.getMarketPairs(category !== 'all' ? category : undefined);
      setPairs(updatedPairs);

      if (selectedPair) {
        const updated = updatedPairs.find(p => p.symbol === selectedPair.symbol);
        if (updated) setSelectedPair(updated);

        const [book, trades] = await Promise.all([
          tradingService.getOrderBook(selectedPair.symbol),
          tradingService.getRecentTrades(selectedPair.symbol),
        ]);
        setOrderBook(book);
        setRecentTrades(trades);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedPair?.symbol, category]);

  // ──────── Chart Rendering ────────

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const visibleCandles = candles.slice(-60);
    const prices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const candleW = (w - 60) / visibleCandles.length;
    const padding = 40;

    const priceToY = (p: number) => padding + (1 - (p - minPrice) / priceRange) * (h - padding * 2);

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padding + (i / 6) * (h - padding * 2);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const price = maxPrice - (i / 6) * priceRange;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), w - 4, y - 4);
    }

    // Candles
    visibleCandles.forEach((candle, i) => {
      const x = 30 + i * candleW + candleW / 2;
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#34d399' : '#f43f5e';
      const opaqueColor = isGreen ? 'rgba(52, 211, 153, 0.25)' : 'rgba(244, 63, 94, 0.25)';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(candle.high));
      ctx.lineTo(x, priceToY(candle.low));
      ctx.stroke();

      // Body
      const bodyTop = priceToY(Math.max(candle.open, candle.close));
      const bodyBottom = priceToY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleW * 0.35, bodyTop, candleW * 0.7, bodyHeight);

      // Volume bars at bottom
      const maxVol = Math.max(...visibleCandles.map(c => c.volume));
      const volH = (candle.volume / maxVol) * 30;
      ctx.fillStyle = opaqueColor;
      ctx.fillRect(x - candleW * 0.35, h - volH - 4, candleW * 0.7, volH);
    });

    // Current price line
    if (selectedPair) {
      const currentY = priceToY(selectedPair.price);
      ctx.strokeStyle = '#22d3ee';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(w, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price label
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(w - 80, currentY - 10, 76, 20);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(selectedPair.price.toFixed(2), w - 42, currentY + 4);
    }
  }, [candles, selectedPair?.price]);

  // ──────── Order Submission ────────

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPair) return;

    const price = orderType === 'market' ? selectedPair.price : parseFloat(orderPrice);
    const amount = parseFloat(orderAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid order amount.');
      return;
    }
    if (orderType !== 'market' && (isNaN(price) || price <= 0)) {
      showToast('error', 'Invalid Price', 'Please enter a valid limit price.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await tradingService.placeOrder({
        symbol: selectedPair.symbol,
        side: orderSide,
        type: orderType,
        price,
        amount,
        total: +(price * amount).toFixed(2),
        status: orderType === 'market' ? 'filled' : 'open',
      });
      setMyOrders(prev => [order, ...prev]);
      setOrderAmount('');
      showToast(
        'success',
        `${orderSide.toUpperCase()} Order ${order.status === 'filled' ? 'Filled' : 'Placed'}`,
        `${amount} ${selectedPair.base} at ${formatCurrency(price, 'USD', 2, 2)}`
      );
    } catch (err: any) {
      showToast('error', 'Order Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    await tradingService.cancelOrder(orderId);
    setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
    showToast('info', 'Order Cancelled', `Order ${orderId} has been cancelled.`);
  };

  // ──────── Filter pairs ────────

  const filteredPairs = pairs.filter(p =>
    p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const orderTotal = (() => {
    const price = orderType === 'market' ? (selectedPair?.price || 0) : parseFloat(orderPrice) || 0;
    const amount = parseFloat(orderAmount) || 0;
    return price * amount;
  })();

  // ──────── Render ────────

  return (
    <div className="space-y-4 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <CandlestickChart className="w-6 h-6 text-cyan-400" />
            <span>Trading Terminal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Spot trading • Real-time orderbook • Sub-millisecond execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Markets Live
          </span>
          <button
            onClick={() => { loadMarketData(); if (selectedPair) loadPairData(selectedPair.symbol); }}
            className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-muted hover:text-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ──────── Main Trading Grid ──────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ──── Left: Market Pairs List ──── */}
        <div className="xl:col-span-2 bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '680px' }}>
          {/* Search + Category Tabs */}
          <div className="p-3 border-b border-subtle space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface-alt border border-default rounded-xl text-xs text-primary dark:text-white placeholder:text-muted outline-hidden focus:border-cyan-500/50"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(['all', 'crypto', 'forex', 'commodities', 'indices'] as MarketCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pairs List */}
          <div className="flex-1 overflow-y-auto divide-y divide-subtle">
            {filteredPairs.map(pair => (
              <button
                key={pair.symbol}
                onClick={() => setSelectedPair(pair)}
                className={`w-full p-3 text-left transition-all cursor-pointer ${
                  selectedPair?.symbol === pair.symbol
                    ? 'bg-cyan-500/8 border-l-2 border-l-cyan-400'
                    : 'hover:bg-surface-alt border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary dark:text-white">{pair.base}</span>
                    <span className="text-[10px] text-muted">/{pair.quote}</span>
                  </div>
                  {pair.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-primary dark:text-white">
                    {pair.price < 1 ? pair.price.toFixed(4) : formatNumber(pair.price, 2)}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${pair.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ──── Center: Chart + Order Book ──── */}
        <div className="xl:col-span-7 space-y-4">

          {/* Selected Pair Header */}
          {selectedPair && (
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-primary dark:text-white flex items-center gap-2">
                      {selectedPair.symbol}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedPair.changePercent >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {selectedPair.changePercent >= 0 ? '+' : ''}{selectedPair.changePercent.toFixed(2)}%
                      </span>
                    </h2>
                    <span className="text-2xl font-extrabold font-mono text-primary dark:text-white">
                      {selectedPair.price < 1 ? selectedPair.price.toFixed(4) : formatNumber(selectedPair.price, 2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-muted block">24h High</span>
                    <span className="font-mono font-bold text-emerald-400">{formatNumber(selectedPair.high24h, 2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">24h Low</span>
                    <span className="font-mono font-bold text-rose-400">{formatNumber(selectedPair.low24h, 2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">24h Volume</span>
                    <span className="font-mono font-bold text-primary dark:text-white">{formatNumber(selectedPair.volume24h, 0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Spread</span>
                    <span className="font-mono font-bold text-cyan-400">{selectedPair.spread.toFixed(selectedPair.spread < 1 ? 4 : 2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-primary dark:text-white">Price Chart</span>
                <span className="text-[10px] text-muted">15m</span>
              </div>
              <div className="flex items-center gap-1.5">
                {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => (
                  <button key={tf} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    tf === '15m'
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-muted hover:text-primary dark:hover:text-white'
                  }`}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-2" style={{ height: '340px' }}>
              <canvas
                ref={chartRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Order Book + Recent Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Book */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-subtle flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-white">Order Book</span>
                {orderBook && (
                  <span className="text-[10px] text-muted font-mono">Spread: {orderBook.spread.toFixed(2)}</span>
                )}
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {/* Asks (reversed) */}
                <div className="divide-y divide-subtle/50">
                  {orderBook?.asks.slice(0, 8).reverse().map((entry, i) => (
                    <div key={`ask-${i}`} className="relative px-3 py-1 flex items-center justify-between text-[11px] font-mono">
                      <div className="absolute left-0 top-0 bottom-0 bg-rose-500/8" style={{ width: `${entry.percent}%` }} />
                      <span className="relative text-rose-400 font-bold">{entry.price.toFixed(2)}</span>
                      <span className="relative text-muted">{entry.amount.toFixed(4)}</span>
                      <span className="relative text-muted">{entry.total.toFixed(4)}</span>
                    </div>
                  ))}
                </div>

                {/* Spread indicator */}
                {selectedPair && (
                  <div className="px-3 py-2 bg-surface-alt border-y border-subtle flex items-center justify-between">
                    <span className={`text-sm font-extrabold font-mono ${
                      selectedPair.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {selectedPair.price < 1 ? selectedPair.price.toFixed(4) : formatNumber(selectedPair.price, 2)}
                    </span>
                    <span className="text-[10px] text-muted">
                      ≈ {formatCurrency(selectedPair.price, 'USD')}
                    </span>
                  </div>
                )}

                {/* Bids */}
                <div className="divide-y divide-subtle/50">
                  {orderBook?.bids.slice(0, 8).map((entry, i) => (
                    <div key={`bid-${i}`} className="relative px-3 py-1 flex items-center justify-between text-[11px] font-mono">
                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/8" style={{ width: `${entry.percent}%` }} />
                      <span className="relative text-emerald-400 font-bold">{entry.price.toFixed(2)}</span>
                      <span className="relative text-muted">{entry.amount.toFixed(4)}</span>
                      <span className="relative text-muted">{entry.total.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-subtle flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-white">Recent Trades</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-subtle">
                  <span>Price</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Time</span>
                </div>
                {recentTrades.map((trade, i) => (
                  <div key={i} className="grid grid-cols-3 px-3 py-1 text-[11px] font-mono hover:bg-surface-alt transition-colors">
                    <span className={trade.side === 'buy' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {trade.price.toFixed(2)}
                    </span>
                    <span className="text-right text-muted">{trade.amount.toFixed(4)}</span>
                    <span className="text-right text-muted">
                      {new Date(trade.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ──── Right: Order Form + My Orders ──── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Order Form */}
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-primary dark:text-white">Place Order</span>
              </div>
            </div>

            {/* Buy / Sell Toggle */}
            <div className="flex p-3 pb-0 gap-2">
              <button
                onClick={() => setOrderSide('buy')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderSide === 'buy'
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : 'bg-surface-alt text-muted border border-default hover:text-emerald-400'
                }`}
              >
                Buy / Long
              </button>
              <button
                onClick={() => setOrderSide('sell')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderSide === 'sell'
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'bg-surface-alt text-muted border border-default hover:text-rose-400'
                }`}
              >
                Sell / Short
              </button>
            </div>

            {/* Order Type */}
            <div className="px-3 pt-3">
              <div className="flex gap-1 bg-surface-alt rounded-xl p-1 border border-default">
                {(['limit', 'market', 'stop'] as OrderType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      orderType === t
                        ? 'bg-surface text-primary dark:text-white border border-default shadow-sm'
                        : 'text-muted hover:text-primary dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handlePlaceOrder} className="p-3 space-y-3">
              {/* Price */}
              {orderType !== 'market' && (
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {orderType === 'stop' ? 'Stop Price' : 'Price'} ({selectedPair?.quote || 'USDT'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono font-bold text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                    placeholder="0.00"
                  />
                </div>
              )}

              {orderType === 'market' && (
                <div className="p-2.5 bg-surface-alt rounded-xl border border-default">
                  <span className="text-[10px] text-muted block">Market Price</span>
                  <span className="text-sm font-mono font-bold text-primary dark:text-white">
                    {selectedPair?.price ? (selectedPair.price < 1 ? selectedPair.price.toFixed(4) : formatNumber(selectedPair.price, 2)) : '0.00'}
                  </span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Amount ({selectedPair?.base || 'BTC'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono font-bold text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  placeholder="0.00"
                />
                {/* Quick Percent Buttons */}
                <div className="flex gap-1 mt-1.5">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setOrderAmount(((pct / 100) * 1).toFixed(4))}
                      className="flex-1 py-1 rounded-md text-[10px] font-bold text-muted hover:text-cyan-400 bg-surface-alt border border-default hover:border-cyan-500/30 transition-all cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-2.5 bg-surface-alt rounded-xl border border-default flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted">Total</span>
                <span className="text-sm font-mono font-bold text-primary dark:text-white">
                  {formatCurrency(orderTotal, 'USD', 2, 2)}
                </span>
              </div>

              {/* Fee Estimate */}
              <div className="flex items-center justify-between text-[10px] text-muted px-1">
                <span>Est. Fee (0.1%)</span>
                <span className="font-mono">{formatCurrency(orderTotal * 0.001, 'USD')}</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-98 ${
                  orderSide === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${selectedPair?.base || 'BTC'}`
                }
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-muted">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Secured by MPC & institutional custody</span>
              </div>
            </form>
          </div>

          {/* My Orders */}
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-subtle">
              <button
                onClick={() => setOrderTab('open')}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-all cursor-pointer ${
                  orderTab === 'open'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-muted hover:text-primary dark:hover:text-white border-b-2 border-transparent'
                }`}
              >
                Open Orders ({myOrders.filter(o => o.status === 'open').length})
              </button>
              <button
                onClick={() => setOrderTab('history')}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-all cursor-pointer ${
                  orderTab === 'history'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-muted hover:text-primary dark:hover:text-white border-b-2 border-transparent'
                }`}
              >
                Order History
              </button>
            </div>

            <div className="max-h-[260px] overflow-y-auto divide-y divide-subtle">
              {(orderTab === 'open'
                ? myOrders.filter(o => o.status === 'open')
                : myOrders.filter(o => o.status !== 'open')
              ).length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  {orderTab === 'open' ? 'No open orders' : 'No order history'}
                </div>
              ) : (
                (orderTab === 'open'
                  ? myOrders.filter(o => o.status === 'open')
                  : myOrders.filter(o => o.status !== 'open')
                ).map(order => (
                  <div key={order.id} className="p-3 hover:bg-surface-alt transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          order.side === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {order.side.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-primary dark:text-white">{order.symbol}</span>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">
                        {order.type} • {formatNumber(order.amount, 4)} @ {formatCurrency(order.price, 'USD')}
                      </span>
                      {order.status === 'open' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5 font-mono">
                      Total: {formatCurrency(order.total, 'USD')}
                      {order.fee > 0 && ` • Fee: ${formatCurrency(order.fee, 'USD')}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
