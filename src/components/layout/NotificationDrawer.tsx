import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/mock/notificationService';
import { formatDate } from '../../utils/formatters';
import {
  X,
  CheckCheck,
  Bell,
  ArrowDownToLine,
  ShieldAlert,
  TrendingUp,
  Award,
  Trash2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onUpdateCount,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    const list = await notificationService.getNotifications();
    setNotifications(list);
    onUpdateCount?.(list.filter(n => !n.isRead).length);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    await fetchNotifs();
    showToast('success', 'All notifications marked as read');
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await fetchNotifs();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    await fetchNotifs();
  };

  const handleAction = (notif: NotificationItem) => {
    handleMarkRead(notif.id);
    onClose();
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  if (!isOpen) return null;

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'deposit':
      case 'withdrawal':
        return <ArrowDownToLine className="w-4 h-4 text-emerald-400" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'trading':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default:
        return <Award className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-surface dark:bg-slate-950/70 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-white/95 dark:bg-overlay border-l border-black/10 dark:border-default h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 backdrop-blur-2xl">
        <div className="p-4 sm:p-5 border-b border-black/8 dark:border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-primary dark:text-white flex items-center gap-1.5">
                <span>Notifications</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h3>
              <p className="text-xs text-muted dark:text-muted">
                {unreadCount > 0 ? `${unreadCount} unread platform alerts` : 'All alerts up to date'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-surface-alt transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 px-4 border-b border-black/8 dark:border-subtle overflow-x-auto">
          {['all', 'unread', 'deposit', 'trading', 'security'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1 rounded-xl font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'bg-black/5 dark:bg-surface-alt border border-black/8 dark:border-subtle text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-primary dark:hover:text-white hover:bg-black/8 dark:hover:bg-surface-alt'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-subtle">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted">Loading alerts...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Bell className="w-10 h-10 text-muted dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-secondary">No notifications found</p>
              <p className="text-xs text-muted dark:text-muted mt-1">Real-time alerts for executions, margin calls, and transfers appear here.</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleAction(notif)}
                className={`p-4 hover:bg-black/5 dark:hover:bg-surface-alt cursor-pointer transition-colors flex items-start gap-3.5 relative group ${
                  !notif.isRead ? 'bg-cyan-500/5' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-surface-alt border border-black/8 dark:border-subtle flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-primary dark:text-white truncate">
                      {notif.title}
                    </p>
                    <span className="text-[10px] font-mono text-muted dark:text-muted shrink-0 ml-2">
                      {formatDate(notif.createdAt, 'short')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-secondary leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  {notif.actionLabel && (
                    <span className="inline-block mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300">
                      {notif.actionLabel} →
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="p-1 text-muted hover:text-rose-400 rounded-lg hover:bg-surface-alt"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!notif.isRead && (
                  <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
