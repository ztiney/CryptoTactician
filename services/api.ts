import { Coin } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache mechanism to avoid hitting rate limits too hard
let coinCache: Coin[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const getTopCoins = async (): Promise<Coin[]> => {
  const now = Date.now();
  if (coinCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return coinCache;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`
    );
    if (!response.ok) {
        // If rate limited, return cache if available, else empty
        if(response.status === 429 && coinCache.length > 0) return coinCache;
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    coinCache = data;
    lastFetchTime = now;
    return data;
  } catch (error) {
    console.error("Failed to fetch coins", error);
    return coinCache; // Fallback to cache on error
  }
};

export const searchCoins = async (query: string): Promise<Coin[]> => {
    // Simple client-side search on the cached top 20 coins for demo stability
    // In a real app with backend proxy, we would hit the search endpoint
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    // If cache is empty, try to fetch first
    if (coinCache.length === 0) await getTopCoins();

    return coinCache.filter(c => 
        c.symbol.toLowerCase().includes(lowerQuery) || 
        c.name.toLowerCase().includes(lowerQuery)
    );
}

export const getPrice = async (ids: string[]): Promise<Record<string, number>> => {
    // This is for refreshing specific prices for positions/games
    // To respect rate limits, we might just look up in cache if it was recently updated
    // or do a batch request if really needed. For this demo, we use the cache primarily.
    
    // Force refresh cache if it's old
    await getTopCoins();
    
    const prices: Record<string, number> = {};
    coinCache.forEach(c => {
        if (ids.includes(c.id)) {
            prices[c.id] = c.current_price;
        }
    });
    return prices;
}
