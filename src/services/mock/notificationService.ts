import { NotificationItem } from '../../types';
import { apiClient } from '../api/client';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Instant Deposit Completed',
    message: 'Your deposit of $5,000.00 USDT has been credited to trading account #8492041.',
    category: 'deposit',
    isRead: false,
    createdAt: '2026-08-15T14:32:00Z',
    actionUrl: '/accounts',
    actionLabel: 'View Account',
  },
  {
    id: 'notif-2',
    title: 'Security Notice: New Login Detected',
    message: 'Successful web login from London, United Kingdom (IP: 82.165.197.1).',
    category: 'security',
    isRead: false,
    createdAt: '2026-08-16T11:45:00Z',
    actionUrl: '/settings?tab=security',
    actionLabel: 'Check Sessions',
  },
  {
    id: 'notif-3',
    title: 'Margin Warning Cleared',
    message: 'Account #9182374 margin level restored to safe parameters (949.05%).',
    category: 'trading',
    isRead: true,
    createdAt: '2026-08-16T10:15:00Z',
    actionUrl: '/accounts',
    actionLabel: 'My Accounts',
  },
  {
    id: 'notif-4',
    title: 'Copy Trading Profit Share',
    message: 'You earned +$384.50 (19.2%) from strategy "Apex Gold Scalper Pro".',
    category: 'account',
    isRead: true,
    createdAt: '2026-08-14T18:00:00Z',
    actionUrl: '/copy-trading',
    actionLabel: 'View Investment',
  },
  {
    id: 'notif-5',
    title: 'KYC Document Verified',
    message: 'Your International Passport proof of identity has been approved.',
    category: 'verification',
    isRead: true,
    createdAt: '2026-08-10T09:20:00Z',
    actionUrl: '/settings?tab=verification',
    actionLabel: 'View Status',
  }
];

class NotificationService {
  private items: NotificationItem[] = INITIAL_NOTIFICATIONS;

  public async getNotifications(): Promise<NotificationItem[]> {
    const res = await apiClient.mockDelay(this.items, 150);
    return res.data;
  }

  public async markAsRead(id: string): Promise<void> {
    const item = this.items.find(n => n.id === id);
    if (item) item.isRead = true;
  }

  public async markAllAsRead(): Promise<void> {
    this.items.forEach(n => (n.isRead = true));
  }

  public async deleteNotification(id: string): Promise<void> {
    this.items = this.items.filter(n => n.id !== id);
  }
}

export const notificationService = new NotificationService();
