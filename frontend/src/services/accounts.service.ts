import api from '@/lib/api';

export interface TradingAccountDto {
  id: string;
  accountNumber: string;
  name: string;
  type: 'DEMO' | 'LIVE';
  accountClass: 'STANDARD' | 'PRO';
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number | null;
  status: 'ACTIVE' | 'ARCHIVED';
  isArchived: boolean;
  isBound: boolean;
  isCurrent: boolean;
  createdAt: string;
}

const unwrap = <T,>(data: any): T => (data && data.data !== undefined ? data.data : data);

export const accountsService = {
  list: async (): Promise<TradingAccountDto[]> => {
    const { data } = await api.get('/accounts');
    const res = unwrap<TradingAccountDto[]>(data);
    return Array.isArray(res) ? res : [];
  },
  create: async (body: { type: 'DEMO' | 'LIVE'; accountClass: 'STANDARD' | 'PRO'; leverage: number; name?: string }) => {
    const { data } = await api.post('/accounts', body);
    return unwrap<TradingAccountDto>(data);
  },
  rename: async (id: string, name: string) => {
    const { data } = await api.patch(`/accounts/${id}/rename`, { name });
    return unwrap<TradingAccountDto>(data);
  },
  archive: async (id: string) => {
    const { data } = await api.patch(`/accounts/${id}/archive`);
    return unwrap<TradingAccountDto>(data);
  },
  restore: async (id: string) => {
    const { data } = await api.patch(`/accounts/${id}/restore`);
    return unwrap<TradingAccountDto>(data);
  },
  switch: async (id: string): Promise<{ demoModeEnabled: boolean; account: TradingAccountDto }> => {
    const { data } = await api.post(`/accounts/${id}/switch`);
    return unwrap(data);
  },
  transfer: async (body: { fromAccountId: string; toAccountId: string; amount: number }) => {
    const { data } = await api.post('/accounts/transfer', body);
    return unwrap<{ success: boolean; message: string }>(data);
  },
};

export const getApiError = (err: any, fallback = 'Request failed') =>
  err?.response?.data?.message
    ? Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message
    : err?.response?.data?.error || err?.message || fallback;
