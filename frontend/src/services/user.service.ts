import api from '@/lib/api';

export const userService = {
  updateProfile: async (profileData: Record<string, unknown>) => {
    const { data } = await api.patch('/users/me', profileData);
    return data.data || data;
  },
  
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data.data || data;
  },

  toggleDemoMode: async () => {
    const { data } = await api.patch('/users/me/demo-mode');
    return data.data || data;
  }
};
