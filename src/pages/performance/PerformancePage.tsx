import React, { useState, useEffect } from 'react';
import { PerformanceMetrics } from '../../types';
import { performanceService } from '../../services/mock/performanceService';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../../components/common/FinancialCard';
import {
  LineChart,
  TrendingUp,
  Award,
  Scale,
  ShieldCheck,
  Target,
  Percent,
  Layers
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'YTD' | 'ALL'>('30D');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await performanceService.getPerformanceMetrics();
      setMetrics(data);
      setLoading(false);
    };
    fetch();
  }, [timeframe]);

  if (loading || !metrics) {
    return <div className="p-8 text-center text-xs text-muted">Loading performance analytics...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>Performance & Portfolio Analytics</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Real-time equity curves, win/loss distribution, risk ratios, and asset profitability.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-alt border border-subtle p-1 rounded-xl">
          {(['30D', '90D', 'YTD', 'ALL'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'text-muted hover:text-primary dark:hover:text-white border border-transparent'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          label="Total Net Profit"
          value={formatCurrency(metrics.totalProfit, 'USD')}
          change={metrics.monthlyReturn}
          changeText="Return Rate"
          icon={TrendingUp}
          variant="accent"
          sparklineData={[10000, 10800, 11400, 12600, 13800, 14250]}
        />
        <FinancialCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subtitle={`${metrics.totalTrades} Total Trades`}
          icon={Target}
          sparklineData={[60, 62, 65, 64, 67.4]}
        />
        <FinancialCard
          label="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          subtitle="Gross Profit / Gross Loss"
          icon={Scale}
        />
        <FinancialCard
          label="Max Drawdown"
          value={`-${metrics.maxDrawdown.toFixed(1)}%`}
          subtitle="Low Risk Management"
          icon={ShieldCheck}
          variant="danger"
        />
      </div>

      {/* Interactive Equity Growth Curve */}
      <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Cumulative Growth Curve</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>
            <p className="text-xs text-muted">
              Account equity progression over the selected period.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.15)]">
            +{metrics.monthlyReturn}% Overall ROI
          </span>
        </div>

        {/* SVG Equity Graph */}
        <div className="h-64 w-full relative">
          <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible">
            {/* Grid lines */}
            {[40, 90, 140, 190].map(y => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
            ))}

            {/* Gradient Fill under curve */}
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <path
              d="M 20 200 Q 120 180, 200 150 T 380 120 T 520 70 T 680 40 L 680 220 L 20 220 Z"
              fill="url(#equityGrad)"
            />

            {/* Line */}
            <path
              d="M 20 200 Q 120 180, 200 150 T 380 120 T 520 70 T 680 40"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data Dots */}
            {[{ x: 20, y: 200, v: '$10k' }, { x: 200, y: 150, v: '$11.2k' }, { x: 380, y: 120, v: '$12.4k' }, { x: 520, y: 70, v: '$13.6k' }, { x: 680, y: 40, v: '$14.2k' }].map((pt, idx) => (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="4" fill="#22d3ee" />
                <circle cx={pt.x} cy={pt.y} r="8" fill="#22d3ee" opacity="0.3" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Breakdown: Best Instruments & Win/Loss Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Profitable Instruments */}
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-primary dark:text-white mb-4">
            Instrument Profit Distribution
          </h3>
          <div className="space-y-3">
            {[
              { symbol: 'XAUUSD (Gold)', profit: 2450.00, share: 58, trades: 42 },
              { symbol: 'EURUSD', profit: 1120.00, share: 26, trades: 38 },
              { symbol: 'BTCUSD', profit: 480.00, share: 11, trades: 14 },
              { symbol: 'US30', profit: 200.00, share: 5, trades: 6 },
            ].map(item => (
              <div key={item.symbol} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-primary dark:text-white">{item.symbol}</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatCurrency(item.profit, 'USD')}</span>
                </div>
                <div className="w-full bg-surface-alt h-2 rounded-full overflow-hidden border border-subtle">
                  <div className="bg-gradient-to-r from-cyan-400 to-indigo-600 h-full rounded-full" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Execution Statistics */}
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-primary dark:text-white mb-4">
            Risk & Execution Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-alt border border-subtle">
              <span className="text-muted block">Average Win</span>
              <strong className="text-emerald-400 font-mono font-bold text-sm">+$142.50</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-subtle">
              <span className="text-muted block">Average Loss</span>
              <strong className="text-rose-400 font-mono font-bold text-sm">-$68.20</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-subtle">
              <span className="text-muted block">Sharpe Ratio</span>
              <strong className="text-primary dark:text-white font-mono font-bold text-sm">{metrics.sharpeRatio.toFixed(2)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-subtle">
              <span className="text-muted block">Avg Holding Time</span>
              <strong className="text-primary dark:text-white font-mono font-bold text-sm">3h 42m</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
