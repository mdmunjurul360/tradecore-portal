import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { accountService } from '../../services/mock/accountService';
import { formatCurrency } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { AppsMenu } from './AppsMenu';
import { NotificationDrawer } from './NotificationDrawer';
import {
  Bell,
  LayoutGrid,
  Globe,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  CandlestickChart,
  Menu,
  Check,
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, switchUserRole } = useAuth();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const { openTerminal } = useModal();

  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const accounts = await accountService.getAccounts('real');
      const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
      setTotalBalance(sum);
    };
    fetchBalance();

    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangItem = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-alt backdrop-blur-xl border-b border-black/8 dark:border-subtle transition-colors shadow-sm dark:shadow-none">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* Left section: Mobile menu toggle + Brand or Page Context */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors"
              aria-label="Toggle sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="lg:hidden">
              <BrandLogo variant="compact" />
            </div>

            {/* Quick Live Web Terminal Launcher CTA on desktop */}
            <button
              onClick={() => openTerminal()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] cursor-pointer"
            >
              <CandlestickChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('header.quickTerminal', 'Web Terminal')}</span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-cyan-400 text-slate-950 rounded shadow-[0_0_8px_rgba(34,211,238,0.8)]">Live</span>
            </button>
          </div>

          {/* Right section: Balance pill, Theme, Language, Apps, Notifs, Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Total Balance Snapshot */}
            <div
              onClick={() => navigate('/accounts')}
              className="cursor-pointer hidden sm:flex flex-col items-end px-3.5 py-1 rounded-xl bg-black/5 dark:bg-surface-alt border border-black/8 dark:border-subtle hover:border-cyan-500/30 hover:bg-black/8 dark:hover:bg-surface-alt transition-all mr-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted">
                  {t('header.totalBalance', 'Real Balance')}
                </span>
              </div>
              <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-primary dark:text-white tracking-tight">
                {formatCurrency(totalBalance, 'USD')}
              </span>
            </div>

            {/* Theme Switcher — 3-mode: Light / Dark / System */}
            <ThemeToggle variant="compact" />

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 p-2 rounded-xl text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt border border-transparent hover:border-black/8 dark:hover:border-subtle transition-colors text-xs font-semibold cursor-pointer"
                title="Select Language"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline uppercase font-mono">{currentLangItem.code}</span>
                <span className="text-sm">{currentLangItem.flag}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-overlay border border-black/10 dark:border-default rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                  <div className="px-3 py-1.5 border-b border-black/5 dark:border-subtle text-[10px] uppercase font-bold tracking-wider text-muted dark:text-muted">
                    Language / Idioma
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.nativeLabel}</span>
                      </div>
                      {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Apps Menu Launcher Button */}
            <button
              onClick={() => setIsAppsOpen(true)}
              className="p-2 rounded-xl text-muted dark:text-muted hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-surface-alt border border-transparent hover:border-black/8 dark:hover:border-subtle transition-colors cursor-pointer"
              title="TradeCore Suite Apps & Tools"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setIsNotifsOpen(true)}
              className="relative p-2 rounded-xl text-muted dark:text-muted hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-surface-alt border border-transparent hover:border-black/8 dark:hover:border-subtle transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>

            {/* User Profile Menu */}
            <div className="relative ml-1" ref={profileRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-alt border border-transparent hover:border-subtle transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 border border-default flex items-center justify-center text-xs font-black text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                  {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || 'M'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-primary dark:text-white leading-tight">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.tier || 'VIP'} Verified
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-overlay border border-black/10 dark:border-default rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                  <div className="px-4 py-3 border-b border-black/5 dark:border-subtle">
                    <p className="text-xs font-bold text-slate-900 dark:text-primary dark:text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-muted dark:text-muted truncate mt-0.5 font-mono">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {user?.tier} Member
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        KYC {user?.kycStatus?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/settings?tab=profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors"
                    >
                      <User className="w-4 h-4 text-muted dark:text-muted" />
                      Profile & Personal Details
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings?tab=verification');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-muted dark:text-muted" />
                      Account Verification (KYC)
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings?tab=security');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-muted dark:text-muted" />
                      Security & 2FA Setup
                    </button>
                  </div>

                  {/* KYC Role Demo Toggle for easy testing */}
                  <div className="px-4 py-2 border-t border-b border-black/5 dark:border-subtle bg-black/3 dark:bg-surface-alt">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted mb-1.5">
                      Demo KYC Simulator
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => switchUserRole('verified')}
                        className={`text-[10px] py-1 rounded font-bold cursor-pointer transition-all ${
                          user?.kycStatus === 'verified' ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-surface-alt text-muted hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        Verified
                      </button>
                      <button
                        onClick={() => switchUserRole('pending')}
                        className={`text-[10px] py-1 rounded font-bold cursor-pointer transition-all ${
                          user?.kycStatus === 'pending' ? 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-surface-alt text-muted hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => switchUserRole('unverified')}
                        className={`text-[10px] py-1 rounded font-bold cursor-pointer transition-all ${
                          user?.kycStatus === 'unverified' ? 'bg-rose-500 text-primary dark:text-white' : 'bg-surface-alt text-muted hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        Unverified
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of TradeCore
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Apps Launcher Drawer */}
      <AppsMenu isOpen={isAppsOpen} onClose={() => setIsAppsOpen(false)} />

      {/* Notifications Flyout Drawer */}
      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        onUpdateCount={(count) => setUnreadCount(count)}
      />
    </>
  );
};
