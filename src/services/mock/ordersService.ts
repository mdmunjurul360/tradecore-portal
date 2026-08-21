import { OrderPosition } from '../../types';
import { apiClient } from '../api/client';

const INITIAL_ORDERS: OrderPosition[] = [
  {
    id: 'ord-101',
    ticket: '98402105',
    accountId: 'acc-1',
    accountNumber: '8492041',
    symbol: 'EURUSD',
    type: 'BUY',
    status: 'open',
    volume: 1.50,
    openPrice: 1.08240,
    currentPrice: 1.08415,
    stopLoss: 1.07900,
    takeProfit: 1.08900,
    swap: -3.20,
    commission: 0.00,
    profit: 262.50,
    openTime: '2026-08-16T08:14:20Z',
  },
  {
    id: 'ord-102',
    ticket: '98402188',
    accountId: 'acc-1',
    accountNumber: '8492041',
    symbol: 'XAUUSD',
    type: 'BUY',
    status: 'open',
    volume: 0.50,
    openPrice: 2428.50,
    currentPrice: 2431.20,
    stopLoss: 2415.00,
    takeProfit: 2450.00,
    swap: -1.50,
    commission: 0.00,
    profit: 135.00,
    openTime: '2026-08-16T10:02:11Z',
  },
  {
    id: 'ord-103',
    ticket: '98402240',
    accountId: 'acc-2',
    accountNumber: '5920381',
    symbol: 'GBPUSD',
    type: 'SELL',
    status: 'open',
    volume: 0.80,
    openPrice: 1.29450,
    currentPrice: 1.29520,
    stopLoss: 1.30000,
    takeProfit: 1.28800,
    swap: 0.80,
    commission: 0.00,
    profit: -56.00,
    openTime: '2026-08-16T06:45:00Z',
  },
  {
    id: 'ord-104',
    ticket: '98402301',
    accountId: 'acc-3',
    accountNumber: '9182374',
    symbol: 'BTCUSD',
    type: 'BUY',
    status: 'open',
    volume: 0.20,
    openPrice: 67850.00,
    currentPrice: 68420.00,
    stopLoss: 66000.00,
    takeProfit: 71000.00,
    swap: -8.40,
    commission: -3.50,
    profit: 114.00,
    openTime: '2026-08-16T04:20:10Z',
  },
  // Pending
  {
    id: 'ord-201',
    ticket: '98403190',
    accountId: 'acc-1',
    accountNumber: '8492041',
    symbol: 'US30',
    type: 'BUY',
    status: 'pending',
    volume: 1.00,
    openPrice: 39800.00,
    currentPrice: 40050.00,
    stopLoss: 39500.00,
    takeProfit: 40500.00,
    swap: 0.00,
    commission: 0.00,
    profit: 0.00,
    openTime: '2026-08-16T09:00:00Z',
  },
  // Closed history
  {
    id: 'ord-301',
    ticket: '98399120',
    accountId: 'acc-1',
    accountNumber: '8492041',
    symbol: 'USDJPY',
    type: 'SELL',
    status: 'closed',
    volume: 2.00,
    openPrice: 156.400,
    currentPrice: 155.820,
    closePrice: 155.820,
    swap: 4.10,
    commission: 0.00,
    profit: 745.20,
    openTime: '2026-08-15T10:11:00Z',
    closeTime: '2026-08-15T16:30:00Z',
  },
  {
    id: 'ord-302',
    ticket: '98399155',
    accountId: 'acc-1',
    accountNumber: '8492041',
    symbol: 'XAUUSD',
    type: 'BUY',
    status: 'closed',
    volume: 1.00,
    openPrice: 2412.00,
    currentPrice: 2426.50,
    closePrice: 2426.50,
    swap: -2.10,
    commission: 0.00,
    profit: 1450.00,
    openTime: '2026-08-14T13:20:00Z',
    closeTime: '2026-08-14T18:45:00Z',
  },
  {
    id: 'ord-303',
    ticket: '98399190',
    accountId: 'acc-2',
    accountNumber: '5920381',
    symbol: 'EURUSD',
    type: 'BUY',
    status: 'closed',
    volume: 1.00,
    openPrice: 1.08600,
    currentPrice: 1.08320,
    closePrice: 1.08320,
    swap: -1.10,
    commission: 0.00,
    profit: -280.00,
    openTime: '2026-08-13T09:00:00Z',
    closeTime: '2026-08-13T14:15:00Z',
  }
];

class OrdersService {
  private orders: OrderPosition[] = INITIAL_ORDERS;

  public async getOrders(status?: 'open' | 'pending' | 'closed', accountId?: string): Promise<OrderPosition[]> {
    let list = [...this.orders];
    if (status) {
      list = list.filter(o => o.status === status);
    }
    if (accountId && accountId !== 'all') {
      list = list.filter(o => o.accountId === accountId || o.accountNumber === accountId);
    }
    const res = await apiClient.mockDelay(list, 150);
    return res.data;
  }

  public async closePosition(orderId: string): Promise<OrderPosition> {
    const ord = this.orders.find(o => o.id === orderId);
    if (!ord) throw new Error('Order not found');

    ord.status = 'closed';
    ord.closePrice = ord.currentPrice;
    ord.closeTime = new Date().toISOString();

    const res = await apiClient.mockDelay(ord, 200);
    return res.data;
  }

  public closeOrder = this.closePosition;
}

export const ordersService = new OrdersService();
