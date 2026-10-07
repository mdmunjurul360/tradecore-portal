import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import { SUPPORTED_COINS, marketService } from '@/services/market.service';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES = ['Favorites', 'Forex Majors', 'Metals', 'Indices', 'Commodities'];

export function MarketSelector({ currentSymbol }: { currentSymbol: string }) {
  const [activeTab, setActiveTab] = useState('Forex Majors');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();

  // Load state from local storage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('market_selector_tab');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedTab) setActiveTab(savedTab);
    
    const savedFavs = localStorage.getItem('market_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (_) {
        // ignore
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('market_selector_tab', tab);
  };

  const { data: markets } = useQuery({
    queryKey: ['live-markets'],
    queryFn: () => marketService.getLiveMarkets(),
    refetchInterval: 5000,
  });

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem('market_favorites', JSON.stringify(next));
      return next;
    });
  };

  let displayedCoins = SUPPORTED_COINS.filter(c => c.type !== 'Crypto');
  if (activeTab === 'Favorites') {
    displayedCoins = SUPPORTED_COINS.filter(c => favorites.includes(c.symbol));
  } else if (activeTab === 'Forex Majors') {
    displayedCoins = displayedCoins.filter(c => ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'USDCHF', 'USDCAD', 'NZDUSD', 'EURJPY'].includes(c.symbol));
  } else if (activeTab === 'Metals') {
    displayedCoins = displayedCoins.filter(c => c.base === 'XAU' || c.base === 'XAG');
  } else if (activeTab === 'Indices') {
    displayedCoins = displayedCoins.filter(c => ['US30', 'NAS100', 'SPX500', 'GER40'].includes(c.symbol));
  } else if (activeTab === 'Commodities') {
    displayedCoins = displayedCoins.filter(c => ['WTI', 'BRENT', 'NATGAS'].includes(c.symbol));
  }

  if (search) {
    displayedCoins = SUPPORTED_COINS.filter(c => c.symbol.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));
  }

  return (
    <div className="flex flex-col h-full bg-card rounded border overflow-hidden min-h-[300px] lg:min-h-0 text-xs">
      <div className="p-2 border-b bg-muted/30">
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-muted/50 border-transparent focus-visible:ring-1"
          />
        </div>
      </div>
      
      <div className="flex overflow-x-auto border-b bg-muted/10 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleTabChange(cat)}
            className={`px-3 py-1.5 font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === cat ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex px-2 py-1 text-muted-foreground font-medium bg-muted/20 border-b">
        <span className="flex-1">Symbol</span>
        <span className="w-16 text-right">Bid</span>
        <span className="w-12 text-right">Chg%</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayedCoins.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No markets found.</div>
        ) : (
          displayedCoins.map(coin => {
            const isFav = favorites.includes(coin.symbol);
            const isActive = coin.symbol === currentSymbol || `${coin.symbol}USDT` === currentSymbol;
            const marketData = markets?.find(m => m.symbol === coin.base || m.symbol === coin.symbol);
            const price = marketData?.price ? marketData.price.toFixed(marketData.price < 10 ? 4 : 2) : '--';
            const change = marketData?.change24h ? marketData.change24h.toFixed(2) : '--';
            const isPositive = marketData?.change24h ? marketData.change24h >= 0 : true;

            return (
              <div 
                key={coin.symbol} 
                onClick={() => router.push(`/trading/${coin.symbol}`)}
                className={`flex items-center px-2 py-1.5 cursor-pointer hover:bg-muted/50 ${isActive ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-center flex-1 space-x-1.5 overflow-hidden">
                  <button onClick={(e) => toggleFavorite(e, coin.symbol)} className="text-muted-foreground hover:text-yellow-500 shrink-0">
                    <Star className={`h-3 w-3 ${isFav ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </button>
                  <span className="font-semibold truncate" title={coin.name}>{coin.symbol}</span>
                </div>
                <span className={`w-16 text-right font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{price}</span>
                <span className={`w-12 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
