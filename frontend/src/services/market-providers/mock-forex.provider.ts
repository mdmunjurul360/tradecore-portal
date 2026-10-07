import { IMarketProvider } from './interface';
import { MarketData, SUPPORTED_COINS } from '../market.service';

const MOCK_BASE_PRICES: Record<string, number> = {
  'XAUUSD': 2024.50,
  'XAGUSD': 24.15,
  'EURUSD': 1.0850,
  'GBPUSD': 1.2640,
  'USDJPY': 150.20,
  'AUDUSD': 0.6540,
  'USDCHF': 0.8810,
  'USDCAD': 1.3520,
  'NZDUSD': 0.6120,
  'EURGBP': 0.8540,
  'EURJPY': 161.50,
  'GBPJPY': 190.10,
  'US30': 39069.00,
  'NAS100': 17950.00,
  'SPX500': 5088.00,
  'GER40': 17400.00,
  'UK100': 7900.00,
  'UKOIL': 82.50,
  'USOIL': 78.20,
  'NGAS': 1.85,
  'BTCUSD': 60000.00,
  'ETHUSD': 3000.00,
  'BNBUSD': 590.00,
  'SOLUSD': 150.00,
  'ADAUSD': 0.65,
};

function parseInterval(interval: string): number {
  const value = parseInt(interval.slice(0, -1));
  const unit = interval.slice(-1).toLowerCase();
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

function xoshiro128ss(a: number, b: number, c: number, d: number) {
  return function() {
    let t = b << 9;
    let r = a * 5; r = (r << 7 | r >>> 25) * 9;
    c ^= a; d ^= b;
    b ^= c; a ^= d; c ^= t;
    d = d << 11 | d >>> 21;
    return (r >>> 0) / 4294967296;
  }
}

function generateMockKlines(symbol: string, basePrice: number, interval: string, limit: number) {
  const klines = [];
  const intervalMs = parseInterval(interval);
  
  const currentIntervalTime = Math.floor(Date.now() / intervalMs) * intervalMs;
  let time = currentIntervalTime - ((limit - 1) * intervalMs);

  for (let i = 0; i < limit; i++) {
    const seed = time + basePrice + intervalMs;
    // Basic hash of seed + symbol string for deterministic RNG
    let hash = 0;
    for (let j = 0; j < symbol.length; j++) hash = Math.imul(31, hash) + symbol.charCodeAt(j) | 0;
    const rng = xoshiro128ss(seed ^ hash, seed ^ (hash << 1), seed ^ (hash >> 1), seed);
    
    const volatility = basePrice * 0.0005 * Math.max(1, intervalMs / (60 * 1000));
    
    // Deterministic price drift based on previous candles wasn't strictly possible without a full history simulation, 
    // but we can anchor the open price to the deterministic "currentPrice" walk if we generate from epoch, 
    // or we just anchor it to basePrice + deterministic offset.
    // For simplicity, anchor to basePrice.
    const openOffset = (rng() - 0.5) * volatility * 2;
    const open = basePrice + openOffset;
    const close = open + (rng() - 0.5) * volatility;
    const high = Math.max(open, close) + rng() * volatility;
    const low = Math.min(open, close) - rng() * volatility;
    const volume = rng() * 1000 + 100;

    klines.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });

    time += intervalMs;
  }
  return klines;
}

function generateMockOrderBook(basePrice: number) {
  const bids = [];
  const asks = [];
  const spread = basePrice * 0.0001;

  for (let i = 1; i <= 20; i++) {
    bids.push({
      price: (basePrice - (spread * i)).toFixed(5),
      quantity: (Math.random() * 10 + 0.1).toFixed(4)
    });
    asks.push({
      price: (basePrice + (spread * i)).toFixed(5),
      quantity: (Math.random() * 10 + 0.1).toFixed(4)
    });
  }

  return { bids, asks };
}

export class MockForexProvider implements IMarketProvider {
  private lastPrices: Record<string, number> = {};

  async getLiveMarkets(symbols: string[]): Promise<MarketData[]> {
    return symbols.map(symbol => this.generateSingleMarket(symbol)).filter(Boolean) as MarketData[];
  }

  async getSingleMarket(symbol: string): Promise<MarketData | null> {
    const pair = symbol.toUpperCase();
    return this.generateSingleMarket(pair);
  }

  async getOrderBook(symbol: string, limit: number = 20) {
    const pair = symbol.toUpperCase();
    const basePrice = MOCK_BASE_PRICES[pair] || 100;
    return generateMockOrderBook(basePrice);
  }

  async getRecentTrades(symbol: string, limit: number = 50) {
    const pair = symbol.toUpperCase();
    const basePrice = MOCK_BASE_PRICES[pair] || 100;
    const trades = [];
    let time = Date.now();
    for(let i = 0; i < limit; i++) {
      trades.push({
        id: Math.floor(Math.random() * 1000000),
        price: basePrice + (Math.random() - 0.5) * (basePrice * 0.0005),
        quantity: Math.random() * 5 + 0.01,
        time: time - (i * 5000),
        isBuyerMaker: Math.random() > 0.5
      });
    }
    return trades.reverse();
  }

  async getKlines(symbol: string, interval: string = '15m', limit: number = 100) {
    const pair = symbol.toUpperCase();
    const basePrice = MOCK_BASE_PRICES[pair] || 100;
    return generateMockKlines(symbol, basePrice, interval, limit);
  }

  private generateSingleMarket(symbol: string): MarketData | null {
    const basePrice = MOCK_BASE_PRICES[symbol];
    if (!basePrice) return null;

    let currentPrice = this.lastPrices[symbol];
    if (!currentPrice) {
      currentPrice = basePrice;
    } else {
      // Very small random walk (max 0.05% per tick)
      const walk = (Math.random() - 0.5) * (basePrice * 0.001);
      currentPrice = currentPrice + walk;
    }
    this.lastPrices[symbol] = currentPrice;

    const change24h = ((currentPrice - basePrice) / basePrice) * 100;
    const high24h = Math.max(basePrice, currentPrice) * (1 + Math.random() * 0.002);
    const low24h = Math.min(basePrice, currentPrice) * (1 - Math.random() * 0.002);
    const volume24h = Math.random() * 1000000 + 50000;

    const coinDef = SUPPORTED_COINS.find(c => c.symbol === symbol);

    return {
      symbol: coinDef?.base || symbol,
      name: coinDef?.name || symbol,
      price: currentPrice,
      change24h,
      volume24h,
      high24h,
      low24h
    };
  }
}
