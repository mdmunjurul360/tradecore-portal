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

function generateMockKlines(basePrice: number, limit: number) {
  const klines = [];
  let currentPrice = basePrice;
  let time = Date.now() - limit * 15 * 60 * 1000; // 15m intervals

  for (let i = 0; i < limit; i++) {
    const volatility = basePrice * 0.001;
    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.random() * 1000 + 100;

    klines.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
    time += 15 * 60 * 1000;
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
    return generateMockKlines(basePrice, limit);
  }

  private generateSingleMarket(symbol: string): MarketData | null {
    const basePrice = MOCK_BASE_PRICES[symbol];
    if (!basePrice) return null;

    const change24h = (Math.random() - 0.5) * 2; // -1% to 1%
    const currentPrice = basePrice * (1 + change24h / 100);
    const high24h = Math.max(basePrice, currentPrice) * (1 + Math.random() * 0.005);
    const low24h = Math.min(basePrice, currentPrice) * (1 - Math.random() * 0.005);
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
