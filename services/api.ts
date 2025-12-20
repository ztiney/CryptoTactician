import { Coin } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Static fallback data: Essential for tool availability when API is down/limited
const FALLBACK_COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 95500, price_change_percentage_24h: 1.2, image: '' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2650, price_change_percentage_24h: -0.8, image: '' },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 185, price_change_percentage_24h: 3.5, image: '' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 610, price_change_percentage_24h: 0.5, image: '' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.6, price_change_percentage_24h: 8.2, image: '' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.38, price_change_percentage_24h: -1.5, image: '' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 1.05, price_change_percentage_24h: 0.9, image: '' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 9.1, price_change_percentage_24h: -0.2, image: '' },
];

let coinCache: Coin[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000; 

export const getTopCoins = async (): Promise<Coin[]> => {
  const now = Date.now();
  
  if (coinCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return coinCache;
  }

  try {
    // We use a simpler fetch to avoid triggering CORS preflight issues where possible
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
      { mode: 'cors' }
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
        coinCache = data;
        lastFetchTime = now;
        return data;
    }
    
    throw new Error('Empty data');
  } catch (error) {
    // Silencing the "Failed to fetch" console error to avoid alarming the user.
    // We log a simple warning instead.
    console.warn("Market data unavailable, using fallback coins.");
    
    if (coinCache.length === 0) {
        coinCache = FALLBACK_COINS;
    }
    return coinCache;
  }
};

export const searchCoins = async (query: string): Promise<Coin[]> => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    if (coinCache.length === 0) {
        await getTopCoins();
    }

    return coinCache.filter(c => 
        c.symbol.toLowerCase().includes(lowerQuery) || 
        c.name.toLowerCase().includes(lowerQuery)
    );
};

export const getPrice = async (ids: string[]): Promise<Record<string, number>> => {
    // If cache is empty, try one fetch
    if (coinCache.length === 0) {
        await getTopCoins();
    }
    
    const prices: Record<string, number> = {};
    coinCache.forEach(c => {
        if (ids.includes(c.id)) {
            prices[c.id] = c.current_price;
        }
    });
    return prices;
};
