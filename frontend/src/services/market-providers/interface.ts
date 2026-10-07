import { MarketData } from '../market.service';

export interface IMarketProvider {
  getLiveMarkets(symbols: string[]): Promise<MarketData[]>;
  getSingleMarket(symbol: string): Promise<MarketData | null>;
  getOrderBook(symbol: string, limit?: number): Promise<{ bids: unknown[], asks: unknown[] }>;
  getRecentTrades(symbol: string, limit?: number): Promise<unknown[]>;
  getKlines(symbol: string, interval: string, limit?: number): Promise<unknown[]>;
}
