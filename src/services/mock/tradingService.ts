/**
 * Trading Service — Live Market Data, Order Book, and Trade Execution
 * Follows the existing mock service pattern using apiClient.mockDelay
 */

import { apiClient } from '../api/client';

export interface MarketPair {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change24h: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
  bidPrice: number;
  askPrice: number;
  spread: number;
  lastUpdated: string;
  category: 'forex' | 'crypto' | 'commodities' | 'indices';
  isFavorite: boolean;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  percent: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  price: number;
  amount: number;
  total: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  filledAmount: number;
  filledPercent: number;
  fee: number;
  createdAt: string;
  filledAt?: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const MARKET_PAIRS: MarketPair[] = [
  {
    symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT',
    price: 68420.50, change24h: 1845.30, changePercent: 2.77,
    high24h: 69100.00, low24h: 66200.00, volume24h: 42518.75,
    volumeQuote24h: 2908482750, bidPrice: 68418.20, askPrice: 68422.80,
    spread: 4.60, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: true,
  },
  {
    symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT',
    price: 3520.40, change24h: -41.20, changePercent: -1.16,
    high24h: 3590.00, low24h: 3480.00, volume24h: 285400.50,
    volumeQuote24h: 1004609760, bidPrice: 3520.10, askPrice: 3520.70,
    spread: 0.60, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: true,
  },
  {
    symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT',
    price: 182.40, change24h: 9.65, changePercent: 5.59,
    high24h: 185.20, low24h: 171.80, volume24h: 1842000,
    volumeQuote24h: 335884800, bidPrice: 182.35, askPrice: 182.45,
    spread: 0.10, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: false,
  },
  {
    symbol: 'BNB/USDT', base: 'BNB', quote: 'USDT',
    price: 612.80, change24h: 8.40, changePercent: 1.39,
    high24h: 618.50, low24h: 601.20, volume24h: 520400,
    volumeQuote24h: 318901120, bidPrice: 612.70, askPrice: 612.90,
    spread: 0.20, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: false,
  },
  {
    symbol: 'XRP/USDT', base: 'XRP', quote: 'USDT',
    price: 0.6248, change24h: 0.0185, changePercent: 3.05,
    high24h: 0.6380, low24h: 0.6020, volume24h: 185000000,
    volumeQuote24h: 115588000, bidPrice: 0.6247, askPrice: 0.6249,
    spread: 0.0002, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: false,
  },
  {
    symbol: 'DOGE/USDT', base: 'DOGE', quote: 'USDT',
    price: 0.1642, change24h: 0.0098, changePercent: 6.35,
    high24h: 0.1680, low24h: 0.1530, volume24h: 3200000000,
    volumeQuote24h: 525440000, bidPrice: 0.1641, askPrice: 0.1643,
    spread: 0.0002, lastUpdated: new Date().toISOString(),
    category: 'crypto', isFavorite: false,
  },
  {
    symbol: 'EUR/USD', base: 'EUR', quote: 'USD',
    price: 1.08425, change24h: 0.00185, changePercent: 0.17,
    high24h: 1.08620, low24h: 1.08100, volume24h: 850000,
    volumeQuote24h: 921612500, bidPrice: 1.08423, askPrice: 1.08427,
    spread: 0.00004, lastUpdated: new Date().toISOString(),
    category: 'forex', isFavorite: true,
  },
  {
    symbol: 'GBP/USD', base: 'GBP', quote: 'USD',
    price: 1.26840, change24h: -0.00320, changePercent: -0.25,
    high24h: 1.27200, low24h: 1.26500, volume24h: 420000,
    volumeQuote24h: 532728000, bidPrice: 1.26838, askPrice: 1.26842,
    spread: 0.00004, lastUpdated: new Date().toISOString(),
    category: 'forex', isFavorite: false,
  },
  {
    symbol: 'XAU/USD', base: 'XAU', quote: 'USD',
    price: 2650.40, change24h: 18.60, changePercent: 0.71,
    high24h: 2668.00, low24h: 2628.00, volume24h: 182500,
    volumeQuote24h: 483698000, bidPrice: 2650.20, askPrice: 2650.60,
    spread: 0.40, lastUpdated: new Date().toISOString(),
    category: 'commodities', isFavorite: true,
  },
  {
    symbol: 'US30', base: 'US30', quote: 'USD',
    price: 42180.50, change24h: 285.30, changePercent: 0.68,
    high24h: 42350.00, low24h: 41800.00, volume24h: 95000,
    volumeQuote24h: 4007147500, bidPrice: 42179.00, askPrice: 42182.00,
    spread: 3.00, lastUpdated: new Date().toISOString(),
    category: 'indices', isFavorite: false,
  },
];

function generateOrderBook(basePrice: number): OrderBook {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < 12; i++) {
    const bidPrice = basePrice - (i + 1) * (basePrice * 0.0002);
    const bidAmount = +(Math.random() * 5 + 0.5).toFixed(4);
    bidTotal += bidAmount;
    bids.push({ price: +bidPrice.toFixed(2), amount: bidAmount, total: +bidTotal.toFixed(4), percent: 0 });

    const askPrice = basePrice + (i + 1) * (basePrice * 0.0002);
    const askAmount = +(Math.random() * 5 + 0.5).toFixed(4);
    askTotal += askAmount;
    asks.push({ price: +askPrice.toFixed(2), amount: askAmount, total: +askTotal.toFixed(4), percent: 0 });
  }

  const maxBid = bids[bids.length - 1].total;
  const maxAsk = asks[asks.length - 1].total;
  bids.forEach(b => b.percent = (b.total / maxBid) * 100);
  asks.forEach(a => a.percent = (a.total / maxAsk) * 100);

