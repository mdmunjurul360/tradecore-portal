import React from 'react';
import { cn } from '../../utils/cn';

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white dark:bg-surface border border-slate-200/80 dark:border-default rounded-xl p-5 animate-pulse', className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="h-7 w-36 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
    <div className="h-8 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-default rounded-xl overflow-hidden animate-pulse">
    <div className="border-b border-slate-200 dark:border-default p-4 bg-slate-50 dark:bg-surface flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1" />
      ))}
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={cn('w-full bg-white dark:bg-surface border border-slate-200/80 dark:border-default rounded-xl p-5 animate-pulse flex flex-col justify-between', height)}>
    <div className="flex justify-between items-center mb-4">
      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="flex-1 bg-slate-100 dark:bg-slate-800/40 rounded flex items-end p-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 dark:bg-slate-700/60 rounded-t"
          style={{ height: `${Math.max(20, Math.sin(i) * 60 + 40)}%` }}
        />
      ))}
    </div>
  </div>
);
