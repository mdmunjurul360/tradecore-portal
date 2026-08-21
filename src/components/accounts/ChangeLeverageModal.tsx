import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { Leverage } from '../../types';
import { accountService } from '../../services/mock/accountService';
import { useToast } from '../../context/ToastContext';
import { X, Sliders, AlertTriangle } from 'lucide-react';

const LEVERAGE_OPTIONS: { value: Leverage; label: string; risk: string }[] = [
  { value: '1:50', label: '1:50 (Conservative)', risk: 'Low' },
  { value: '1:100', label: '1:100 (Moderate)', risk: 'Low' },
  { value: '1:200', label: '1:200 (Standard)', risk: 'Medium' },
  { value: '1:500', label: '1:500 (Pro Trader)', risk: 'Medium-High' },
  { value: '1:1000', label: '1:1000 (High Leverage)', risk: 'High' },
  { value: '1:2000', label: '1:2000 (Ultra High)', risk: 'Very High' },
  { value: '1:Unlimited', label: '1:Unlimited (Dynamic Margin)', risk: 'Extreme' },
];

export const ChangeLeverageModal: React.FC<{ onUpdated?: () => void }> = ({ onUpdated }) => {
  const { isChangeLeverageOpen, selectedAccount, closeChangeLeverage } = useModal();
  const { showToast } = useToast();
  const [selectedLev, setSelectedLev] = useState<Leverage>(selectedAccount?.leverage || '1:500');
  const [loading, setLoading] = useState(false);

  if (!isChangeLeverageOpen || !selectedAccount) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await accountService.updateAccount(selectedAccount.id, { leverage: selectedLev });
      showToast('success', 'Leverage Updated', `Account #${selectedAccount.accountNumber} leverage is now ${selectedLev}.`);
      onUpdated?.();
      closeChangeLeverage();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-subtle dark:border-default">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-primary dark:text-white">Change Account Leverage</h3>
              <p className="text-xs text-muted">Account #{selectedAccount.accountNumber}</p>
            </div>
          </div>
          <button
            onClick={closeChangeLeverage}
            className="text-muted hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p className="leading-relaxed">
            Changing leverage adjusts the required margin for new trades immediately. Ensure you have sufficient free margin before increasing exposure.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {LEVERAGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedLev === opt.value
                  ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-slate-900 dark:text-primary dark:text-white font-bold'
                  : 'border-slate-200 dark:border-default hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="leverage"
                  value={opt.value}
                  checked={selectedLev === opt.value}
                  onChange={() => setSelectedLev(opt.value)}
                  className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs">{opt.label}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted">
                Risk: {opt.risk}
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle dark:border-default">
          <button
            type="button"
            onClick={closeChangeLeverage}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
          >
            {loading ? 'Updating...' : 'Apply Leverage'}
          </button>
        </div>

      </div>
    </div>
  );
};
