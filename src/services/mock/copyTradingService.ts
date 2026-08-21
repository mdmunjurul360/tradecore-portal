import { CopyStrategy, CopyInvestment } from '../../types';
import { apiClient } from '../api/client';

const INITIAL_STRATEGIES: CopyStrategy[] = [
  {
    id: 'strat-1',
    name: 'Apex Gold Scalper Pro',
    traderName: 'Marcus Vance',
    traderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    returnRate: 142.8,
    monthlyReturn: 14.2,
    riskScore: 3,
    maxDrawdown: 6.4,
    investorsCount: 1420,
    aum: 2840000,
    tradingDays: 320,
    winRate: 78.5,
    profitShare: 20,
    minInvestment: 100,
    equityHistory: [
      { date: 'M1', value: 100 },
      { date: 'M2', value: 114 },
      { date: 'M3', value: 128 },
      { date: 'M4', value: 145 },
      { date: 'M5', value: 168 },
      { date: 'M6', value: 198 },
      { date: 'M7', value: 242 },
    ],
    tags: ['Gold Scalping', 'Low Drawdown', 'Institutional'],
    isPopular: true,
    isVerified: true,
  },
  {
    id: 'strat-2',
    name: 'Quantum FX Momentum',
    traderName: 'Elena Rostova',
    traderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    returnRate: 98.4,
    monthlyReturn: 9.8,
    riskScore: 2,
    maxDrawdown: 4.2,
    investorsCount: 980,
    aum: 1750000,
    tradingDays: 240,
    winRate: 82.1,
    profitShare: 15,
    minInvestment: 50,
    equityHistory: [
      { date: 'M1', value: 100 },
      { date: 'M2', value: 109 },
      { date: 'M3', value: 121 },
      { date: 'M4', value: 135 },
      { date: 'M5', value: 152 },
      { date: 'M6', value: 176 },
      { date: 'M7', value: 198 },
    ],
    tags: ['Majors', 'Multi-Timeframe', 'Safe'],
    isPopular: true,
    isVerified: true,
  },
  {
    id: 'strat-3',
    name: 'Cyber Trend Alpha AI',
    traderName: 'David Chen',
    traderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    returnRate: 215.6,
    monthlyReturn: 21.5,
    riskScore: 5,
    maxDrawdown: 11.8,
    investorsCount: 2150,
    aum: 4300000,
    tradingDays: 410,
    winRate: 71.2,
    profitShare: 25,
    minInvestment: 250,
    equityHistory: [
      { date: 'M1', value: 100 },
      { date: 'M2', value: 122 },
      { date: 'M3', value: 150 },
      { date: 'M4', value: 185 },
      { date: 'M5', value: 230 },
      { date: 'M6', value: 275 },
      { date: 'M7', value: 315 },
    ],
    tags: ['Algorithmic', 'Indices & FX', 'High Yield'],
    isPopular: true,
    isVerified: true,
  },
  {
    id: 'strat-4',
    name: 'BlueChip Dividend & FX Hedge',
    traderName: 'Sarah Jenkins',
    traderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    returnRate: 54.2,
    monthlyReturn: 5.4,
    riskScore: 1,
    maxDrawdown: 2.5,
    investorsCount: 620,
    aum: 920000,
    tradingDays: 180,
    winRate: 88.0,
    profitShare: 10,
    minInvestment: 500,
    equityHistory: [
      { date: 'M1', value: 100 },
      { date: 'M2', value: 105 },
      { date: 'M3', value: 112 },
      { date: 'M4', value: 122 },
      { date: 'M5', value: 134 },
      { date: 'M6', value: 144 },
      { date: 'M7', value: 154 },
    ],
    tags: ['Ultra Safe', 'Conservative', 'Hedge'],
    isVerified: true,
  }
];

const INITIAL_INVESTMENTS: CopyInvestment[] = [
  {
    id: 'inv-1',
    strategyId: 'strat-1',
    strategyName: 'Apex Gold Scalper Pro',
    traderName: 'Marcus Vance',
    investedAmount: 2000.00,
    currentEquity: 2384.50,
    totalProfit: 384.50,
    profitPercent: 19.22,
    status: 'active',
    copyRatio: 1.0,
    startedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'inv-2',
    strategyId: 'strat-2',
    strategyName: 'Quantum FX Momentum',
    traderName: 'Elena Rostova',
    investedAmount: 1000.00,
    currentEquity: 1124.00,
    totalProfit: 124.00,
    profitPercent: 12.40,
    status: 'active',
    copyRatio: 0.5,
    startedAt: '2026-07-01T12:00:00Z',
  }
];

class CopyTradingService {
  private strategies: CopyStrategy[] = INITIAL_STRATEGIES;
  private investments: CopyInvestment[] = INITIAL_INVESTMENTS;

  public async getStrategies(): Promise<CopyStrategy[]> {
    const res = await apiClient.mockDelay(this.strategies, 150);
    return res.data;
  }

  public async getStrategyById(id: string): Promise<CopyStrategy | undefined> {
    return this.strategies.find(s => s.id === id);
  }

  public async getMyInvestments(): Promise<CopyInvestment[]> {
    const res = await apiClient.mockDelay(this.investments, 150);
    return res.data;
  }

  public getInvestments = this.getMyInvestments;

  public async startCopying(
    strategyIdOrParams: string | { strategyId: string; amount: number; accountId?: string; stopLossPercent?: number; copyRatio?: number },
    amount?: number,
    ratio: number = 1.0
  ): Promise<CopyInvestment> {
    if (typeof strategyIdOrParams === 'object') {
      return this.copyStrategy({
        strategyId: strategyIdOrParams.strategyId,
        amount: strategyIdOrParams.amount,
        copyRatio: strategyIdOrParams.copyRatio || 1.0,
      });
    }
    return this.copyStrategy({
      strategyId: strategyIdOrParams,
      amount: amount || 100,
      copyRatio: ratio,
    });
  }

  public async pauseCopying(investmentId: string): Promise<boolean> {
    return this.pauseOrStopInvestment(investmentId, 'paused');
  }

  public async resumeCopying(investmentId: string): Promise<boolean> {
    const inv = this.investments.find(i => i.id === investmentId);
    if (!inv) return false;
    inv.status = 'active';
    return true;
  }

  public async stopCopying(investmentId: string): Promise<boolean> {
    return this.pauseOrStopInvestment(investmentId, 'closed');
  }

  public async copyStrategy(params: {
    strategyId: string;
    amount: number;
    copyRatio: number;
  }): Promise<CopyInvestment> {
    const strat = this.strategies.find(s => s.id === params.strategyId);
    if (!strat) throw new Error('Strategy not found');

    const newInv: CopyInvestment = {
      id: `inv-${Date.now()}`,
      strategyId: strat.id,
      strategyName: strat.name,
      traderName: strat.traderName,
      investedAmount: params.amount,
      currentEquity: params.amount,
      totalProfit: 0,
      profitPercent: 0,
      status: 'active',
      copyRatio: params.copyRatio || 1.0,
      startedAt: new Date().toISOString(),
    };

    this.investments.unshift(newInv);
    const res = await apiClient.mockDelay(newInv, 250);
    return res.data;
  }

  public async pauseOrStopInvestment(id: string, newStatus: 'paused' | 'closed'): Promise<boolean> {
    const inv = this.investments.find(i => i.id === id);
    if (!inv) return false;
    inv.status = newStatus;
    return true;
  }
}

export const copyTradingService = new CopyTradingService();
