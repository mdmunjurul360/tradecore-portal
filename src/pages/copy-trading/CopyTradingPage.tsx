import React, { useState, useEffect } from 'react';
import { CopyTradingStrategy, CopyInvestment } from '../../types';
import { copyTradingService } from '../../services/mock/copyTradingService';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  Users2,
  TrendingUp,
  ShieldCheck,
  Star,
  Zap,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  X,
  Sliders,
  DollarSign
} from 'lucide-react';

export const CopyTradingPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'strategies' | 'investments'>('strategies');
  const [strategies, setStrategies] = useState<CopyTradingStrategy[]>([]);
  const [investments, setInvestments] = useState<CopyInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStrategy, setSelectedStrategy] = useState<CopyTradingStrategy | null>(null);
  const [investAmount, setInvestAmount] = useState<number>(500);
  const [stopLossPercent, setStopLossPercent] = useState<number>(15);
  const [investing, setInvesting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [strats, invs] = await Promise.all([
      copyTradingService.getStrategies(),
      copyTradingService.getInvestments(),
    ]);
    setStrategies(strats);
    setInvestments(invs);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return;

    setInvesting(true);
    try {
      await copyTradingService.startCopying({
        strategyId: selectedStrategy.id,
        accountId: 'acc-1',
        amount: investAmount,
        stopLossPercent,
      });
      showToast('success', 'Strategy Copied', `Successfully allocated $${investAmount} to ${selectedStrategy.name}`);
      setSelectedStrategy(null);
      await fetchData();
      setActiveTab('investments');
    } catch (err: any) {
      showToast('error', 'Copy Failed', err.message);
    } finally {
      setInvesting(false);
    }
  };

  const handleTogglePause = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await copyTradingService.pauseCopying(id);
        showToast('info', 'Copying Paused', 'No new positions will be replicated.');
      } else {
        await copyTradingService.resumeCopying(id);
        showToast('success', 'Copying Resumed', 'Live position replication re-enabled.');
      }
      fetchData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleStopCopy = async (id: string) => {
    try {
      await copyTradingService.stopCopying(id);
      showToast('info', 'Investment Liquidated', 'Positions closed and balance returned.');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Social Copy Trading & PAMM Marketplace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Replicate high-performing master traders automatically • 0% Management fee • Real-time risk controls
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'strategies'
              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
              : 'text-muted hover:bg-surface-alt hover:text-primary dark:hover:text-white border border-transparent'
          }`}
        >
          Master Strategies ({strategies.length})
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'investments'
              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
              : 'text-muted hover:bg-surface-alt hover:text-primary dark:hover:text-white border border-transparent'
          }`}
        >
          My Active Allocations ({investments.length})
        </button>
      </div>

      {/* Tab 1: Strategies Marketplace */}
      {activeTab === 'strategies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map((strat) => (
            <div
              key={strat.id}
              className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Master Avatar & Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      {strat.masterTrader.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary dark:text-white leading-tight">
                        {strat.name}
                      </h3>
                      <p className="text-[11px] text-muted mt-0.5">by {strat.masterTrader.name}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Risk: {strat.riskScore}/10
                  </span>
                </div>

                <p className="text-xs text-muted mb-4 line-clamp-2 leading-relaxed">
                  {strat.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-alt border border-subtle mb-4 font-mono text-center">
                  <div>
                    <span className="text-[10px] text-muted font-sans block">30D ROI</span>
                    <strong className="text-emerald-400 font-bold text-sm">+{strat.returnRate30d}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-sans block">Copiers</span>
                    <strong className="text-primary dark:text-white font-bold text-sm">{strat.copiersCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-sans block">Max DD</span>
                    <strong className="text-rose-400 font-bold text-sm">-{strat.maxDrawdown}%</strong>
                  </div>
                </div>

                {/* Performance Sparkline SVG */}
                <div className="h-10 w-full mb-4">
                  <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                    <path
                      d="M 5 35 Q 40 25, 80 18 T 140 12 T 195 5"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedStrategy(strat)}
                className="w-full py-2.5 px-4 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
              >
                Copy Strategy (${strat.minInvestment} Min)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: My Active Investments */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="p-12 text-center bg-surface backdrop-blur-xl border border-subtle rounded-2xl">
              <p className="text-xs text-muted">No active copy investments. Choose a strategy to replicate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investments.map(inv => (
                <div
                  key={inv.id}
                  className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-primary dark:text-white">{inv.strategyName}</h4>
                        <span className="text-xs text-muted font-mono">Allocated: ${inv.investedAmount.toFixed(2)} USD</span>
                      </div>
                      <StatusBadge status={inv.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-alt border border-subtle font-mono text-xs mb-4">
                      <div>
                        <span className="text-[10px] text-muted font-sans block">Current Profit</span>
                        <strong className={`font-bold ${inv.currentProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {inv.currentProfit >= 0 ? '+' : ''}${inv.currentProfit.toFixed(2)} ({inv.returnRate.toFixed(1)}%)
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted font-sans block">Stop Loss Protection</span>
                        <strong className="text-primary dark:text-white font-bold">{inv.stopLossPercent}% Loss Cap</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-subtle">
                    <button
                      onClick={() => handleTogglePause(inv.id, inv.status)}
                      className="flex-1 py-2 px-3 rounded-xl bg-surface-alt hover:bg-surface-alt border border-subtle text-xs font-bold text-secondary transition-colors cursor-pointer"
                    >
                      {inv.status === 'active' ? 'Pause Replication' : 'Resume Replication'}
                    </button>
                    <button
                      onClick={() => handleStopCopy(inv.id)}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Stop & Liquidate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Copy Strategy Allocation Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md">
          <div className="bg-surface border border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-subtle">
              <div>
                <h3 className="text-base font-bold text-primary dark:text-white">Copy {selectedStrategy.name}</h3>
                <p className="text-xs text-muted">Profit Share: {selectedStrategy.commissionRate}%</p>
              </div>
              <button
                onClick={() => setSelectedStrategy(null)}
                className="text-muted hover:text-primary dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartCopy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Investment Capital ($ USD)
                </label>
                <input
                  type="number"
                  min={selectedStrategy.minInvestment}
                  value={investAmount}
                  onChange={e => setInvestAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-sm font-mono font-bold text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  required
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Minimum required: ${selectedStrategy.minInvestment} USD
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Automated Stop-Loss Guard (%)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={stopLossPercent}
                  onChange={e => setStopLossPercent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-sm font-mono font-bold text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  required
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Automatically disconnects if drawdown reaches {stopLossPercent}%.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
                Trades are mirrored proportionally in milliseconds with zero extra markup.
              </div>

              <button
                type="submit"
                disabled={investing}
                className="w-full py-3 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer"
              >
                {investing ? 'Allocating Capital...' : `Confirm & Copy ($${investAmount} USD)`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
