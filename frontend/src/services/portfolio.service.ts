import api from '@/lib/api';

export const portfolioService = {
  getPortfolio: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/portfolio', { params });
    return data;
  },
  
  getSummary: async () => {
    const { data } = await api.get('/portfolio/summary');
    return data;
  },
  
  getByAsset: async (asset: string) => {
    const { data } = await api.get(`/portfolio/${asset}`);
    return data;
  }
};
