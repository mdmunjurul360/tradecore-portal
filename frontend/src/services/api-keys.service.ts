import api from '@/lib/api';

export const apiKeysService = {
  createApiKey: async (data: { name: string }) => {
    const response = await api.post('/api-keys', data);
    return response.data;
  },
  
  getApiKeys: async () => {
    const response = await api.get('/api-keys');
    return response.data;
  },

  deleteApiKey: async (id: string) => {
    const response = await api.delete(`/api-keys/${id}`);
    return response.data;
  }
};
