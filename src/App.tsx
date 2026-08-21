/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ModalProvider } from './context/ModalContext';

import { AppLayout } from './layouts/AppLayout';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { OpenAccountPage } from './pages/accounts/OpenAccountPage';
import { DepositPage } from './pages/deposit/DepositPage';
import { WithdrawalPage } from './pages/withdrawal/WithdrawalPage';
import { TransferPage } from './pages/transfer/TransferPage';
import { TransactionsPage } from './pages/transactions/TransactionsPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { CopyTradingPage } from './pages/copy-trading/CopyTradingPage';
import { WalletPage } from './pages/wallet/WalletPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { ReferralsPage } from './pages/referrals/ReferralsPage';
import { SupportPage } from './pages/support/SupportPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    
                    {/* Accounts */}
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="accounts/new" element={<OpenAccountPage />} />
                    <Route path="accounts/open" element={<OpenAccountPage />} />

                    {/* Financial Operations */}
                    <Route path="deposit" element={<DepositPage />} />
                    <Route path="withdraw" element={<WithdrawalPage />} />
                    <Route path="withdrawal" element={<WithdrawalPage />} />
                    <Route path="transfer" element={<TransferPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="wallet" element={<WalletPage />} />

                    {/* Trading & Performance */}
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="performance" element={<PerformancePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="copy-trading" element={<CopyTradingPage />} />

                    {/* Support, Referrals & Settings */}
                    <Route path="referrals" element={<ReferralsPage />} />
                    <Route path="support" element={<SupportPage />} />
                    <Route path="settings" element={<SettingsPage />} />

                    {/* Catch all fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ModalProvider>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

