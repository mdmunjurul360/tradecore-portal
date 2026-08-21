import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MAIN_NAV_ITEMS, NavItem } from '../../config/navigation';
import { FEATURES_CONFIG } from '../../config/features';
import { BrandLogo } from '../common/BrandLogo';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  WalletCards,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ReceiptText,
  Coins,
  History,
  LineChart,
  BarChart2,
  Users2,
  Headphones,
  Gift,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  WalletCards,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ReceiptText,
  Coins,
  ClockHistory: History,
  LineChart,
  BarChart2,
  Users2,
  Headphones,
  Gift,
  Settings,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filteredNavItems = MAIN_NAV_ITEMS.filter(item => {
    if (item.featureFlag && !FEATURES_CONFIG[item.featureFlag]) {
      return false;
    }
    return true;
  });

  const handleNavClick = () => {
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-overlay backdrop-blur-md lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white/90 dark:bg-surface-alt backdrop-blur-xl border-r border-black/8 dark:border-subtle text-slate-700 dark:text-secondary flex flex-col justify-between transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Collapse Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-black/8 dark:border-subtle shrink-0">
          <div
            onClick={() => {
              navigate('/dashboard');
              handleNavClick();
            }}
            className="cursor-pointer overflow-hidden"
          >
            <BrandLogo variant={isCollapsed ? 'icon' : 'full'} />
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-surface-alt"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt border border-transparent hover:border-black/8 dark:hover:border-subtle transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Action button - Open Account / Deposit */}
        {!isCollapsed && (
          <div className="p-3">
            <button
              onClick={() => {
                navigate('/accounts/new');
                handleNavClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('accounts.openNew', 'Open Live Account')}</span>
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {filteredNavItems.map((item: NavItem) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const translatedLabel = t(`nav.${item.id}`, item.label);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-black/5 dark:bg-surface-alt border border-black/10 dark:border-default text-cyan-500 dark:text-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.08)]'
                      : 'text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary hover:bg-black/5 dark:hover:bg-surface-alt border border-transparent'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="shrink-0 relative">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-muted dark:text-muted group-hover:text-cyan-400'}`} />
                      {isActive && isCollapsed && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      )}
                    </div>

                    {!isCollapsed && (
                      <span className="truncate flex-1 font-medium">{translatedLabel}</span>
                    )}

                    {!isCollapsed && (
                      isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                      ) : item.badge ? (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {item.badge}
                        </span>
                      ) : null
                    )}

                    {/* Tooltip for collapsed sidebar */}
                    {isCollapsed && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-2 z-50 px-2.5 py-1.5 bg-white dark:bg-surface text-slate-900 dark:text-primary border border-black/10 dark:border-default text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 backdrop-blur-md">
                        {translatedLabel}
                        {item.badge && ` (${item.badge})`}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Support Hub Banner */}
        <div className="p-3 border-t border-black/8 dark:border-subtle shrink-0">
          {!isCollapsed ? (
            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-surface-alt border border-black/8 dark:border-subtle backdrop-blur-md text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-primary dark:text-white">24/7 Live Desk</span>
                </div>
                <span className="text-[10px] text-cyan-500 dark:text-cyan-400 font-mono">0.4ms</span>
              </div>
              <p className="text-[11px] text-muted dark:text-muted leading-snug">
                Ultra low-latency execution & 24/7 dedicated support.
              </p>
              <button
                onClick={() => {
                  navigate('/support');
                  handleNavClick();
                }}
                className="text-[11px] font-bold text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 dark:hover:text-cyan-300 text-left flex items-center gap-1 group"
              >
                <span>Live Chat Support</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                navigate('/support');
                handleNavClick();
              }}
              className="w-full flex justify-center p-2 rounded-xl text-muted dark:text-muted hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-surface-alt transition-colors"
              title="24/7 Support Desk"
            >
              <Headphones className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
