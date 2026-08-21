import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  WalletCards,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText
} from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const { t } = useLanguage();

  const mobileLinks = [
    { id: 'dashboard', path: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'accounts', path: '/accounts', label: t('nav.accounts', 'Accounts'), icon: WalletCards },
    { id: 'deposit', path: '/deposit', label: t('nav.deposit', 'Deposit'), icon: ArrowDownToLine, isAccent: true },
    { id: 'withdraw', path: '/withdraw', label: t('nav.withdrawal', 'Withdraw'), icon: ArrowUpFromLine },
    { id: 'transactions', path: '/transactions', label: t('nav.transactions', 'History'), icon: ReceiptText },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-overlay backdrop-blur-xl border-t border-black/8 dark:border-subtle px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {mobileLinks.map(link => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.id}
            to={link.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                link.isAccent
                  ? 'text-cyan-400'
                  : isActive
                  ? 'text-cyan-400'
                  : 'text-muted hover:text-primary dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-all ${
                    link.isAccent
                      ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      : isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                      : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${link.isAccent ? 'text-slate-950 stroke-[2.5]' : ''}`} />
                </div>
                <span className="mt-0.5 tracking-tight truncate max-w-[64px] font-medium">{link.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
