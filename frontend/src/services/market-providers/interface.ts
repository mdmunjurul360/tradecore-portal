import { MarketData } from '../market.service';

export interface IMarketProvider {
  getLiveMarkets(symbols: string[]): Promise<MarketData[]>;
  getSingleMarket(symbol: string): Promise<MarketData | null>;
  getOrderBook(symbol: string, limit?: number): Promise<{ bids: any[], asks: any[] }>;
  getRecentTrades(symbol: string, limit?: number): Promise<any[]>;
  getKlines(symbol: string, interval: string, limit?: number): Promise<any[]>;
}
