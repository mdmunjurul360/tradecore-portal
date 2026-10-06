import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { marketService } from '@/services/market.service';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001/trading';

export function useTradingSocket(symbol: string, interval: string = '15m') {
  const [orderBook, setOrderBook] = useState<{bids: {price: number, quantity: number}[], asks: {price: number, quantity: number}[]}>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<{id: number | string, price: number, quantity: number, side: string, createdAt: string}[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [userOrderUpdate, setUserOrderUpdate] = useState<unknown>(null);
  const [kline, setKline] = useState<{ t: number, o: string, h: string, l: string, c: string } | null>(null);
  const localSocketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

  // Local WebSocket for user orders
  useEffect(() => {
    if (!symbol) return;

    const socket = io(WEBSOCKET_URL, { transports: ['websocket'] });
    localSocketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', symbol);
      if (user?.id) {
        socket.emit('subscribe_user', user.id);
      }
    });

    socket.on('user_order_update', (data) => {
      setUserOrderUpdate(data);
    });

    return () => {
      socket.emit('unsubscribe', symbol);
      socket.disconnect();
    };
  }, [symbol, user?.id]);

  // Public market data
  useEffect(() => {
    if (!symbol) return;
    
    // Check if it's a crypto pair (very naive check based on our structure)
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('BNB');
    const streamSymbol = symbol.toLowerCase().replace('_', '').replace('-', '');

    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let isComponentMounted = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 3;

    // Helper for REST polling (Used for Forex or fallback for Crypto)
    const startRestPolling = () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      
      const fetchMarketData = async () => {
        if (!isComponentMounted) return;
        try {
          const [ob, tr, market, klines] = await Promise.all([
            marketService.getOrderBook(symbol, 20),
            marketService.getRecentTrades(symbol, 50),
            marketService.getSingleMarket(symbol),
            marketService.getKlines(symbol, interval, 1)
          ]);
          
          if (ob && ob.bids) {
            setOrderBook({
              bids: ob.bids.map((b: any) => ({ price: parseFloat(b.price || b[0]), quantity: parseFloat(b.quantity || b[1]) })),
              asks: ob.asks.map((a: any) => ({ price: parseFloat(a.price || a[0]), quantity: parseFloat(a.quantity || a[1]) }))
            });
          }
          if (tr && tr.length > 0) setTrades(tr);
          if (market && market.price) setPrice(market.price);
          if (klines && klines.length > 0) {
            const k = klines[klines.length - 1];
            setKline({ t: k.time, o: k.open.toString(), h: k.high.toString(), l: k.low.toString(), c: k.close.toString() });
          }
        } catch (e) {
          console.error('REST polling failed:', e);
        }
      };

      fetchMarketData();
      fallbackInterval = setInterval(fetchMarketData, 3000);
    };

    if (!isCrypto) {
      // Forex uses mock provider which means we just poll
      startRestPolling();
    } else {
      // Fetch initial trades
      marketService.getRecentTrades(symbol, 50).then((initialTrades) => {
        if (isComponentMounted) setTrades(initialTrades);
      });

      const connectBinance = () => {
        if (!isComponentMounted) return;
        if (reconnectAttempts > MAX_RECONNECT) {
          console.error('Max WS reconnects reached. Falling back to REST.');
          startRestPolling();
          return;
        }

        console.log(`[Binance WS] Connecting to ${streamSymbol}...`);
        const streams = [
          `${streamSymbol}@depth20@100ms`,
          `${streamSymbol}@trade`,
          `${streamSymbol}@ticker`,
          `${streamSymbol}@kline_${interval}`
        ].join('/');
        
        ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        
        ws.onopen = () => {
          console.log(`[Binance WS] Connected & Subscribed to ${streams}`);
          reconnectAttempts = 0; // reset on success
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (!payload.data) return;
            const data = payload.data;
            
            if (data.e === 'trade') {
              setTrades(prev => [{
                id: data.t,
                price: parseFloat(data.p),
                quantity: parseFloat(data.q),
                side: data.m ? 'SELL' : 'BUY',
                createdAt: new Date(data.T).toISOString()
              }, ...prev].slice(0, 50));
            } else if (data.e === '24hrTicker') {
              setPrice(parseFloat(data.c));
            } else if (data.e === 'kline') {
              setKline(data.k);
            } else if (data.lastUpdateId) { 
              setOrderBook({
                bids: data.bids.map((b: string[]) => ({ price: parseFloat(b[0]), quantity: parseFloat(b[1]) })),
                asks: data.asks.map((a: string[]) => ({ price: parseFloat(a[0]), quantity: parseFloat(a[1]) }))
              });
            }
          } catch (err) {
            console.error('[Binance WS] Message parse error:', err);
          }
        };

        ws.onclose = (event) => {
          console.log(`[Binance WS] Disconnected (code: ${event.code}).`);
          if (isComponentMounted) {
            console.log(`[Binance WS] Reconnect attempt ${reconnectAttempts + 1}...`);
            reconnectAttempts++;
            setTimeout(connectBinance, 3000);
          }
        };
        
        ws.onerror = (err) => {
          console.error('[Binance WS] Error:', err);
        };
      };

      connectBinance();
    }

    return () => {
      isComponentMounted = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (ws) {
        ws.onclose = null; // Prevent reconnection on unmount
        ws.close();
      }
    };
  }, [symbol, interval]);

  return { orderBook, trades, price, userOrderUpdate, kline };
}
