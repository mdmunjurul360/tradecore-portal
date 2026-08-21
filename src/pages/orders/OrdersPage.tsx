import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { ordersService } from '../../services/mock/ordersService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import {
  History,
  TrendingUp,
  TrendingDown,
  CandlestickChart,
  Search,
  Filter,
  XCircle,
  Plus
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { showToast } = useToast();
  const { openTerminal } = useModal();

  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrders(activeTab);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleClosePosition = async (orderId: string, ticket: string) => {
    try {
      await ordersService.closeOrder(orderId);
      showToast('info', 'Position Closed', `Order #${ticket} closed successfully.`);
      fetchOrders();
    } catch (err: any) {
      showToast('error', 'Close Failed', err.message);
    }
  };

  const filteredOrders = orders.filter(o =>
    o.ticket.includes(searchQuery) ||
    o.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.accountNumber.includes(searchQuery)
  );

  const totalFloating = filteredOrders.reduce((sum, o) => sum + (o.profit || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>Trading Positions & Order Book</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Monitor real-time floating P&L, stop-loss triggers, and historical trade logs.
          </p>
        </div>

        <button
          onClick={() => openTerminal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <CandlestickChart className="w-4 h-4" />
          <span>New Order Execution</span>
        </button>
      </div>

      {/* Tabs & Floating summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          {(['open', 'pending', 'closed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                  : 'text-muted hover:bg-surface-alt hover:text-primary dark:hover:text-white border border-transparent'
              }`}
            >
              {tab === 'open' ? 'Open Positions' : tab === 'pending' ? 'Pending Orders' : 'Trade History'}
            </button>
          ))}
        </div>

        {activeTab === 'open' && (
          <div className="text-xs font-semibold text-muted flex items-center gap-2">
            <span>Total Floating P&L:</span>
            <strong className={`font-mono text-sm px-2.5 py-1 rounded-lg border ${
              totalFloating >= 0
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {totalFloating >= 0 ? '+' : ''}{formatCurrency(totalFloating, 'USD')}
            </strong>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-surface backdrop-blur-xl p-3 rounded-2xl border border-subtle shadow-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket #, symbol (e.g. EURUSD), account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-400 outline-hidden focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredOrders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={History}
              title={`No ${activeTab} positions`}
              description="No active trading positions found for this account."
              actionLabel="Launch Web Terminal"
              onAction={() => openTerminal()}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-overlay text-muted font-bold uppercase tracking-wider text-[10px] border-b border-subtle font-sans">
                <tr>
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Volume (Lots)</th>
                  <th className="p-4">Open Price</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">S / L</th>
                  <th className="p-4">T / P</th>
                  <th className="p-4">P&L ($ USD)</th>
                  {activeTab === 'open' && <th className="p-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-secondary">
                {filteredOrders.map((order) => {
                  const isProfit = (order.profit || 0) >= 0;
                  return (
                    <tr key={order.id} className="hover:bg-surface-alt transition-colors">
                      <td className="p-4 text-muted">#{order.ticket}</td>
                      <td className="p-4 font-mono text-cyan-400">#{order.accountNumber}</td>
                      <td className="p-4 font-bold text-primary dark:text-white font-sans">{order.symbol}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          order.type === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {order.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-primary dark:text-white">{order.volume.toFixed(2)}</td>
                      <td className="p-4">{order.openPrice}</td>
                      <td className="p-4 text-primary dark:text-white">{order.currentPrice || order.closePrice}</td>
                      <td className="p-4 text-muted">{order.stopLoss || '-'}</td>
                      <td className="p-4 text-muted">{order.takeProfit || '-'}</td>
                      <td className={`p-4 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(order.profit || 0, 'USD')}
                      </td>
                      {activeTab === 'open' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleClosePosition(order.id, order.ticket)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
