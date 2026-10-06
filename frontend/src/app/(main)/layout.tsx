'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, LayoutDashboard, Wallet, ArrowRightLeft, Activity, Briefcase, Settings, ShieldAlert, Users } from 'lucide-react';
// Force Turbopack chunk invalidation
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, updateUser, logout } = useAuthStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isTogglingDemo, setIsTogglingDemo] = useState(false);

  const handleToggleDemo = async () => {
    setIsTogglingDemo(true);
    try {
      const res = await userService.toggleDemoMode();
      const currentUser = useAuthStore.getState().user;
      updateUser({ ...currentUser!, demoModeEnabled: res.demoModeEnabled });
      queryClient.invalidateQueries();
    } catch (error) {
      console.error(error);
    } finally {
      setIsTogglingDemo(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Accounts', href: '/wallet', icon: Wallet },
    { name: 'Trade Terminal', href: '/trading', icon: ArrowRightLeft },
    { name: 'Market Watch', href: '/markets', icon: Activity },
    { name: 'Transaction History', href: '/wallet?tab=history', icon: Briefcase },
    { name: 'Referrals', href: '/referrals', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.roles?.includes('ADMIN')) {
    navigation.push({ name: 'Admin', href: '/admin', icon: ShieldAlert });
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && !user.roles?.includes('ADMIN')) {
      document.body.classList.add('hide-dev-tools');
    } else {
      document.body.classList.remove('hide-dev-tools');
    }
    return () => document.body.classList.remove('hide-dev-tools');
  }, [user]);

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">TradeCore</h2>
          <button className="lg:hidden p-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              {navigation.find((item) => pathname.startsWith(item.href))?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 mr-2 border p-1.5 rounded-lg bg-card shadow-sm hidden sm:flex">
              <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${!user?.demoModeEnabled ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Live</span>
              <button 
                onClick={handleToggleDemo}
                disabled={isTogglingDemo}
                className={`w-10 h-5 rounded-full relative transition-colors ${user?.demoModeEnabled ? 'bg-yellow-500' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${user?.demoModeEnabled ? 'translate-x-5' : ''}`} />
              </button>
              <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${user?.demoModeEnabled ? 'bg-yellow-500 text-black' : 'text-muted-foreground'}`}>Demo</span>
            </div>
            <ThemeToggle />
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>

              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
