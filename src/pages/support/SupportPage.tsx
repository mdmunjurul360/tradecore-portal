import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { supportService, FAQ_ITEMS, FAQItem } from '../../services/mock/supportService';
import { SupportTicket } from '../../types';
import { formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Headphones,
  MessageSquare,
  LifeBuoy,
  Send,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'chat'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // New ticket modal/form
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicket['category']>('trading');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('medium');
  const [newMessage, setNewMessage] = useState('');

  // FAQ search & open state
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  // Live chat messages
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { sender: 'agent', text: 'Hello Alex! Welcome to TradeCore 24/7 VIP Support. How can we assist with your trading today?', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in both subject and description.');
      return;
    }

    try {
      const ticket = await supportService.createTicket({
        category: newCategory,
        subject: newSubject,
        message: newMessage,
        priority: newPriority,
      });

      showToast('success', 'Ticket Submitted', `Ticket #${ticket.ticketNumber} has been received by support.`);
      setNewSubject('');
      setNewMessage('');
      setIsCreatingTicket(false);
      await fetchTickets();
      setSelectedTicket(ticket);
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      const updated = await supportService.replyToTicket(selectedTicket.id, replyMessage.trim());
      setSelectedTicket({ ...updated });
      setReplyMessage('');
      fetchTickets();
      showToast('success', 'Reply Sent', 'Your message has been updated.');
    } catch (err: any) {
      showToast('error', 'Reply Failed', err.message);
    }
  };

  const handleSendLiveChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    const userMsg = { sender: 'user' as const, text: msg, time: 'Just now' };
    setLiveChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate smart support AI / agent reply
    setTimeout(() => {
      let reply = "Thank you for reaching out! Our senior trading desk officer has received your note and will review your account immediately.";
      if (msg.toLowerCase().includes('deposit') || msg.toLowerCase().includes('withdraw')) {
        reply = "Crypto & instant e-wallet transactions are processed automatically in under 60 seconds with 0% network fees.";
      } else if (msg.toLowerCase().includes('leverage') || msg.toLowerCase().includes('margin')) {
        reply = "You can modify your leverage up to 1:Unlimited under My Accounts > Options > Change Leverage at any time.";
      } else if (msg.toLowerCase().includes('vps')) {
        reply = "Our London Equinix LD4 VPS is complimentary for clients with over $5,000 equity. We can provision your login credentials now.";
      }

      setLiveChatMessages(prev => [...prev, { sender: 'agent', text: reply, time: 'Just now' }]);
    }, 1000);
  };

  const filteredFaqs = FAQ_ITEMS.filter(f =>
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>{t('nav.support', 'Support Hub & Desk')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            24/7 dedicated multi-lingual trading desk support, instant tickets, and knowledge center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Desk Online (Avg. 24s reply)</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        {[
          { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
          { id: 'chat', label: '24/7 Live Desk Chat', icon: MessageSquare },
          { id: 'faq', label: 'Knowledge & FAQ', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)] font-extrabold'
                  : 'bg-surface-alt border border-subtle text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Tickets list + create button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-primary dark:text-white">Your Support Tickets</h2>
              <button
                onClick={() => setIsCreatingTicket(!isCreatingTicket)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Ticket</span>
              </button>
            </div>

            {/* Create ticket form */}
            {isCreatingTicket && (
              <form onSubmit={handleCreateTicket} className="p-4 rounded-2xl bg-surface-alt backdrop-blur-xl border border-cyan-500/30 space-y-3 animate-in fade-in">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Open Support Request</h3>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-surface border border-default text-xs text-primary dark:text-white outline-hidden cursor-pointer"
                  >
                    <option value="trading">Trading & Execution</option>
                    <option value="funding">Deposit & Withdrawal</option>
                    <option value="account">Account & KYC</option>
                    <option value="technical">Platform & Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description of the issue..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full p-2 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Message</label>
                  <textarea
                    rows={3}
                    placeholder="Provide full details, order # or transaction reference..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full p-2 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTicket(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-primary dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs shadow-[0_0_10px_rgba(34,211,238,0.3)] cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2">
              {loading ? (
                <div className="p-6 text-center text-xs text-muted">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted bg-surface rounded-2xl border border-subtle">
                  No support tickets found.
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedTicket?.id === t.id
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                        : 'bg-surface border-subtle hover:bg-surface-alt hover:border-default'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-cyan-400">#{t.ticketNumber}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <h4 className="text-xs font-bold text-primary dark:text-white truncate">{t.subject}</h4>
                    <p className="text-[10px] text-muted mt-1 flex items-center justify-between">
                      <span className="capitalize">{t.category}</span>
                      <span>{formatDate(t.updatedAt, 'short')}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected Ticket Conversation */}
          <div className="lg:col-span-2 bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl flex flex-col justify-between min-h-[450px]">
            {selectedTicket ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-subtle">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-cyan-400">#{selectedTicket.ticketNumber}</span>
                        <StatusBadge status={selectedTicket.status} size="sm" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-surface-alt text-secondary">
                          {selectedTicket.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-primary dark:text-white mt-1">{selectedTicket.subject}</h3>
                    </div>
                    <span className="text-xs text-muted font-mono">
                      Opened {formatDate(selectedTicket.createdAt, 'datetime')}
                    </span>
                  </div>

                  {/* Message Thread */}
                  <div className="space-y-3 my-4 max-h-[340px] overflow-y-auto pr-2">
                    {selectedTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-secondary">{m.senderName}</span>
                          <span className="text-[9px] text-muted font-mono">{formatDate(m.timestamp, 'time')}</span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                            m.sender === 'user'
                              ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-primary rounded-tr-none'
                              : 'bg-surface-alt border border-default text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply bar */}
                <div className="pt-3 border-t border-subtle flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply to the desk..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs shadow-[0_0_10px_rgba(34,211,238,0.3)] flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span>Reply</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted">
                <LifeBuoy className="w-10 h-10 stroke-1 text-slate-600 mb-2" />
                <p className="text-xs">Select a ticket from the list or create a new one.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: 24/7 Live Desk Chat */}
      {activeTab === 'chat' && (
        <div className="max-w-3xl mx-auto bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl p-5 flex flex-col h-[520px]">
          
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary dark:text-white">TradeCore VIP Trading Desk</h3>
                <p className="text-[11px] text-emerald-400 font-mono">Live • Latency 0.4ms</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-muted">Institutional Server LD4</span>
            </div>
          </div>

          {/* Chat message stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {liveChatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-muted">{m.sender === 'user' ? 'You' : 'VIP Trading Desk'}</span>
                  <span className="text-[9px] text-slate-600">{m.time}</span>
                </div>
                <div
                  className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-primary dark:text-white rounded-tr-none'
                      : 'bg-surface-alt border border-default text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="pt-3 border-t border-subtle flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about deposits, MT5 credentials, VPS, leverage..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendLiveChat()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50"
            />
            <button
              onClick={handleSendLiveChat}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(34,211,238,0.35)] flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Knowledge Base & FAQ */}
      {activeTab === 'faq' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search knowledge base (e.g. leverage, crypto deposits, spread profiles, KYC)..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface backdrop-blur-xl border border-default text-xs text-primary dark:text-white placeholder-slate-500 outline-hidden focus:border-cyan-500/50 transition-colors shadow-2xl"
            />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-surface backdrop-blur-xl border border-subtle overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-surface-alt transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono block mb-1">
                        {item.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-primary dark:text-white">{item.question}</h4>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-secondary leading-relaxed border-t border-subtle">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
