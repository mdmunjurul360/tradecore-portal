import api from '@/lib/api';

export interface ReferralHistoryItem {
  id: string;
  email: string;
  status: string;
  active?: boolean;
  rewardAmount: number;
  createdAt: string;
}

export interface ReferralStatsResponse {
  referralCode: string;
  stats: {
    totalReferrals: number;
    activeReferrals?: number;
    totalRewards: number;
    pendingRewards?: number;
  };
  history: ReferralHistoryItem[];
  earnings?: ReferralHistoryItem[];
}

export interface ReferralValidationResponse {
  valid: boolean;
  code?: string;
  referrer?: string;
}

// The API wraps every response in `{ data }` (TransformInterceptor) and these controllers add
// their own `{ success, data }` envelope, so unwrap until we reach the payload.
function unwrap<T>(body: unknown): T {
  let cur = body as { data?: unknown; success?: boolean } | undefined;
  while (cur && typeof cur === 'object' && 'data' in cur && cur.data !== undefined) {
    cur = cur.data as typeof cur;
  }
  return cur as T;
}

export const referralService = {
  getStats: async (): Promise<ReferralStatsResponse> => {
    const { data } = await api.get('/referrals/stats');
    return unwrap<ReferralStatsResponse>(data);
  },

  validateCode: async (code: string): Promise<ReferralValidationResponse> => {
    const { data } = await api.get(`/referrals/validate/${encodeURIComponent(code)}`);
    return unwrap<ReferralValidationResponse>(data);
  },
};
