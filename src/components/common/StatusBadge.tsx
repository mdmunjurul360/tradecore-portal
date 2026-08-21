import React from 'react';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  variant?: 'solid' | 'subtle' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-surface-alt text-secondary border-default';
  let dotGlow = 'bg-slate-400';

  if (['completed', 'real', 'active', 'verified', 'buy', 'open', 'resolved', 'success'].includes(normalized)) {
    colorClasses = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    dotGlow = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
  } else if (['processing', 'pending', 'pending_agent', 'pending_user'].includes(normalized)) {
    colorClasses = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    dotGlow = 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]';
  } else if (['failed', 'rejected', 'sell', 'urgent', 'closed'].includes(normalized)) {
    colorClasses = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    dotGlow = 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
  } else if (['demo', 'info', 'medium'].includes(normalized)) {
    colorClasses = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    dotGlow = 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]';
  } else if (['archived', 'inactive', 'unverified', 'low'].includes(normalized)) {
    colorClasses = 'bg-surface-alt text-muted border-subtle';
    dotGlow = 'bg-slate-500';
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium capitalize rounded-lg border whitespace-nowrap tracking-wide select-none backdrop-blur-xs font-mono',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', dotGlow)} />
      {status}
    </span>
  );
};
