import React, { useState, useEffect } from 'react';
import { EconomicEvent, MarketNews } from '../../types';
import { analyticsService } from '../../services/mock/analyticsService';
import { formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Newspaper,
  Calculator,
  Flame,
  Globe,
  TrendingUp,
  Search,
  Scale
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'calendar' | 'news' | 'calculator'>('calendar');
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [impactFilter, setImpactFilter] = useState<string>('all');

  // Pip Calculator state
  const [calcSymbol, setCalcSymbol] = useState('EURUSD');
  const [calcLots, setCalcLots] = useState(1.0);
  const [calcLeverage, setCalcLeverage] = useState(500);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [evts, nw] = await Promise.all([
        analyticsService.getEconomicCalendar(),
        analyticsService.getMarketNews(),
      ]);
      setEvents(evts);
      setNews(nw);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredEvents = events.filter(e => impactFilter === 'all' || e.impact === impactFilter);

  // Calculations
  const pipValue = +(calcLots * (calcSymbol === 'EURUSD' || calcSymbol === 'GBPUSD' ? 10 : 1)).toFixed(2);
  const requiredMargin = +((calcLots * 100000) / calcLeverage).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Market Intelligence & Trading Calculators</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Real-time economic calendar, global macroeconomic wire, pip value & margin calculators.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        {[
          { id: 'calendar', label: 'Economic Calendar', icon: Calendar },
          { id: 'news', label: 'Market News & Wire', icon: Newspaper },
          { id: 'calculator', label: 'Margin & Pip Calculator', icon: Calculator },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                  : 'text-muted hover:bg-surface-alt hover:text-primary dark:hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Economic Calendar */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface backdrop-blur-xl p-3 rounded-2xl border border-subtle shadow-2xl">
            <span className="text-xs font-bold text-secondary">Filter by Volatility:</span>
            <div className="flex items-center gap-2">
              {['all', 'high', 'medium', 'low'].map(imp => (
                <button
                  key={imp}
                  onClick={() => setImpactFilter(imp)}
                  className={`text-xs px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    impactFilter === imp
                      ? 'bg-gradient-to-r from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-surface-alt border border-subtle text-muted hover:text-primary dark:hover:text-white'
                  }`}
                >
                  {imp}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-overlay text-muted font-bold uppercase tracking-wider text-[10px] border-b border-subtle">
                <tr>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Cur</th>
                  <th className="p-3.5">Impact</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Actual</th>
                  <th className="p-3.5">Forecast</th>
                  <th className="p-3.5">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-secondary font-mono">
                {filteredEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-surface-alt transition-colors">
                    <td className="p-3.5">{evt.time}</td>
                    <td className="p-3.5 font-bold font-sans text-primary dark:text-white">{evt.currency}</td>
                    <td className="p-3.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        evt.impact === 'high'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : evt.impact === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/20 text-muted border border-default'
                      }`}>
                        {evt.impact}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans font-bold text-primary dark:text-white">{evt.event}</td>
                    <td className="p-3.5 font-bold text-emerald-400">{evt.actual || '-'}</td>
                    <td className="p-3.5 text-secondary">{evt.forecast || '-'}</td>
                    <td className="p-3.5 text-muted">{evt.previous || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Market News */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map(n => (
            <div
              key={n.id}
              className="p-5 rounded-2xl bg-surface backdrop-blur-xl border border-subtle shadow-2xl hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                    {n.category}
                  </span>
                  <span className="text-[11px] text-muted">{formatDate(n.publishedAt, 'short')}</span>
                </div>
                <h3 className="text-sm font-bold text-primary dark:text-white leading-snug">
                  {n.title}
                </h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  {n.summary}
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-subtle flex items-center justify-between text-xs">
                <span className="text-muted">Source: {n.source}</span>
                <span className="font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer">Read Full Report →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Margin & Pip Calculator */}
      {activeTab === 'calculator' && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl space-y-6">
          <h3 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
            <span>Forex Pip Value & Required Margin Calculator</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Symbol</label>
              <select
                value={calcSymbol}
                onChange={e => setCalcSymbol(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                <option value="EURUSD">EURUSD</option>
                <option value="GBPUSD">GBPUSD</option>
                <option value="USDJPY">USDJPY</option>
                <option value="XAUUSD">XAUUSD (Gold)</option>
                <option value="BTCUSD">BTCUSD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Lot Size</label>
              <input
                type="number"
                step="0.01"
                value={calcLots}
                onChange={e => setCalcLots(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs font-bold font-mono text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Account Leverage</label>
              <select
                value={calcLeverage}
                onChange={e => setCalcLeverage(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                <option value={100}>1:100</option>
                <option value={200}>1:200</option>
                <option value={500}>1:500</option>
                <option value={1000}>1:1000</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-alt border border-subtle font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted font-sans">Pip Value (1 Pip)</span>
              <p className="text-xl font-black text-cyan-400 font-mono">${pipValue} USD</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted font-sans">Required Margin</span>
              <p className="text-xl font-black text-primary dark:text-white font-mono">${requiredMargin} USD</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
