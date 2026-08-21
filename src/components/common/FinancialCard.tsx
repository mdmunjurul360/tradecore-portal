import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FinancialCardProps {
  label: string;
  value: string;
  subtitle?: string;
  change?: number; // percentage change
  changeText?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'accent' | 'success' | 'danger';
  sparklineData?: number[];
  className?: string;
  onClick?: () => void;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({
  label,
  value,
  subtitle,
  change,
  changeText,
  icon: Icon,
  variant = 'default',
  sparklineData,
  className = '',
  onClick,
}) => {
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 bg-white/80 dark:bg-surface backdrop-blur-xl border-black/8 dark:border-subtle hover:border-cyan-500/30 shadow-sm dark:shadow-xs hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]',
        onClick && 'cursor-pointer hover:bg-white/90 dark:hover:bg-surface-alt active:scale-[0.99]',
        variant === 'accent' && 'border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-[inset_0_0_15px_rgba(34,211,238,0.08)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted dark:text-muted">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-surface-alt text-cyan-500 dark:text-cyan-400 border border-black/8 dark:border-subtle flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-primary dark:text-white font-mono tracking-tight">
          {value}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-lg border font-mono',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 inline" />
              )}
              {isPositive ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          )}
          {(changeText || subtitle) && (
            <span className="text-xs text-muted dark:text-muted">
              {changeText || subtitle}
            </span>
          )}
        </div>

        {/* Minimal SVG Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-6">
            <svg viewBox="0 0 60 20" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={isPositive ? '#34d399' : '#f43f5e'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklineData
                  .map((val, idx) => {
                    const min = Math.min(...sparklineData);
                    const max = Math.max(...sparklineData);
                    const range = max - min || 1;
                    const x = (idx / (sparklineData.length - 1)) * 60;
                    const y = 18 - ((val - min) / range) * 16;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
