import { IMarketProvider } from './interface';
import { MarketData, SUPPORTED_COINS } from '../market.service';
import axios from 'axios';

const cache = new Map<string, { data: unknown; expiry: number }>();

const getWithCache = async (url: string, ttl: number = 5000) => {
  const cached = cache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  const response = await axios.get(url);
  cache.set(url, { data: response.data, expiry: Date.now() + ttl });
  return response.data;
};

export class BinanceProvider implements IMarketProvider {
  async getLiveMarkets(symbols: string[]): Promise<MarketData[]> {
    try {
      const symbolsParam = JSON.stringify(symbols);
      const data = await getWithCache(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`, 10000);
      
      return data.map((item: any) => {
        const coinDef = SUPPORTED_COINS.find(c => c.symbol === item.symbol);
        return {
          symbol: coinDef?.base || item.symbol.replace('USDT', ''),
          name: coinDef?.name || item.symbol,
          price: parseFloat(item.lastPrice),
          change24h: parseFloat(item.priceChangePercent),
          volume24h: parseFloat(item.quoteVolume),
          high24h: parseFloat(item.highPrice),
          low24h: parseFloat(item.lowPrice),
        };
      });
    } catch (error) {
      console.error('Failed to fetch live markets from Binance:', error);
      return [];
    }
  }

  async getSingleMarket(symbol: string): Promise<MarketData | null> {
    try {
      // Allow passing just the base currency (e.g. BTC) or the full pair
      const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`.toUpperCase();
      const data = await getWithCache(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, 5000);
      const coinDef = SUPPORTED_COINS.find(c => c.symbol === pair);
      return {
        symbol: coinDef?.base || symbol.toUpperCase(),
        name: coinDef?.name || symbol.toUpperCase(),
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.quoteVolume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
      };
    } catch (error) {
      console.error(`Failed to fetch market from Binance for ${symbol}:`, error);
      return null;
    }
  }

  async getOrderBook(symbol: string, limit: number = 100) {
    try {
      const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`.toUpperCase();
      const data = await getWithCache(`https://api.binance.com/api/v3/depth?symbol=${pair}&limit=${limit}`, 2000);
      return data;
    } catch (error) {
      console.error(`Failed to fetch order book from Binance for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  }

  async getRecentTrades(symbol: string, limit: number = 50) {
    try {
      const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`.toUpperCase();
      const data = await getWithCache(`https://api.binance.com/api/v3/trades?symbol=${pair}&limit=${limit}`, 2000);
      return data.map((t: any) => ({
        id: t.id,
        price: parseFloat(t.price),
        quantity: parseFloat(t.qty),
        time: t.time,
        isBuyerMaker: t.isBuyerMaker
      })).reverse();
    } catch (error) {
      console.error(`Failed to fetch recent trades from Binance for ${symbol}:`, error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string = '15m', limit: number = 100) {
    try {
      const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`.toUpperCase();
      const data = await getWithCache(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, 60000);
      return data.map((k: any) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (error) {
      console.error(`Failed to fetch klines from Binance for ${symbol}:`, error);
      return [];
    }
  }
}
