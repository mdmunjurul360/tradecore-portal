import api from '@/lib/api';

export const dashboardService = {
  getOverview: async () => {
    // In a real production system, this might be a single aggregate endpoint.
    // For now, we will fetch from individual APIs and aggregate on the client to get it working immediately.
    const [balanceRes, ordersRes, portfolioRes, marketRes, txRes] = await Promise.allSettled([
      api.get('/wallet/balance'),
      api.get('/orders', { params: { status: 'OPEN' } }),
      api.get('/portfolio'),
      api.get('/trading-pairs'),
      api.get('/transactions', { params: { limit: 5 } }),
    ]);

    return {
      balance: balanceRes.status === 'fulfilled' && Array.isArray(balanceRes.value.data) 
        ? { total: balanceRes.value.data.reduce((sum: number, w: any) => sum + Number(w.balance), 0), change: 0 } 
        : { total: 0, change: 0 },
      orders: ordersRes.status === 'fulfilled' ? ordersRes.value.data : { items: [], total: 0 },
      portfolio: portfolioRes.status === 'fulfilled' ? portfolioRes.value.data : { value: 0, pnl: 0 },
      markets: marketRes.status === 'fulfilled' ? marketRes.value.data : { items: [] },
      transactions: txRes.status === 'fulfilled' ? txRes.value.data : { items: [] },
    };
  }
};
