import { ReferralUser } from '../../types';
import { apiClient } from '../api/client';

export interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionUSD: number;
  pendingCommissionUSD: number;
  currentTier: 'Silver Partner' | 'Gold Partner' | 'Platinum IB' | 'Diamond Master';
  tierCashbackPerLot: number;
}

const INITIAL_REFERRALS: ReferralUser[] = [
  {
    id: 'ref-1',
    clientName: 'David K. (ID 84902)',
    joinedDate: '2026-07-12T14:20:00Z',
    country: 'United Kingdom',
    status: 'active',
    tradedVolumeLots: 42.50,
    commissionEarned: 297.50,
  },
  {
    id: 'ref-2',
    clientName: 'Santiago M. (ID 59301)',
    joinedDate: '2026-07-28T09:15:00Z',
    country: 'Spain',
    status: 'active',
    tradedVolumeLots: 28.00,
    commissionEarned: 196.00,
  },
  {
    id: 'ref-3',
    clientName: 'Tariq A. (ID 91823)',
    joinedDate: '2026-08-02T11:45:00Z',
    country: 'UAE',
    status: 'active',
    tradedVolumeLots: 64.20,
    commissionEarned: 449.40,
  },
  {
    id: 'ref-4',
    clientName: 'Nguyen V. (ID 30491)',
    joinedDate: '2026-08-10T16:00:00Z',
    country: 'Vietnam',
    status: 'inactive',
    tradedVolumeLots: 0.00,
    commissionEarned: 0.00,
  }
];

class ReferralService {
  private summary: ReferralSummary = {
    referralCode: 'TRADECORE-VIP-849',
    referralLink: 'https://tradecore.io/register?ref=VIP-849',
    totalReferrals: 18,
    activeReferrals: 14,
    totalCommissionUSD: 3420.80,
    pendingCommissionUSD: 412.50,
    currentTier: 'Platinum IB',
    tierCashbackPerLot: 7.00,
  };

  public async getSummary(): Promise<ReferralSummary> {
    const res = await apiClient.mockDelay(this.summary, 150);
    return res.data;
  }

  public async getReferralData() {
    const referrals = [
      {
        id: 'ref-1',
        name: 'David K.',
        email: 'd***k@gmail.com',
        registeredAt: '2026-07-12T14:20:00Z',
        volumeLots: 42.50,
        commissionEarned: 297.50,
      },
      {
        id: 'ref-2',
        name: 'Santiago M.',
        email: 's***m@outlook.com',
        registeredAt: '2026-07-28T09:15:00Z',
        volumeLots: 28.00,
        commissionEarned: 196.00,
      },
      {
        id: 'ref-3',
        name: 'Tariq A.',
        email: 't***a@tradehub.ae',
        registeredAt: '2026-08-02T11:45:00Z',
        volumeLots: 64.20,
        commissionEarned: 449.40,
      },
      {
        id: 'ref-4',
        name: 'Nguyen V.',
        email: 'n***v@fintech.vn',
        registeredAt: '2026-08-10T16:00:00Z',
        volumeLots: 12.00,
        commissionEarned: 84.00,
      }
    ];

    const data = {
      tier: 'Platinum IB',
      referralCode: this.summary.referralCode,
      referralLink: this.summary.referralLink,
      totalReferred: 18,
      totalEarned: 3420.80,
      thisMonthEarned: 1026.90,
      referrals,
    };

    const res = await apiClient.mockDelay(data, 150);
    return res.data;
  }

  public async getReferralsList(): Promise<ReferralUser[]> {
    const res = await apiClient.mockDelay(INITIAL_REFERRALS, 150);
    return res.data;
  }
}

export const referralService = new ReferralService();
