'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from 'cn';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  ReceiptText,
  Gift,
  Wallet,
  BarChart3,
  DollarSign,
  Activity,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const MENU_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Trading Accounts', href: '/admin?tab=trading-accounts', icon: Briefcase },
      { name: 'Deposits', href: '/admin?tab=deposits', icon: ArrowDownToLine },
      { name: 'Withdrawals', href: '/admin?tab=withdrawals', icon: ArrowUpFromLine },
      { name: 'KYC', href: '/admin?tab=kyc', icon: ShieldCheck },
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Transactions', href: '/admin?tab=transactions', icon: ReceiptText },
      { name: 'Referral', href: '/admin?tab=referral', icon: Gift },
      { name: 'Wallets', href: '/admin?tab=wallets', icon: Wallet },
    ]
  },
  {
    title: 'Reports',
    items: [
      { name: 'Analytics', href: '/admin?tab=analytics', icon: BarChart3 },
      { name: 'Revenue', href: '/admin?tab=revenue', icon: DollarSign },
      { name: 'Activity Logs', href: '/admin?tab=audit', icon: Activity },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/admin?tab=settings', icon: Settings },
      { name: 'Roles & Permissions', href: '/admin?tab=roles', icon: ShieldAlert },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin' && !searchParams.get('tab')) {
      return true;
    }
    if (href.includes('?tab=')) {
      const tabName = href.split('?tab=')[1];
      return searchParams.get('tab') === tabName;
    }
    return pathname === href;
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#222]">
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#222]">
        {!isCollapsed && (
          <span className="text-xl font-bold text-yellow-500 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Broker Admin
          </span>
        )}
        {isCollapsed && (
          <ShieldAlert className="w-6 h-6 text-yellow-500 mx-auto" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block text-zinc-400 hover:text-white transition"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[#333]">
        {MENU_GROUPS.map((group, i) => (
          <div key={i} className="mb-6">
            {!isCollapsed && (
              <h4 className="px-4 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {group.title}
              </h4>
            )}
            <ul className="space-y-1 px-2">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        active 
                          ? "bg-yellow-500/10 text-yellow-500 font-medium" 
                          : "text-zinc-400 hover:bg-[#222] hover:text-zinc-100",
                        isCollapsed && "justify-center px-0"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={cn("w-4 h-4", active ? "text-yellow-500" : "text-zinc-400")} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-[#222]">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#222] hover:text-zinc-100 transition-all duration-200",
            isCollapsed && "justify-center px-0"
          )}
          title={isCollapsed ? "Back to App" : undefined}
        >
          <ChevronLeft className="w-4 h-4" />
          {!isCollapsed && <span>Back to App</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#111111] text-yellow-500 rounded-md border border-[#222]"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-[#111111] animate-in slide-in-from-left duration-200">
            <button 
              className="absolute top-4 right-4 text-zinc-400"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:block h-full transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {renderSidebarContent()}
      </div>
    </>
  );
}
