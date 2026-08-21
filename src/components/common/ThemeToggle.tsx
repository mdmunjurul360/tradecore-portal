import React, { useRef, useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../types';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark',  label: 'Dark',  Icon: Moon },
  { mode: 'system', label: 'System', Icon: Monitor },
];

interface ThemeToggleProps {
  /** compact = icon-only button with dropdown; expanded = inline pill selector */
  variant?: 'compact' | 'expanded';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact' }) => {
  const { theme, isDark, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const CurrentIcon = isDark ? Moon : Sun;
  const currentLabel = THEME_OPTIONS.find(o => o.mode === theme)?.label || 'Dark';

  if (variant === 'expanded') {
    // Inline pill selector (used in Settings page etc.)
    return (
      <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-surface-alt border border-black/10 dark:border-subtle">
        {THEME_OPTIONS.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            title={`${label} mode`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              theme === mode
                ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Compact: icon button + dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 rounded-xl text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt border border-transparent hover:border-subtle transition-colors cursor-pointer"
        title={`Theme: ${currentLabel}`}
        aria-label={`Current theme: ${currentLabel}. Click to change.`}
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-4 h-4 text-cyan-400 dark:text-cyan-400" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 bg-white/95 dark:bg-overlay border border-black/10 dark:border-default rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
        >
          <div className="px-3 py-1.5 border-b border-black/5 dark:border-subtle text-[10px] uppercase font-bold tracking-wider text-muted dark:text-muted">
            Appearance
          </div>
          {THEME_OPTIONS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              role="menuitem"
              onClick={() => { setTheme(mode); setIsOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-surface-alt transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
              {theme === mode && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
