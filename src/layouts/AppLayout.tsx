import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNavigation } from '../components/layout/MobileNavigation';
import { WebTerminalModal } from '../components/terminal/WebTerminalModal';
import { AccountDetailsModal } from '../components/accounts/AccountDetailsModal';
import { ChangeLeverageModal } from '../components/accounts/ChangeLeverageModal';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-primary flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-700 dark:selection:text-cyan-200 overflow-x-hidden">
      
      {/* Ambient Radial Glow — decorative, subtle in light, vibrant in dark */}
      <div className="fixed inset-0 opacity-50 pointer-events-none z-0 dark:opacity-50 opacity-30"
           style={{ background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, transparent 60%)' }} />

      <div className="relative z-10 flex flex-1">
        {/* Collapsible / Responsive Glass Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-6">
          <Header
            isSidebarOpen={!isSidebarCollapsed}
            onToggleSidebar={() => setIsOpenMobile(!isOpenMobile)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Sticky Navigation */}
      <MobileNavigation />

      {/* Global Interactive Modals */}
      <WebTerminalModal />
      <AccountDetailsModal />
      <ChangeLeverageModal />

    </div>
  );
};
