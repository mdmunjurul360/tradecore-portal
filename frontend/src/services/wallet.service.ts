import api from '@/lib/api';

export const walletService = {
  getWallets: async () => {
    const response = await api.get('/wallet');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.data && Array.isArray(data.data) ? data.data : (data ? [data] : []);
  },
  
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    const response = await api.get('/wallet/history', { params });
    return response.data;
  },

  getDeposits: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/wallet/history', { params: { ...params, type: 'DEPOSIT' } });
    return response.data;
  },

  getWithdrawals: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/wallet/history', { params: { ...params, type: 'WITHDRAWAL' } });
    return response.data;
  },

  createWithdrawal: async (data: { amount: number; currency: string; destination: string; network?: string; symbol?: string }) => {
    const response = await api.post('/wallet/withdraw', {
      ...data,
      symbol: data.symbol || data.currency,
    });
    return response.data;
  },

  getAddress: async (symbol: string, network?: string) => {
    const response = await api.get(`/wallet/address/${symbol}`, { params: network ? { network } : {} });
    const data = response.data;
    // Handle wrapped response from TransformInterceptor
    return data?.data || data;
  },

  getNetworks: async () => {
    const response = await api.get('/wallet/networks');
    const data = response.data;
    return data?.data || data;
  },

  transfer: async (data: { currency: string; amount: number; from: string; to: string }) => {
    const response = await api.post('/wallet/transfer', data);
    return response.data;
  },
};