  const spread = asks[0].price - bids[0].price;
  const spreadPercent = (spread / basePrice) * 100;

  return { bids, asks, spread: +spread.toFixed(2), spreadPercent: +spreadPercent.toFixed(4) };
}

function generateCandles(basePrice: number, count: number = 96): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.95;
  const now = Date.now();

  for (let i = count; i > 0; i--) {
    const time = now - i * 900000; // 15-min candles
    const open = price;
    const change = (Math.random() - 0.48) * basePrice * 0.008;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.003;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.003;
    const volume = Math.random() * 100 + 10;

    candles.push({
      time: Math.floor(time / 1000),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: +volume.toFixed(2),
    });

    price = close;
  }

  return candles;
}

const INITIAL_ORDERS: TradeOrder[] = [
  {
    id: 'ord-001', symbol: 'BTC/USDT', side: 'buy', type: 'limit',
    price: 67500.00, amount: 0.15, total: 10125.00, status: 'open',
    filledAmount: 0, filledPercent: 0, fee: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ord-002', symbol: 'ETH/USDT', side: 'sell', type: 'market',
    price: 3535.20, amount: 2.5, total: 8838.00, status: 'filled',
    filledAmount: 2.5, filledPercent: 100, fee: 8.84,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    filledAt: new Date(Date.now() - 7180000).toISOString(),
  },
  {
    id: 'ord-003', symbol: 'SOL/USDT', side: 'buy', type: 'market',
    price: 178.50, amount: 25, total: 4462.50, status: 'filled',
    filledAmount: 25, filledPercent: 100, fee: 4.46,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    filledAt: new Date(Date.now() - 86380000).toISOString(),
  },
  {
    id: 'ord-004', symbol: 'BTC/USDT', side: 'sell', type: 'limit',
    price: 72000.00, amount: 0.08, total: 5760.00, status: 'open',
    filledAmount: 0, filledPercent: 0, fee: 0,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'ord-005', symbol: 'XAU/USD', side: 'buy', type: 'limit',
    price: 2620.00, amount: 1, total: 2620.00, status: 'cancelled',
    filledAmount: 0, filledPercent: 0, fee: 0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];


class TradingService {
  private pairs: MarketPair[] = [...MARKET_PAIRS];
  private orders: TradeOrder[] = [...INITIAL_ORDERS];

  public async getMarketPairs(category?: string): Promise<MarketPair[]> {
    // Simulate small price movements
    this.pairs = this.pairs.map(p => {
      const drift = (Math.random() - 0.49) * p.price * 0.001;
      const newPrice = +(p.price + drift).toFixed(p.price < 1 ? 4 : 2);
      return {
        ...p,
        price: newPrice,
        bidPrice: +(newPrice - p.spread / 2).toFixed(p.price < 1 ? 4 : 2),
        askPrice: +(newPrice + p.spread / 2).toFixed(p.price < 1 ? 4 : 2),
        lastUpdated: new Date().toISOString(),
      };
    });

    const filtered = category && category !== 'all'
      ? this.pairs.filter(p => p.category === category)
      : this.pairs;

    const res = await apiClient.mockDelay(filtered, 80);
    return res.data;
  }

  public async getOrderBook(symbol: string): Promise<OrderBook> {
    const pair = this.pairs.find(p => p.symbol === symbol);
    const book = generateOrderBook(pair?.price || 68420);
    const res = await apiClient.mockDelay(book, 50);
    return res.data;
  }

  public async getCandles(symbol: string): Promise<CandleData[]> {
    const pair = this.pairs.find(p => p.symbol === symbol);
    const candles = generateCandles(pair?.price || 68420);
    const res = await apiClient.mockDelay(candles, 100);
    return res.data;
  }

  public async placeOrder(order: Omit<TradeOrder, 'id' | 'createdAt' | 'filledAmount' | 'filledPercent' | 'fee'>): Promise<TradeOrder> {
    const newOrder: TradeOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      filledAmount: order.type === 'market' ? order.amount : 0,
      filledPercent: order.type === 'market' ? 100 : 0,
      fee: order.type === 'market' ? +(order.total * 0.001).toFixed(2) : 0,
      status: order.type === 'market' ? 'filled' : 'open',
      createdAt: new Date().toISOString(),
      filledAt: order.type === 'market' ? new Date().toISOString() : undefined,
    };

    this.orders.unshift(newOrder);
    const res = await apiClient.mockDelay(newOrder, 200);
    return res.data;
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'open') {
      order.status = 'cancelled';
    }
    const res = await apiClient.mockDelay(true, 150);
    return res.data;
  }

  public async getOrders(status?: string): Promise<TradeOrder[]> {
    const filtered = status
      ? this.orders.filter(o => o.status === status)
      : this.orders;
    const res = await apiClient.mockDelay(filtered, 100);
    return res.data;
  }

  public async getRecentTrades(symbol: string): Promise<{ price: number; amount: number; side: 'buy' | 'sell'; time: string }[]> {
    const pair = this.pairs.find(p => p.symbol === symbol);
    const basePrice = pair?.price || 68420;
    const trades = Array.from({ length: 20 }, (_, i) => ({
      price: +(basePrice + (Math.random() - 0.5) * basePrice * 0.002).toFixed(2),
      amount: +(Math.random() * 3 + 0.01).toFixed(4),
      side: (Math.random() > 0.48 ? 'buy' : 'sell') as 'buy' | 'sell',
      time: new Date(Date.now() - i * 5000).toISOString(),
    }));
    const res = await apiClient.mockDelay(trades, 60);
    return res.data;
  }
}

export const tradingService = new TradingService();
