import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { accountService } from '../../services/mock/accountService';
import { transactionService } from '../../services/mock/transactionService';
import { TradingAccount, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FinancialCard } from '../../components/common/FinancialCard';
import { AccountCard } from '../../components/accounts/AccountCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  Scale,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  CandlestickChart,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { openTerminal } = useModal();

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        accountService.getAccounts('real'),
        transactionService.getTransactions()
      ]);
      setAccounts(accs);
      setRecentTransactions(txs.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Aggregated financials
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.reduce((sum, a) => sum + a.equity, 0);
  const totalFreeMargin = accounts.reduce((sum, a) => sum + a.freeMargin, 0);
  const totalFloatingPL = accounts.reduce((sum, a) => sum + a.floatingPL, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-alt backdrop-blur-xl text-primary dark:text-white rounded-2xl p-6 border border-subtle shadow-2xl relative overflow-hidden">
        {/* Glow orb background accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Institutional Forex & CFD Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary dark:text-white">
            {t('dashboard.welcome', 'Welcome back')}, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
            Live overview of your institutional trading accounts, real-time margin ratios, and instant funding actions.
          </p>
        </div>

        {/* Action buttons inside header */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => navigate('/deposit')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            <span>Deposit Funds</span>
          </button>

          <button
            onClick={() => openTerminal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-alt hover:bg-surface-alt text-primary dark:text-white font-bold text-xs border border-default hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <CandlestickChart className="w-4 h-4 text-cyan-400" />
            <span>Web Terminal</span>
          </button>
        </div>
      </div>

      {/* Financial Summary 4-Card Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <FinancialCard
              label={t('header.totalBalance', 'Total Balance')}
              value={formatCurrency(totalBalance, 'USD')}
              subtitle="Real Trading Capital"
              change={3.45}
              icon={Wallet}
              sparklineData={[12000, 12500, 13100, 14200, 14850, 15000]}
              variant="accent"
              onClick={() => navigate('/accounts')}
            />

            <FinancialCard
              label={t('dashboard.equity', 'Total Equity')}
              value={formatCurrency(totalEquity, 'USD')}
              subtitle="Live Liquid Value"
              change={4.82}
              icon={ShieldCheck}
              sparklineData={[12100, 12800, 13400, 14800, 15215, 15400]}
            />

            <FinancialCard
              label={t('dashboard.freeMargin', 'Free Margin')}
              value={formatCurrency(totalFreeMargin, 'USD')}
              subtitle="Available for New Orders"
              icon={Scale}
              sparklineData={[10000, 11000, 12500, 13500, 13975]}
            />

            <FinancialCard
              label={t('dashboard.floatingPL', 'Floating P&L')}
              value={`${totalFloatingPL >= 0 ? '+' : ''}${formatCurrency(totalFloatingPL, 'USD')}`}
              subtitle="Open Positions"
              change={totalFloatingPL >= 0 ? 12.8 : -4.2}
              icon={TrendingUp}
              variant={totalFloatingPL >= 0 ? 'success' : 'danger'}
              sparklineData={[0, 120, 190, 240, 310, 364]}
            />
          </>
        )}
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/deposit')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface backdrop-blur-xl border border-subtle hover:border-cyan-500/40 hover:bg-surface-alt hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white group-hover:text-cyan-300 transition-colors">Deposit</p>
            <p className="text-[11px] font-mono text-muted">0% Commission</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/withdraw')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface backdrop-blur-xl border border-subtle hover:border-cyan-500/40 hover:bg-surface-alt hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white group-hover:text-cyan-300 transition-colors">Withdraw</p>
            <p className="text-[11px] font-mono text-muted">Instant 24/7</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/transfer')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface backdrop-blur-xl border border-subtle hover:border-cyan-500/40 hover:bg-surface-alt hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white group-hover:text-cyan-300 transition-colors">Transfer</p>
            <p className="text-[11px] font-mono text-muted">Internal Accounts</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/accounts/new')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface backdrop-blur-xl border border-subtle hover:border-cyan-500/40 hover:bg-surface-alt hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white group-hover:text-cyan-300 transition-colors">Open Account</p>
            <p className="text-[11px] font-mono text-muted">MT5 / MT4 / Web</p>
          </div>
        </button>
      </div>

      {/* Main Grid: Active Accounts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: My Active Accounts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary dark:text-white tracking-tight flex items-center gap-2">
                <span>{t('dashboard.activeAccounts', 'Trading Accounts')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h2>
              <p className="text-xs text-muted">
                Manage your live trading balances and execution servers.
              </p>
            </div>
            <button
              onClick={() => navigate('/accounts')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({accounts.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : accounts.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-surface backdrop-blur-xl border border-subtle rounded-2xl">
                <p className="text-xs text-muted">No active trading accounts.</p>
              </div>
            ) : (
              accounts.slice(0, 2).map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onRefresh={loadDashboardData}
                />
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Financial Activity & KYC Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary dark:text-white tracking-tight flex items-center gap-2">
              <span>{t('dashboard.recentActivity', 'Recent Activity')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              History →
            </button>
          </div>

          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl divide-y divide-subtle shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted">Loading activity...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">No transactions recorded yet.</div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigate('/transactions')}
                  className="p-3.5 hover:bg-surface-alt cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                      tx.type === 'deposit'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : tx.type === 'withdrawal'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-primary dark:text-white capitalize">
                        {tx.type} • #{tx.accountNumber}
                      </p>
                      <p className="text-[11px] font-mono text-muted">{formatDate(tx.createdAt, 'short')}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-mono font-bold ${
                      tx.type === 'deposit' ? 'text-emerald-400' : tx.type === 'withdrawal' ? 'text-rose-400' : 'text-primary dark:text-white'
                    }`}>
                      {tx.type === 'deposit' ? '+' : tx.type === 'withdrawal' ? '-' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <StatusBadge status={tx.status} size="sm" className="mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Copy Trading / Referral Promo Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent border border-cyan-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(34,211,238,0.08)]">
            <div>
              <p className="text-xs font-bold text-primary dark:text-white">Copy Master Strategies</p>
              <p className="text-[11px] text-muted mt-0.5">Automate your trading with audited leaders.</p>
            </div>
            <button
              onClick={() => navigate('/copy-trading')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)] shrink-0 cursor-pointer"
            >
              Explore →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
