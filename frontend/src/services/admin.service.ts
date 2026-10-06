import api from '@/lib/api';

export const adminService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data?.data || response.data;
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data?.data || response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data?.data || response.data;
  },

  // Deposits
  getDeposits: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/deposits', { params });
    return response.data?.data || response.data;
  },

  approveDeposit: async (id: string) => {
    const response = await api.patch(`/admin/deposits/${id}/approve`, {});
    return response.data;
  },

  rejectDeposit: async (id: string) => {
    const response = await api.patch(`/admin/deposits/${id}/reject`, {});
    return response.data;
  },

  // Withdrawals
  getWithdrawals: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/withdrawals', { params });
    return response.data?.data || response.data;
  },

  approveWithdrawal: async (id: string) => {
    const response = await api.patch(`/admin/withdrawals/${id}/approve`, {});
    return response.data;
  },

  rejectWithdrawal: async (id: string) => {
    const response = await api.patch(`/admin/withdrawals/${id}/reject`, {});
    return response.data;
  },

  // KYC
  getKycDocuments: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/kyc', { params });
    return response.data?.data || response.data;
  },

  approveKyc: async (id: string, adminNotes?: string) => {
    const response = await api.patch(`/admin/kyc/${id}/approve`, { adminNotes });
    return response.data;
  },

  rejectKyc: async (id: string, reason: string, adminNotes?: string) => {
    // Note: DTO expects "reason" not "rejectionReason" based on AdminReviewKycDto
    const response = await api.patch(`/admin/kyc/${id}/reject`, { reason, adminNotes });
    return response.data;
  },

  addKycNote: async (id: string, adminNotes: string) => {
    const response = await api.patch(`/admin/kyc/${id}/notes`, { adminNotes });
    return response.data;
  },

  suspendUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}/suspend`);
    return response.data;
  },

  activateUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}/activate`);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  resetPassword: async (id: string, password: string) => {
    const response = await api.patch(`/admin/users/${id}/reset-password`, { password });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data?.data || response.data;
  },

  // Demo Admin
  toggleDemoMode: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/toggle-demo-mode`);
    return response.data;
  },

  resetDemoBalance: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/reset-demo-balance`);
    return response.data;
  },
  
  creditWallet: async (userId: string, currency: string, amount: string) => {
    const response = await api.get(`/admin/users/${userId}/credit/${currency}/${amount}`);
    return response.data;
  },

  debitWallet: async (userId: string, currency: string, amount: string) => {
    const response = await api.get(`/admin/users/${userId}/debit/${currency}/${amount}`);
    return response.data;
  },
};
