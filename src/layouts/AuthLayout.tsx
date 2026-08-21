import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { Shield, Lock, Award, Headphones } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-500">
      
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-default/80 bg-surface/40 backdrop-blur-md">
        <Link to="/dashboard">
          <BrandLogo variant="full" />
        </Link>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted">
          <span className="hidden sm:inline">{BRAND_CONFIG.supportEmail}</span>
          <Link to="/support" className="text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5" />
            Support
          </Link>
        </div>
      </header>

      {/* Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="py-6 px-6 border-t border-default bg-overlay text-center text-xs text-muted">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-3 text-muted font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Bank-Grade 256-Bit SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Segregated Client Funds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-400" />
            <span>FCA & CySEC Regulated</span>
          </div>
        </div>
        <p className="text-[11px] text-muted max-w-xl mx-auto leading-relaxed">
          {BRAND_CONFIG.regulatoryInfo}. Risk Warning: CFDs and margin trading involve high risk of capital loss.
        </p>
      </footer>

    </div>
  );
};
