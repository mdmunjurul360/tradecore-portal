import { SupportTicket } from '../../types';
import { apiClient } from '../api/client';

export interface FAQItem {
  id: string;
  category: 'Accounts' | 'Deposits & Withdrawals' | 'Trading & Spreads' | 'Security & KYC';
  question: string;
  answer: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tick-101',
    ticketNumber: 'TC-94821',
    category: 'funding',
    subject: 'Inquiry regarding Tether USDT deposit confirmation speed',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:18:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        senderName: 'Alex Morgan',
        message: 'Hello, how many network confirmations are required for USDT TRC20 deposits to credit to my MT5 account?',
        timestamp: '2026-08-14T10:00:00Z',
      },
      {
        id: 'msg-2',
        sender: 'agent',
        senderName: 'Support Agent Liam',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        message: 'Hello Alex! USDT TRC20 deposits require only 1 network confirmation on the Tron blockchain and credit instantly with 0% fee.',
        timestamp: '2026-08-14T10:12:00Z',
      },
      {
        id: 'msg-3',
        sender: 'user',
        senderName: 'Alex Morgan',
        message: 'Perfect, got it! Thank you for the swift response.',
        timestamp: '2026-08-14T10:18:00Z',
      }
    ]
  },
  {
    id: 'tick-102',
    ticketNumber: 'TC-94890',
    category: 'trading',
    subject: 'Requesting VPS activation for automated trading EA',
    status: 'open',
    priority: 'high',
    createdAt: '2026-08-16T09:30:00Z',
    updatedAt: '2026-08-16T09:30:00Z',
    messages: [
      {
        id: 'msg-10',
        sender: 'user',
        senderName: 'Alex Morgan',
        message: 'Hi TradeCore Team, I meet the $5,000 equity requirement for the free low-latency London VPS. Please assist in provisioning credentials.',
        timestamp: '2026-08-16T09:30:00Z',
      }
    ]
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Deposits & Withdrawals',
    question: 'How fast are deposits and withdrawals processed?',
    answer: 'All crypto (USDT, BTC), credit/debit card, and e-wallet deposits and withdrawals are processed instantly and automatically 24/7. Bank wire transfers typically settle within 1 to 3 business days.'
  },
  {
    id: 'faq-2',
    category: 'Accounts',
    question: 'What is the difference between Pro, Raw Spread, and Standard accounts?',
    answer: 'Standard accounts have zero commissions with tight markups starting from 0.3 pips. Pro accounts offer instant execution with lower spreads. Raw Spread accounts give direct interbank pricing from 0.0 pips with a fixed commission of $3.50 per lot.'
  },
  {
    id: 'faq-3',
    category: 'Trading & Spreads',
    question: 'What maximum leverage is offered on TradeCore accounts?',
    answer: 'TradeCore offers flexible leverage up to 1:Unlimited for qualified accounts during standard market sessions, and up to 1:2000 on major forex and gold pairs.'
  },
  {
    id: 'faq-4',
    category: 'Security & KYC',
    question: 'What documents are required to complete identity verification?',
    answer: 'To fully verify your profile, you need: 1) Proof of Identity (Passport, National ID, or Driving License) and 2) Proof of Address (Utility bill or bank statement issued within the last 3 months).'
  },
  {
    id: 'faq-5',
    category: 'Accounts',
    question: 'Can I change my account leverage after opening it?',
    answer: 'Yes! You can modify your account leverage instantly in your Personal Area at any time under My Accounts > Options > Change Leverage, provided you have sufficient free margin.'
  }
];

class SupportService {
  private tickets: SupportTicket[] = INITIAL_TICKETS;

  public async getTickets(): Promise<SupportTicket[]> {
    const res = await apiClient.mockDelay(this.tickets, 150);
    return res.data;
  }

  public async getTicketById(id: string): Promise<SupportTicket | undefined> {
    return this.tickets.find(t => t.id === id || t.ticketNumber === id);
  }

  public async createTicket(params: {
    category: SupportTicket['category'];
    subject: string;
    message: string;
    priority: SupportTicket['priority'];
  }): Promise<SupportTicket> {
    const randomNum = `TC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      ticketNumber: randomNum,
      category: params.category,
      subject: params.subject,
      status: 'open',
      priority: params.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          senderName: 'Alex Morgan',
          message: params.message,
          timestamp: new Date().toISOString(),
        }
      ]
    };

    this.tickets.unshift(newTicket);
    const res = await apiClient.mockDelay(newTicket, 250);
    return res.data;
  }

  public async replyToTicket(ticketId: string, message: string): Promise<SupportTicket> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.messages.push({
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'Alex Morgan',
      message,
      timestamp: new Date().toISOString(),
    });
    ticket.updatedAt = new Date().toISOString();
    ticket.status = 'open';

    const res = await apiClient.mockDelay(ticket, 200);
    return res.data;
  }
}

export const supportService = new SupportService();
