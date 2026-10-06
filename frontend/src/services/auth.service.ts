import api from '@/lib/api';

export const authService = {
  login: async (credentials: Record<string, unknown>) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: Record<string, unknown>) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  logout: async () => {
    // Optionally call a backend logout endpoint if it exists
    // await api.post('/auth/logout');
  },

  refreshToken: async (token: string) => {
    const { data } = await api.post('/auth/refresh', { refreshToken: token });
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },

  generate2FA: async (userId: string, email: string) => {
    const { data } = await api.post('/auth/2fa/generate', { userId, email });
    return data;
  },

  enable2FA: async (userId: string, code: string) => {
    const { data } = await api.post('/auth/2fa/enable', { userId, code });
    return data;
  },

  disable2FA: async (userId: string, code: string) => {
    const { data } = await api.post('/auth/2fa/disable', { userId, code });
    return data;
  },
};
