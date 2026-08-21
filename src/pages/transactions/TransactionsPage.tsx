import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { transactionService } from '../../services/mock/transactionService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Download,
  Filter,
  ReceiptText,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ExternalLink,
  X
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesSearch =
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.accountNumber.includes(searchQuery) ||
      tx.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Reference,Type,Status,Amount,Currency,Account,Method,Date\n'];
    const rows = filtered.map(tx =>
      `"${tx.reference}","${tx.type}","${tx.status}","${tx.amount}","${tx.currency}","${tx.accountNumber}","${tx.method}","${tx.createdAt}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TradeCore_Transactions_${Date.now()}.csv`;
    a.click();
    showToast('success', 'Export Complete', 'Transaction history CSV downloaded.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>Transaction History & Statements</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Full audit log of deposits, withdrawals, internal transfers, and IB commissions.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-alt hover:bg-surface-alt text-primary dark:text-white font-bold text-xs border border-default hover:border-cyan-500/30 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface backdrop-blur-xl p-3 rounded-2xl border border-subtle shadow-2xl">
        
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference #, account, method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-alt border border-subtle text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 rounded-xl bg-surface border border-default text-xs text-secondary font-semibold outline-hidden cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="transfer">Transfers</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 rounded-xl bg-surface border border-default text-xs text-secondary font-semibold outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={ReceiptText}
              title="No transactions found"
              description="No financial activity matches your current filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-alt text-muted font-bold uppercase tracking-wider text-[10px] border-b border-subtle">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-secondary font-mono">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-surface-alt cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold capitalize flex items-center gap-2 font-sans">
                      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                        tx.type === 'deposit'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : tx.type === 'withdrawal'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        ) : tx.type === 'withdrawal' ? (
                          <ArrowUpFromLine className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-primary dark:text-white font-medium">{tx.type}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-primary dark:text-white">
                      {tx.reference}
                    </td>
                    <td className="p-4 font-mono text-muted">
                      #{tx.accountNumber}
                    </td>
                    <td className="p-4 font-sans text-secondary">
                      {tx.method}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      <span className={tx.type === 'deposit' ? 'text-emerald-400' : tx.type === 'withdrawal' ? 'text-rose-400' : 'text-primary dark:text-white'}>
                        {tx.type === 'deposit' ? '+' : tx.type === 'withdrawal' ? '-' : ''}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="p-4 text-muted font-sans">
                      {formatDate(tx.createdAt, 'medium')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-overlay border border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-subtle">
              <h3 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
                <span>Transaction Statement</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-muted hover:text-primary dark:hover:text-white p-1 rounded-xl hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Reference:</span>
                <strong className="font-mono text-cyan-400">{selectedTx.reference}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Transaction Type:</span>
                <strong className="capitalize text-primary dark:text-white">{selectedTx.type}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Account:</span>
                <strong className="font-mono text-primary dark:text-white">#{selectedTx.accountNumber}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Payment Channel:</span>
                <strong className="text-primary dark:text-white">{selectedTx.method}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Net Amount:</span>
                <strong className="font-mono text-emerald-400 font-bold text-sm">${selectedTx.amount.toFixed(2)} USD</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Processing Fee:</span>
                <strong className="font-mono text-secondary">$0.00 USD (Waived)</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Execution Date:</span>
                <strong className="text-secondary font-mono">{formatDate(selectedTx.createdAt, 'full')}</strong>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Status:</span>
                <StatusBadge status={selectedTx.status} size="sm" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-subtle flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(34,211,238,0.35)] cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
