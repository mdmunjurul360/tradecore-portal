import React from 'react';
import { useModal } from '../../context/ModalContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Copy,
  Server,
  Shield,
  Layers,
  Coins,
  Scale
} from 'lucide-react';

export const AccountDetailsModal: React.FC = () => {
  const { isAccountDetailsOpen, selectedAccount, closeAccountDetails, openChangeLeverage } = useModal();
  const { showToast } = useToast();

  if (!isAccountDetailsOpen || !selectedAccount) return null;

  const copyField = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', `${label}: ${text}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-default rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-subtle dark:border-default">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-primary dark:text-white">
                {selectedAccount.nickname}
              </span>
              <StatusBadge status={selectedAccount.status} size="sm" />
            </div>
            <p className="text-xs text-muted dark:text-muted">
              Account credentials and technical connection details.
            </p>
          </div>
          <button
            onClick={closeAccountDetails}
            className="text-muted hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Table */}
        <div className="space-y-2.5 text-xs">
          
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Account Number / Login ID
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 dark:text-primary dark:text-white">{selectedAccount.accountNumber}</span>
              <button
                onClick={() => copyField('Account ID', selectedAccount.accountNumber)}
                className="text-muted hover:text-amber-500 p-1 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-500" /> Trading Server
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 dark:text-primary dark:text-white">{selectedAccount.server}</span>
              <button
                onClick={() => copyField('Server', selectedAccount.server)}
                className="text-muted hover:text-amber-500 p-1 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" /> Platform & Account Type
            </span>
            <span className="font-bold text-slate-900 dark:text-primary dark:text-white">
              {selectedAccount.platform} • {selectedAccount.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-500" /> Leverage
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-primary dark:text-white">{selectedAccount.leverage}</span>
              <button
                onClick={() => {
                  closeAccountDetails();
                  openChangeLeverage(selectedAccount);
                }}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 underline"
              >
                Change
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Base Currency
            </span>
            <span className="font-bold text-slate-900 dark:text-primary dark:text-white">{selectedAccount.currency}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted">Created Date</span>
            <span className="text-slate-700 dark:text-secondary">{formatDate(selectedAccount.createdAt, 'short')}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface border border-subtle dark:border-default">
            <span className="text-muted dark:text-muted">Current Equity / Balance</span>
            <span className="font-mono font-bold text-slate-900 dark:text-primary dark:text-white">
              {formatCurrency(selectedAccount.equity, selectedAccount.currency)} / {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-subtle dark:border-default">
          <button
            onClick={closeAccountDetails}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
