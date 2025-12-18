import { Coin } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Static fallback data in case the API is unreachable or rate-limited
const FALLBACK_COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 95000, price_change_percentage_24h: 1.5, image: '' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2700, price_change_percentage_24h: -0.5, image: '' },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 180, price_change_percentage_24h: 4.2, image: '' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 600, price_change_percentage_24h: 0.2, image: '' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.5, price_change_percentage_24h: 10.5, image: '' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.4, price_change_percentage_24h: -2.1, image: '' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 1.1, price_change_percentage_24h: 1.1, image: '' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 9.2, price_change_percentage_24h: -0.8, image: '' },
];

// Cache mechanism to avoid hitting rate limits too hard
let coinCache: Coin[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000; 

export const getTopCoins = async (): Promise<Coin[]> => {
  const now = Date.now();
  
  // Return cache if it's still fresh
  if (coinCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return coinCache;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
      {
        headers: {
            'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
        // If rate limited (429) or other error, use cache or fallback
        console.warn(`API returned status ${response.status}. Using fallback/cache.`);
        return coinCache.length > 0 ? coinCache : FALLBACK_COINS;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
        coinCache = data;
        lastFetchTime = now;
        return data;
    }
    
    return coinCache.length > 0 ? coinCache : FALLBACK_COINS;
  } catch (error) {
    // This catches "Failed to fetch" (CORS, DNS, Network, or blocked)
    console.error("API Fetch Error:", error);
    
    // Crucial: If fetch fails, don't leave the user with an empty list
    if (coinCache.length === 0) {
        coinCache = FALLBACK_COINS;
    }
    return coinCache;
  }
};

export const searchCoins = async (query: string): Promise<Coin[]> => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    // Ensure we have some data
    if (coinCache.length === 0) {
        await getTopCoins();
    }

    return coinCache.filter(c => 
        c.symbol.toLowerCase().includes(lowerQuery) || 
        c.name.toLowerCase().includes(lowerQuery)
    );
}

export const getPrice = async (ids: string[]): Promise<Record<string, number>> => {
    // Try to update cache if possible
    await getTopCoins();
    
    const prices: Record<string, number> = {};
    coinCache.forEach(c => {
        if (ids.includes(c.id)) {
            prices[c.id] = c.current_price;
        }
    });
    return prices;
}
