import { IMarketProvider } from './market-providers/interface';
import { BinanceProvider } from './market-providers/binance.provider';
import { MockForexProvider } from './market-providers/mock-forex.provider';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export const SUPPORTED_COINS = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', base: 'EUR', type: 'Forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', base: 'GBP', type: 'Forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', base: 'JPY', type: 'Forex' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', base: 'CHF', type: 'Forex' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', base: 'CAD', type: 'Forex' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', base: 'AUD', type: 'Forex' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', base: 'NZD', type: 'Forex' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', base: 'EUR', type: 'Forex' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', base: 'EUR', type: 'Forex' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', base: 'GBP', type: 'Forex' },
  { symbol: 'XAUUSD', name: 'Gold', base: 'XAU', type: 'Forex' },
  { symbol: 'XAGUSD', name: 'Silver', base: 'XAG', type: 'Forex' },

  // Indices
  { symbol: 'US30', name: 'Wall Street 30', base: 'US30', type: 'Forex' },
  { symbol: 'NAS100', name: 'US Tech 100', base: 'NAS100', type: 'Forex' },
  { symbol: 'SPX500', name: 'US 500', base: 'SPX500', type: 'Forex' },
  { symbol: 'GER40', name: 'Germany 40', base: 'GER40', type: 'Forex' },
  { symbol: 'UK100', name: 'UK 100', base: 'UK100', type: 'Forex' },

  // Commodities
  { symbol: 'UKOIL', name: 'Brent Crude Oil', base: 'UKOIL', type: 'Forex' },
  { symbol: 'USOIL', name: 'WTI Crude Oil', base: 'USOIL', type: 'Forex' },
  { symbol: 'NGAS', name: 'Natural Gas', base: 'NGAS', type: 'Forex' },

  // Crypto
  { symbol: 'BTCUSD', name: 'Bitcoin', base: 'BTC', type: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', base: 'ETH', type: 'Crypto' },
  { symbol: 'BNBUSD', name: 'Binance Coin', base: 'BNB', type: 'Crypto' },
  { symbol: 'SOLUSD', name: 'Solana', base: 'SOL', type: 'Crypto' },
  { symbol: 'ADAUSD', name: 'Cardano', base: 'ADA', type: 'Crypto' },
];

const binanceProvider = new BinanceProvider();
const mockForexProvider = new MockForexProvider();

const getProvider = (symbol: string): IMarketProvider => {
  return mockForexProvider;
};

export const marketService = {
  getLiveMarkets: async (): Promise<MarketData[]> => {
    try {
      const allSymbols = SUPPORTED_COINS.map(c => c.symbol);
      const allData = await mockForexProvider.getLiveMarkets(allSymbols);
      return allData;
    } catch (error) {
      console.error('Failed to fetch live markets:', error);
      return [];
    }
  },

  getSingleMarket: async (symbol: string): Promise<MarketData | null> => {
    return getProvider(symbol).getSingleMarket(symbol);
  },

  getOrderBook: async (symbol: string, limit: number = 100) => {
    return getProvider(symbol).getOrderBook(symbol, limit);
  },

  getRecentTrades: async (symbol: string, limit: number = 50) => {
    return getProvider(symbol).getRecentTrades(symbol, limit);
  },

  getKlines: async (symbol: string, interval: string = '15m', limit: number = 100) => {
    return getProvider(symbol).getKlines(symbol, interval, limit);
  }
};
