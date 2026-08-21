import React from 'react';
import { BRAND_CONFIG } from '../../config/brand';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'full', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Immersive Cyan to Indigo Gradient Icon with Cyan Glow */}
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-cyan-500 to-indigo-600 shadow-[0_0_15px_rgba(34,211,238,0.45)] flex items-center justify-center text-slate-950 font-black shrink-0 border border-default">
        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current text-slate-950 drop-shadow-xs" stroke="none">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 3.2L19.2 8 12 11.6 4.8 8 12 5.2zM4 9.8l7 3.5v7.2l-7-3.5V9.8zm9 10.7v-7.2l7-3.5v7.2l-7 3.5z" />
        </svg>
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tighter text-primary dark:text-white uppercase italic flex items-center leading-none">
            {BRAND_CONFIG.name}
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] ml-1.5"></span>
          </span>
          {variant === 'full' && (
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted mt-1">
              Immersive Terminal
            </span>
          )}
        </div>
      )}
    </div>
  );
};
