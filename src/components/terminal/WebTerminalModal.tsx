import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Layers,
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';

interface SimulatedCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const INSTRUMENTS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', bid: 1.08412, ask: 1.08415, digits: 5, spread: 0.3 },
  { symbol: 'XAUUSD', name: 'Gold Spot / USD', bid: 2431.20, ask: 2431.45, digits: 2, spread: 0.25 },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', bid: 68420.00, ask: 68425.00, digits: 2, spread: 5.0 },
  { symbol: 'GBPUSD', name: 'British Pound / USD', bid: 1.29518, ask: 1.29522, digits: 5, spread: 0.4 },
  { symbol: 'US30', name: 'Wall Street 30', bid: 40050.00, ask: 40052.50, digits: 2, spread: 2.5 },
];

export const WebTerminalModal: React.FC = () => {
  const { isTerminalOpen, activeTerminalAccount, closeTerminal } = useModal();
  const { showToast } = useToast();

  const [selectedSymbol, setSelectedSymbol] = useState(INSTRUMENTS[0]);
  const [lotSize, setLotSize] = useState<number>(0.10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1' | 'D1'>('M15');
  const [currentBid, setCurrentBid] = useState(selectedSymbol.bid);
  const [currentAsk, setCurrentAsk] = useState(selectedSymbol.ask);

  const [openPositions, setOpenPositions] = useState<any[]>([
    {
      id: 'term-pos-1',
      ticket: '9920194',
      symbol: 'EURUSD',
      type: 'BUY',
      volume: 0.50,
      openPrice: 1.08390,
      currentPrice: 1.08415,
      profit: 12.50,
    }
  ]);

  // Live price tick simulation
  useEffect(() => {
    if (!isTerminalOpen) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.49) * (selectedSymbol.symbol === 'BTCUSD' ? 15 : selectedSymbol.symbol === 'XAUUSD' ? 0.4 : 0.00015);
      const newBid = +(currentBid + delta).toFixed(selectedSymbol.digits);
      const newAsk = +(newBid + (selectedSymbol.spread * (selectedSymbol.digits === 5 ? 0.0001 : 1))).toFixed(selectedSymbol.digits);
      setCurrentBid(newBid);
      setCurrentAsk(newAsk);

      // Update active profit
      setOpenPositions(prev =>
        prev.map(p => {
          if (p.symbol === selectedSymbol.symbol) {
            const diff = p.type === 'BUY' ? newBid - p.openPrice : p.openPrice - newAsk;
            const multiplier = p.symbol === 'EURUSD' ? 100000 : p.symbol === 'XAUUSD' ? 100 : 1;
            const profit = +(diff * p.volume * multiplier).toFixed(2);
            return { ...p, currentPrice: newBid, profit };
          }
          return p;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isTerminalOpen, selectedSymbol, currentBid, currentAsk]);

  if (!isTerminalOpen) return null;

  const handleExecuteOrder = (side: 'BUY' | 'SELL') => {
    const price = side === 'BUY' ? currentAsk : currentBid;
    const newPos = {
      id: `term-pos-${Date.now()}`,
      ticket: `${Math.floor(9000000 + Math.random() * 999999)}`,
      symbol: selectedSymbol.symbol,
      type: side,
      volume: lotSize,
      openPrice: price,
      currentPrice: price,
      profit: 0.00,
    };
    setOpenPositions([newPos, ...openPositions]);
    showToast('success', `${side} Order Executed`, `${lotSize} lots ${selectedSymbol.symbol} @ ${price}`);
  };

  const handleClosePosition = (id: string) => {
    const pos = openPositions.find(p => p.id === id);
    if (!pos) return;
    setOpenPositions(openPositions.filter(p => p.id !== id));
    showToast('info', 'Position Closed', `Closed #${pos.ticket} with P&L: ${formatCurrency(pos.profit, 'USD')}`);
  };

  // Generate realistic SVG candlesticks
  const candles: SimulatedCandle[] = Array.from({ length: 30 }).map((_, i) => {
    const base = selectedSymbol.bid;
    const offset = Math.sin(i / 3) * (selectedSymbol.symbol === 'BTCUSD' ? 300 : selectedSymbol.symbol === 'XAUUSD' ? 8 : 0.002);
    const open = +(base + offset + (Math.random() - 0.5) * 0.001).toFixed(selectedSymbol.digits);
    const close = +(open + (Math.random() - 0.48) * 0.0015).toFixed(selectedSymbol.digits);
    const high = +(Math.max(open, close) + Math.random() * 0.001).toFixed(selectedSymbol.digits);
    const low = +(Math.min(open, close) - Math.random() * 0.001).toFixed(selectedSymbol.digits);
    return { time: `12:${(i * 2).toString().padStart(2, '0')}`, open, high, low, close };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-overlay backdrop-blur-md">
      <div
        className={`bg-surface border border-default rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[88vh]'
        }`}
      >
        {/* Terminal Top Bar */}
        <div className="h-12 px-4 bg-surface border-b border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-primary dark:text-white tracking-wide uppercase">TradeCore Web Terminal</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Account:</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                #{activeTerminalAccount?.accountNumber || '8492041'} ({activeTerminalAccount?.server || 'TradeCore-Real01'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-muted hover:text-primary dark:hover:text-white rounded-lg hover:bg-slate-800"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={closeTerminal}
              className="p-1.5 text-muted hover:text-primary dark:hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Watchlist Sidebar */}
          <div className="w-full lg:w-56 bg-slate-900/60 border-r border-default flex flex-col shrink-0">
            <div className="p-2.5 border-b border-default text-[11px] font-bold text-muted uppercase tracking-wider">
              Market Watch
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {INSTRUMENTS.map((inst) => (
                <div
                  key={inst.symbol}
                  onClick={() => {
                    setSelectedSymbol(inst);
                    setCurrentBid(inst.bid);
                    setCurrentAsk(inst.ask);
                  }}
                  className={`p-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    selectedSymbol.symbol === inst.symbol ? 'bg-amber-500/10 border-l-2 border-amber-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <p className="font-bold text-primary dark:text-white">{inst.symbol}</p>
                    <p className="text-[10px] text-muted">{inst.name.split('/')[0]}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-slate-200">{inst.bid.toFixed(inst.digits)}</p>
                    <span className="text-[10px] text-muted">Spr: {inst.spread}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Chart Area */}
          <div className="flex-1 flex flex-col bg-surface min-h-0 border-b lg:border-b-0 border-default">
            
            {/* Chart Toolbar */}
            <div className="h-10 px-3 bg-slate-900/40 border-b border-default flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary dark:text-white text-sm">{selectedSymbol.symbol}</span>
                <span className="text-[11px] text-muted">Live Tick Feed</span>
                <div className="flex items-center gap-1 ml-3">
                  {(['M1', 'M5', 'M15', 'H1', 'D1'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        timeframe === tf ? 'bg-amber-500 text-slate-950' : 'hover:bg-slate-800 text-muted'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-rose-400 font-bold">BID: {currentBid.toFixed(selectedSymbol.digits)}</span>
                <span className="text-emerald-400 font-bold">ASK: {currentAsk.toFixed(selectedSymbol.digits)}</span>
              </div>
            </div>

            {/* SVG Interactive Chart Canvas */}
            <div className="flex-1 relative p-4 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 800 320" className="w-full h-full overflow-visible">
                {/* Horizontal Gridlines */}
                {[60, 120, 180, 240].map((y, idx) => (
                  <line key={idx} x1="0" y1={y} x2="800" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                ))}

                {/* Candlesticks */}
                {candles.map((c, i) => {
                  const x = 30 + i * 25;
                  const isUp = c.close >= c.open;
                  const color = isUp ? '#10b981' : '#ef4444';
                  const highY = 280 - ((c.high - (selectedSymbol.bid - 0.01)) / 0.02) * 240;
                  const lowY = 280 - ((c.low - (selectedSymbol.bid - 0.01)) / 0.02) * 240;
                  const openY = 280 - ((c.open - (selectedSymbol.bid - 0.01)) / 0.02) * 240;
                  const closeY = 280 - ((c.close - (selectedSymbol.bid - 0.01)) / 0.02) * 240;
                  const bodyY = Math.min(openY, closeY);
                  const bodyHeight = Math.max(3, Math.abs(closeY - openY));

                  return (
                    <g key={i}>
                      {/* Wick */}
                      <line x1={x + 6} y1={highY} x2={x + 6} y2={lowY} stroke={color} strokeWidth="1.5" />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyY}
                        width="12"
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Positions Panel */}
            <div className="h-44 bg-slate-900/80 border-t border-default flex flex-col shrink-0">
              <div className="px-3 py-1.5 border-b border-default flex items-center justify-between text-[11px] font-bold text-muted">
                <span>Active Positions ({openPositions.length})</span>
                <span className="font-mono text-emerald-400">
                  Total Floating: +${openPositions.reduce((s, p) => s + p.profit, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-alt text-muted text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Ticket</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Volume</th>
                      <th className="p-2">Open</th>
                      <th className="p-2">Current</th>
                      <th className="p-2">P&L ($)</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {openPositions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-800/30">
                        <td className="p-2 text-muted">#{pos.ticket}</td>
                        <td className="p-2 font-bold text-primary dark:text-white">{pos.symbol}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {pos.type}
                          </span>
                        </td>
                        <td className="p-2">{pos.volume.toFixed(2)}</td>
                        <td className="p-2">{pos.openPrice}</td>
                        <td className="p-2">{pos.currentPrice}</td>
                        <td className={`p-2 font-bold ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Order Ticket */}
          <div className="w-full lg:w-72 bg-surface border-l border-default p-4 flex flex-col justify-between shrink-0">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                New Order Execution
              </h4>

              {/* Volume / Lot Size */}
              <div className="mb-4">
                <label className="block text-xs text-muted mb-1 font-semibold">Volume (Lots)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLotSize(Math.max(0.01, +(lotSize - 0.05).toFixed(2)))}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-primary dark:text-white font-bold text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                    className="flex-1 text-center font-mono font-bold text-primary dark:text-white bg-surface border border-slate-700 rounded-lg py-1.5 text-sm"
                  />
                  <button
                    onClick={() => setLotSize(+(lotSize + 0.05).toFixed(2))}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-primary dark:text-white font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stop Loss / Take Profit */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-[10px] uppercase text-muted mb-1 font-bold">Stop Loss</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full bg-surface border border-slate-700 rounded-lg p-1.5 text-xs text-primary dark:text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted mb-1 font-bold">Take Profit</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full bg-surface border border-slate-700 rounded-lg p-1.5 text-xs text-primary dark:text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Buy / Sell Buttons */}
            <div className="space-y-2 pt-4 border-t border-default">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExecuteOrder('SELL')}
                  className="py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-primary dark:text-white font-black text-xs flex flex-col items-center justify-center shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
                >
                  <span className="uppercase tracking-wider">SELL</span>
                  <span className="font-mono text-sm mt-0.5">{currentBid.toFixed(selectedSymbol.digits)}</span>
                </button>

                <button
                  onClick={() => handleExecuteOrder('BUY')}
                  className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-primary dark:text-white font-black text-xs flex flex-col items-center justify-center shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
                >
                  <span className="uppercase tracking-wider">BUY</span>
                  <span className="font-mono text-sm mt-0.5">{currentAsk.toFixed(selectedSymbol.digits)}</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-muted pt-1">
                One-Click Instant Execution • 0% Slippage Target
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
