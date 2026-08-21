import { UserProfile, SecuritySession } from '../../types';
import { apiClient } from '../api/client';

export const INITIAL_USER: UserProfile = {
  id: 'usr-94821',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@tradecore-trader.com',
  phone: '+44 7700 900482',
  country: 'United Kingdom',
  city: 'London',
  address: '45 Canary Wharf, High Street',
  zipCode: 'E14 5AB',
  dateOfBirth: '1989-04-18',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  tier: 'VIP',
  kycStatus: 'verified',
  identityVerified: true,
  addressVerified: true,
  phoneVerified: true,
  twoFactorEnabled: true,
  twoFactorMethod: 'app',
  createdAt: '2025-10-15T08:30:00Z',
};

export const INITIAL_SESSIONS: SecuritySession[] = [
  {
    id: 'sess-1',
    device: 'MacBook Pro 16" (macOS)',
    browser: 'Chrome 128.0',
    ipAddress: '82.165.197.1',
    location: 'London, United Kingdom',
    lastActive: 'Active now',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    device: 'iPhone 15 Pro (iOS 17.5)',
    browser: 'TradeCore Mobile App',
    ipAddress: '82.165.197.1',
    location: 'London, United Kingdom',
    lastActive: '3 hours ago',
    isCurrent: false,
  },
  {
    id: 'sess-3',
    device: 'Windows 11 Workstation',
    browser: 'Firefox 129.0',
    ipAddress: '194.223.10.45',
    location: 'Frankfurt, Germany',
    lastActive: '2 days ago',
    isCurrent: false,
  }
];

class AuthService {
  private user: UserProfile = INITIAL_USER;
  private sessions: SecuritySession[] = INITIAL_SESSIONS;

  public async getCurrentUser(): Promise<UserProfile> {
    const res = await apiClient.mockDelay(this.user, 150);
    return res.data;
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    this.user = { ...this.user, ...updates };
    const res = await apiClient.mockDelay(this.user, 250);
    return res.data;
  }

  public async getSessions(): Promise<SecuritySession[]> {
    const res = await apiClient.mockDelay(this.sessions, 150);
    return res.data;
  }

  public getActiveSessions = this.getSessions;

  public async changePassword(_currentPass: string, _newPass: string): Promise<boolean> {
    const res = await apiClient.mockDelay(true, 250);
    return res.data;
  }

  public async terminateSession(id: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  public async terminateAllOtherSessions(): Promise<void> {
    this.sessions = this.sessions.filter(s => s.isCurrent);
  }
}

export const authService = new AuthService();
