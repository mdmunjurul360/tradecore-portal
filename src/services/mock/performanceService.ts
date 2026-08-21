import { PerformanceMetric } from '../../types';
import { apiClient } from '../api/client';

export interface EquityCurvePoint {
  date: string;
  equity: number;
  balance: number;
  pnl: number;
}

export interface SymbolPerformance {
  symbol: string;
  trades: number;
  winRate: number;
  netProfit: number;
  volumeLots: number;
}

class PerformanceService {
  public async getMetrics(_period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d', _accountId?: string): Promise<PerformanceMetric> {
    const data: PerformanceMetric = {
      netProfit: 4820.50,
      grossProfit: 6940.00,
      grossLoss: -2119.50,
      winRate: 68.4,
      profitFactor: 3.27,
      totalTrades: 142,
      winningTrades: 97,
      losingTrades: 45,
      averageWin: 71.55,
      averageLoss: 47.10,
      maxDrawdown: 4.8,
      maxDrawdownPercent: 4.8,
      tradingVolumeLots: 84.50,
      sharpeRatio: 2.15,
    };
    const res = await apiClient.mockDelay(data, 150);
    return res.data;
  }

  public getPerformanceMetrics = this.getMetrics;

  public async getEquityCurve(_period: string = '30d'): Promise<EquityCurvePoint[]> {
    const points: EquityCurvePoint[] = [
      { date: 'Jul 18', balance: 10000, equity: 10000, pnl: 0 },
      { date: 'Jul 22', balance: 10450, equity: 10520, pnl: 450 },
      { date: 'Jul 26', balance: 10890, equity: 10780, pnl: 890 },
      { date: 'Jul 30', balance: 11200, equity: 11450, pnl: 1200 },
      { date: 'Aug 03', balance: 11050, equity: 11000, pnl: 1050 },
      { date: 'Aug 07', balance: 12400, equity: 12600, pnl: 2400 },
      { date: 'Aug 10', balance: 13150, equity: 13220, pnl: 3150 },
      { date: 'Aug 13', balance: 14200, equity: 14100, pnl: 4200 },
      { date: 'Aug 16', balance: 14850, equity: 15215, pnl: 4850 },
    ];
    const res = await apiClient.mockDelay(points, 150);
    return res.data;
  }

  public async getSymbolPerformance(): Promise<SymbolPerformance[]> {
    const list: SymbolPerformance[] = [
      { symbol: 'XAUUSD', trades: 54, winRate: 74.0, netProfit: 2480.00, volumeLots: 36.5 },
      { symbol: 'EURUSD', trades: 42, winRate: 66.7, netProfit: 1240.50, volumeLots: 25.0 },
      { symbol: 'BTCUSD', trades: 26, winRate: 61.5, netProfit: 890.00, volumeLots: 12.0 },
      { symbol: 'US30', trades: 12, winRate: 75.0, netProfit: 510.00, volumeLots: 7.0 },
      { symbol: 'GBPUSD', trades: 8, winRate: 50.0, netProfit: -300.00, volumeLots: 4.0 },
    ];
    const res = await apiClient.mockDelay(list, 150);
    return res.data;
  }
}

export const performanceService = new PerformanceService();
