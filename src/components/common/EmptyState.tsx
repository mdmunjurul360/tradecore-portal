import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-default', className)}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-primary dark:text-white tracking-tight">{title}</h3>
      <p className="text-sm text-muted dark:text-muted max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
