import api from '@/lib/api';

export interface ReferralStatsResponse {
  referralCode: string;
  stats: {
    totalReferrals: number;
    totalRewards: number;
  };
  history: {
    id: string;
    email: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
  }[];
}

export const referralService = {
  getStats: async (): Promise<ReferralStatsResponse> => {
    const { data } = await api.get('/referrals/stats');
    return data.data;
  },
};
