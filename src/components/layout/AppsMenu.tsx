import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUICK_APPS } from '../../config/navigation';
import {
  CandlestickChart,
  Monitor,
  Layers,
  Calendar,
  Calculator,
  Server,
  ShieldCheck,
  BookOpen,
  X,
  ExternalLink
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

interface AppsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  CandlestickChart,
  Monitor,
  Layers,
  Calendar,
  Calculator,
  Server,
  ShieldCheck,
  BookOpen,
};

export const AppsMenu: React.FC<AppsMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { openTerminal } = useModal();
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAppClick = (app: typeof QUICK_APPS[0]) => {
    onClose();
    if (app.type === 'internal_terminal') {
      openTerminal();
    } else if (app.type === 'download') {
      showToast('info', 'Download Client', `Downloading ${app.name} installer package...`);
    } else if (app.path) {
      navigate(app.path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:justify-center pt-16 px-4 bg-surface dark:bg-slate-950/70 backdrop-blur-md">
      <div
        ref={menuRef}
        className="w-full max-w-2xl bg-white/95 dark:bg-overlay border border-black/10 dark:border-default rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/8 dark:border-subtle">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-primary dark:text-white tracking-tight flex items-center gap-2">
              <span>TradeCore Suite & Platform Ecosystem</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>
            <p className="text-xs text-muted dark:text-muted mt-0.5">
              Direct access to institutional terminals, low-latency execution engines, and analytics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-surface-alt transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
          {QUICK_APPS.map((app) => {
            const Icon = ICON_MAP[app.icon] || CandlestickChart;
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-black/8 dark:border-subtle bg-black/5 dark:bg-surface-alt hover:border-cyan-500/40 hover:bg-black/8 dark:hover:bg-surface-alt hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-indigo-600 group-hover:text-slate-950 group-hover:border-transparent group-hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-primary dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors">
                      {app.name}
                    </span>
                    {app.type === 'download' && (
                      <ExternalLink className="w-3 h-3 text-muted inline" />
                    )}
                  </div>
                  <p className="text-xs text-muted dark:text-muted mt-0.5 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
