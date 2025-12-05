import { Coin } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache mechanism to avoid hitting rate limits too hard
let coinCache: Coin[] = [];
let lastFetchTime = 0;
// Increased cache duration to 60s to handle larger data set safely
const CACHE_DURATION = 60000; 

export const getTopCoins = async (): Promise<Coin[]> => {
  const now = Date.now();
  if (coinCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return coinCache;
  }

  try {
    // Increased per_page from 20 to 250 to cover most altcoins
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    );
    if (!response.ok) {
        // If rate limited (429), return cache if available
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
    // Client-side search on the cached top 250 coins
    // This avoids hitting the /search endpoint which has stricter rate limits
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