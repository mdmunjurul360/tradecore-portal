import { EconomicEvent, MarketNewsItem } from '../../types';
import { apiClient } from '../api/client';

export interface TechnicalSentiment {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sentiment: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  bullishPercent: number;
  rsi: number;
  macd: string;
  support: number;
  resistance: number;
}

const INITIAL_EVENTS: EconomicEvent[] = [
  {
    id: 'eco-1',
    time: '12:30 GMT',
    date: '2026-08-16',
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    event: 'Core CPI (MoM) (Jul)',
    impact: 'high',
    actual: '0.2%',
    forecast: '0.2%',
    previous: '0.1%',
  },
  {
    id: 'eco-2',
    time: '12:30 GMT',
    date: '2026-08-16',
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    event: 'Initial Jobless Claims',
    impact: 'medium',
    actual: '227K',
    forecast: '235K',
    previous: '233K',
  },
  {
    id: 'eco-3',
    time: '14:00 GMT',
    date: '2026-08-16',
    country: 'Euro Zone',
    countryCode: 'EU',
    currency: 'EUR',
    event: 'ECB Monetary Policy Statement',
    impact: 'high',
    actual: '3.75%',
    forecast: '3.75%',
    previous: '3.75%',
  },
  {
    id: 'eco-4',
    time: '15:30 GMT',
    date: '2026-08-16',
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    event: 'EIA Crude Oil Stocks Change',
    impact: 'medium',
    actual: '-1.4M',
    forecast: '-2.1M',
    previous: '-3.7M',
  },
  {
    id: 'eco-5',
    time: '01:30 GMT',
    date: '2026-08-17',
    country: 'Japan',
    countryCode: 'JP',
    currency: 'JPY',
    event: 'BOJ Core CPI (YoY)',
    impact: 'high',
    forecast: '2.8%',
    previous: '2.5%',
  },
  {
    id: 'eco-6',
    time: '07:00 GMT',
    date: '2026-08-17',
    country: 'United Kingdom',
    countryCode: 'GB',
    currency: 'GBP',
    event: 'Retail Sales (MoM) (Jul)',
    impact: 'medium',
    forecast: '0.5%',
    previous: '-1.2%',
  }
];

const INITIAL_NEWS: MarketNewsItem[] = [
  {
    id: 'news-1',
    title: 'Gold Breaks $2,430 Resistance on Heightened Geopolitical Safe-Haven Inflows',
    summary: 'Spot Gold (XAUUSD) surged past key technical barrier of $2,430/oz as global central bank reserves and geopolitical risk premiums elevate demand.',
    source: 'TradeCore Global Macro Desk',
    category: 'Commodities',
    publishedAt: '2026-08-16T11:45:00Z',
    impact: 'bullish',
    symbol: 'XAUUSD',
    readTime: '3 min read',
  },
  {
    id: 'news-2',
    title: 'Federal Reserve Signals Data-Dependent Path Ahead of Jackson Hole Symposium',
    summary: 'US dollar consolidated near 104.20 on the DXY index as investors position for updated forward guidance regarding autumn interest rate cut probabilities.',
    source: 'Financial Times / Institutional Wire',
    category: 'Central Banks',
    publishedAt: '2026-08-16T10:15:00Z',
    impact: 'neutral',
    symbol: 'DXY',
    readTime: '4 min read',
  },
  {
    id: 'news-3',
    title: 'EUR/USD Tests Key 1.0850 Trendline Support Following ECB Press Conference',
    summary: 'The Euro remains rangebound against the Greenback as manufacturing output indices across Germany and France reflect gradual stabilization.',
    source: 'Reuters Forex Wire',
    category: 'Forex',
    publishedAt: '2026-08-16T09:00:00Z',
    impact: 'bearish',
    symbol: 'EURUSD',
    readTime: '2 min read',
  },
  {
    id: 'news-4',
    title: 'Bitcoin Consolidates Around $68,400 as Institutional ETF Inflows Rebound',
    summary: 'Digital asset treasuries continue accumulation with net positive weekly ETF inflows exceeding $420M across spot Bitcoin products.',
    source: 'CoinDesk Pro',
    category: 'Crypto',
    publishedAt: '2026-08-16T07:30:00Z',
    impact: 'bullish',
    symbol: 'BTCUSD',
    readTime: '3 min read',
  }
];

const INITIAL_SENTIMENTS: TechnicalSentiment[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold vs US Dollar',
    price: 2431.20,
    change24h: 0.85,
    sentiment: 'Strong Buy',
    bullishPercent: 78,
    rsi: 64.2,
    macd: 'Bullish Crossover',
    support: 2415.0,
    resistance: 2450.0,
  },
  {
    symbol: 'EURUSD',
    name: 'Euro vs US Dollar',
    price: 1.08415,
    change24h: 0.12,
    sentiment: 'Neutral',
    bullishPercent: 49,
    rsi: 51.0,
    macd: 'Neutral Convergence',
    support: 1.0780,
    resistance: 1.0890,
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound vs US Dollar',
    price: 1.29520,
    change24h: -0.24,
    sentiment: 'Sell',
    bullishPercent: 38,
    rsi: 42.5,
    macd: 'Bearish Divergence',
    support: 1.2880,
    resistance: 1.3020,
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin vs US Dollar',
    price: 68420.00,
    change24h: 2.84,
    sentiment: 'Strong Buy',
    bullishPercent: 82,
    rsi: 68.0,
    macd: 'Strong Bullish',
    support: 66000.0,
    resistance: 71500.0,
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial Average',
    price: 40050.00,
    change24h: 0.45,
    sentiment: 'Buy',
    bullishPercent: 65,
    rsi: 58.4,
    macd: 'Bullish Continuation',
    support: 39600.0,
    resistance: 40400.0,
  }
];

class AnalyticsService {
  public async getEconomicEvents(impact?: string, currency?: string): Promise<EconomicEvent[]> {
    let list = [...INITIAL_EVENTS];
    if (impact && impact !== 'all') {
      list = list.filter(e => e.impact === impact);
    }
    if (currency && currency !== 'all') {
      list = list.filter(e => e.currency === currency);
    }
    const res = await apiClient.mockDelay(list, 150);
    return res.data;
  }

  public getEconomicCalendar = this.getEconomicEvents;

  public async getMarketNews(category?: string): Promise<MarketNewsItem[]> {
    let list = [...INITIAL_NEWS];
    if (category && category !== 'all') {
      list = list.filter(n => n.category === category);
    }
    const res = await apiClient.mockDelay(list, 150);
    return res.data;
  }

  public async getTechnicalSentiments(): Promise<TechnicalSentiment[]> {
    const res = await apiClient.mockDelay(INITIAL_SENTIMENTS, 150);
    return res.data;
  }
}

export const analyticsService = new AnalyticsService();
