import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingAccount } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/mock/accountService';
import {
  MoreVertical,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  CandlestickChart,
  Info,
  Sliders,
  KeyRound,
  Archive,
  RotateCcw,
  Edit2,
  Copy,
  Check
} from 'lucide-react';

interface AccountCardProps {
  account: TradingAccount;
  onRefresh: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onRefresh }) => {
  const navigate = useNavigate();
  const { openTerminal, openAccountDetails, openChangeLeverage } = useModal();
  const { showToast } = useToast();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(account.nickname);
  const [copied, setCopied] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    showToast('info', 'Copied to Clipboard', `Account #${account.accountNumber} copied.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) return;
    await accountService.updateAccount(account.id, { nickname: nicknameInput.trim() });
    setIsEditingName(false);
    showToast('success', 'Nickname Updated');
    onRefresh();
  };

  const handleArchiveToggle = async () => {
    setIsMenuOpen(false);
    if (account.isArchived) {
      await accountService.unarchiveAccount(account.id, 'real');
      showToast('success', 'Account Restored', `Account #${account.accountNumber} unarchived.`);
    } else {
      await accountService.archiveAccount(account.id);
      showToast('info', 'Account Archived', `Account #${account.accountNumber} moved to archive.`);
    }
    onRefresh();
  };

  const isProfit = account.floatingPL >= 0;

  return (
    <div className="bg-white/80 dark:bg-surface backdrop-blur-xl border border-black/8 dark:border-subtle rounded-2xl p-5 shadow-sm dark:shadow-xs hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all duration-200 flex flex-col justify-between group">
      
      {/* Top row: Platform / Server / Number + 3-Dot Options */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold font-mono tracking-tight">
              {account.platform}
            </span>
            <StatusBadge status={account.type.replace('_', ' ')} size="sm" />
            {account.status === 'demo' && <StatusBadge status="Demo" size="sm" />}
            {account.isArchived && <StatusBadge status="Archived" size="sm" />}
          </div>

          {/* 3-Dot Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-muted hover:text-primary dark:hover:text-white rounded-xl hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white/95 dark:bg-overlay border border-black/10 dark:border-default rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-2xl">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAccountDetails(account);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors text-left"
                >
                  <Info className="w-3.5 h-3.5 text-muted" />
                  Account Information
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditingName(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary dark:hover:text-white hover:bg-surface-alt transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted" />
                  Change Nickname
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openChangeLeverage(account);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary dark:hover:text-white hover:bg-surface-alt transition-colors text-left"
                >
                  <Sliders className="w-3.5 h-3.5 text-muted" />
                  Change Leverage ({account.leverage})
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    showToast('info', 'Trading Password Reset', 'A secure reset link has been dispatched to your verified email.');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary dark:hover:text-white hover:bg-surface-alt transition-colors text-left"
                >
                  <KeyRound className="w-3.5 h-3.5 text-muted" />
                  Reset Trading Password
                </button>
                <div className="border-t border-subtle my-1" />
                <button
                  onClick={handleArchiveToggle}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  {account.isArchived ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore from Archive
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      Archive Account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nickname & Account Number */}
        <div className="mb-4">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 mb-1">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="text-sm font-bold bg-surface-alt px-2.5 py-1 rounded-xl border border-cyan-500/40 text-primary dark:text-white w-full outline-hidden"
                autoFocus
              />
              <button
                onClick={handleSaveNickname}
                className="p-1.5 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 rounded-xl text-xs font-bold shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h4 className="text-sm font-bold text-primary dark:text-white truncate">
              {account.nickname}
            </h4>
          )}

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono font-semibold text-muted">
              #{account.accountNumber}
            </span>
            <button
              onClick={handleCopyAccount}
              className="text-muted hover:text-cyan-400 p-0.5 rounded transition-colors"
              title="Copy account number"
            >
              {copied ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <span className="text-[10px] text-muted font-mono">• {account.server}</span>
          </div>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-alt border border-subtle mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Balance
            </span>
            <p className="text-base font-extrabold font-mono text-primary dark:text-white tracking-tight">
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Equity
            </span>
            <p className="text-base font-extrabold font-mono text-primary dark:text-white tracking-tight">
              {formatCurrency(account.equity, account.currency)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Free Margin
            </span>
            <p className="text-xs font-bold font-mono text-secondary">
              {formatCurrency(account.freeMargin, account.currency)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Floating P&L
            </span>
            <p className={`text-xs font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfit ? '+' : ''}{formatCurrency(account.floatingPL, account.currency)}
            </p>
          </div>
        </div>

        {/* Leverage & Margin Level pill */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted mb-4 px-1">
          <span>Leverage: <strong className="text-cyan-300 font-mono">{account.leverage}</strong></span>
          <span>Margin Level: <strong className="text-slate-200 font-mono">{account.marginLevel.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Action Buttons: Trade, Deposit, Withdraw, Transfer */}
      <div className="pt-3 border-t border-subtle flex items-center gap-1.5">
        <button
          onClick={() => openTerminal(account)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
        >
          <CandlestickChart className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Trade</span>
        </button>

        <button
          onClick={() => navigate(`/deposit?account=${account.id}`)}
          className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt text-secondary hover:text-cyan-400 border border-subtle text-xs font-bold transition-colors cursor-pointer"
          title="Deposit funds"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate(`/withdraw?account=${account.id}`)}
          className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt text-secondary hover:text-cyan-400 border border-subtle text-xs font-bold transition-colors cursor-pointer"
          title="Withdraw funds"
        >
          <ArrowUpFromLine className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate(`/transfer?from=${account.id}`)}
          className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt text-secondary hover:text-cyan-400 border border-subtle text-xs font-bold transition-colors cursor-pointer"
          title="Internal transfer"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
