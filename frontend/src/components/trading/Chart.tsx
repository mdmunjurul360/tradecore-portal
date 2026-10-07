import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, ISeriesApi, Time } from 'lightweight-charts';
import { marketService } from '@/services/market.service';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ChartProps {
  symbol: string;
  kline: { t: number, o: string, h: string, l: string, c: string } | null;
  interval: string;
  onIntervalChange: (interval: string) => void;
}

const INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

export function TradingChart({ symbol, kline, interval, onIntervalChange }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.parentElement?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const lastCandleTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' },
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3, // LineStyle.Dashed
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3, // LineStyle.Dashed
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    marketService.getKlines(symbol, interval, 100).then((data) => {
      let formattedData = (data as any[]).map((d: { time: number | string | Date, open: number, high: number, low: number, close: number }) => {
        const timestamp = new Date(d.time).getTime();
        return {
          time: Math.floor(timestamp / 1000) as Time,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close),
        };
      });

      // Sort by time ascending
      formattedData.sort((a, b) => (a.time as number) - (b.time as number));
      
      // Remove duplicates (data is sorted, so compare with previous)
      formattedData = formattedData.filter((v, i, a) => i === 0 || a[i - 1].time !== v.time);
      
      if (formattedData.length > 0) {
        lastCandleTimeRef.current = formattedData[formattedData.length - 1].time as number;
        candlestickSeries.setData(formattedData);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, interval]);

  useEffect(() => {
    if (kline && candlestickSeriesRef.current) {
      const timestamp = new Date(kline.t).getTime();
      const newTime = Math.floor(timestamp / 1000);
      
      if (newTime >= lastCandleTimeRef.current) {
        try {
          candlestickSeriesRef.current.update({
            time: newTime as Time,
            open: parseFloat(kline.o.toString()),
            high: parseFloat(kline.h.toString()),
            low: parseFloat(kline.l.toString()),
            close: parseFloat(kline.c.toString()),
          });
          lastCandleTimeRef.current = newTime;
        } catch (e) {
          console.warn('Lightweight charts update error suppressed:', e);
        }
      }
    }
  }, [kline]);

  return (
    <div className="w-full h-full bg-[#09090b] rounded border relative flex flex-col group">
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-[#09090b] to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto bg-[#18181b]/90 backdrop-blur-sm p-1.5 rounded-md border border-muted/20 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <span className="font-bold text-foreground">{symbol.replace('_', '')}</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Spread: 1.2</span>
          </div>
          
          <div className="h-4 w-[1px] bg-border mx-1" />
          
          <div className="flex space-x-1">
            {INTERVALS.map((int) => (
              <button
                key={int}
                onClick={() => onIntervalChange(int)}
                className={`px-2 py-1 text-xs font-semibold rounded-sm transition-colors ${
                  interval === int ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {int.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-1 pointer-events-auto bg-[#18181b]/90 backdrop-blur-sm p-1 rounded-md border border-muted/20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-sm transition-colors"
            title="Refresh Chart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button 
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-sm transition-colors"
            title="Crosshair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-sm transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="w-full flex-1 min-h-[400px]" />
    </div>
  );
}
