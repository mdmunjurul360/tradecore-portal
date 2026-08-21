import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingAccount, AccountStatus } from '../../types';
import { accountService } from '../../services/mock/accountService';
import { AccountCard } from '../../components/accounts/AccountCard';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  WalletCards,
  RefreshCw,
  CandlestickChart
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<AccountStatus>('real');
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountService.getAccounts(activeTab);
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeTab]);

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.accountNumber.includes(searchQuery) ||
      acc.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || acc.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = filteredAccounts.reduce((sum, a) => sum + a.equity, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>{t('nav.accounts', 'My Trading Accounts')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Create, configure, and monitor your Real and Demo MT4, MT5, and Web accounts.
          </p>
        </div>

        <button
          onClick={() => navigate('/accounts/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('accounts.openNew', 'Open New Account')}</span>
        </button>
      </div>

      {/* Tabs & Balance Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-subtle pb-3">
        {/* Status Tabs: Real, Demo, Archived */}
        <div className="flex items-center gap-2">
          {(['real', 'demo', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)] font-extrabold'
                  : 'bg-surface-alt border border-subtle text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt'
              }`}
            >
              {tab === 'real' ? t('accounts.real', 'Real Accounts') : tab === 'demo' ? t('accounts.demo', 'Demo Accounts') : t('accounts.archived', 'Archived')}
            </button>
          ))}
        </div>

        {/* Tab Financial Snapshot */}
        {activeTab !== 'archived' && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted">
              Total {activeTab.toUpperCase()} Balance: <strong className="text-primary dark:text-white font-mono">{formatCurrency(totalBalance, 'USD')}</strong>
            </span>
            <span className="text-muted">
              Total Equity: <strong className="text-emerald-400 font-mono">{formatCurrency(totalEquity, 'USD')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Search, Platform Filter & Grid/List View Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface backdrop-blur-xl p-3 rounded-2xl border border-subtle shadow-2xl">
        
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account #, nickname, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-alt border border-subtle text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="py-2 px-3 rounded-xl bg-surface border border-default text-xs text-secondary font-semibold outline-hidden cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="MT5">MetaTrader 5</option>
            <option value="MT4">MetaTrader 4</option>
            <option value="WebTerminal">Web Terminal</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchAccounts}
            className="p-2 text-muted hover:text-primary dark:hover:text-white rounded-xl hover:bg-surface-alt transition-colors cursor-pointer"
            title="Refresh accounts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center p-1 bg-surface-alt border border-subtle rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400 shadow-xs' : 'text-muted hover:text-primary dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400 shadow-xs' : 'text-muted hover:text-primary dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Account Cards Grid or List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title={`No ${activeTab} accounts found`}
          description={
            searchQuery
              ? 'No accounts match your current filter query.'
              : `You do not have any ${activeTab} trading accounts active at this moment.`
          }
          actionLabel={activeTab !== 'archived' ? 'Open New Trading Account' : undefined}
          onAction={() => navigate('/accounts/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onRefresh={fetchAccounts}
            />
          ))}
        </div>
      )}

    </div>
  );
};
