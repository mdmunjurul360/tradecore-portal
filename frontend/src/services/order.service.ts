import api from '@/lib/api';

export const orderService = {
  createOrder: async (data: { symbol: string; type: 'MARKET' | 'LIMIT' | 'STOP'; side: 'BUY' | 'SELL'; amount: number; price?: number; isCfd?: boolean; stopLoss?: number; takeProfit?: number; }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  
  getOrders: async (params?: { status?: 'OPEN' | 'CLOSED' | 'CANCELLED'; symbol?: string }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  cancelOrder: async (id: string, currentPrice?: number) => {
    const response = await api.delete(`/orders/${id}`, { params: { currentPrice } });
    return response.data;
  },

  getOpenOrders: async (symbol?: string) => {
    const response = await api.get('/orders/open', { params: { pair: symbol } });
    return response.data;
  },

  getOrderHistory: async (symbol?: string) => {
    const response = await api.get('/orders/history', { params: { pair: symbol } });
    return response.data;
  }
};
