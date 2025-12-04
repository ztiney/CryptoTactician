import React from 'react';
import { Coin } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerProps {
  coins: Coin[];
  onSelect: (coin: Coin) => void;
}

export const Ticker: React.FC<TickerProps> = ({ coins, onSelect }) => {
  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 overflow-hidden whitespace-nowrap py-2 relative group">
      <div className="inline-block animate-marquee hover:[animation-play-state:paused]">
        {coins.concat(coins).map((coin, idx) => (
          <button
            key={`${coin.id}-${idx}`}
            onClick={() => onSelect(coin)}
            className="inline-flex items-center px-4 space-x-2 text-xs hover:bg-gray-800 py-1 rounded transition-colors"
          >
            <span className="font-bold text-gray-300 uppercase">{coin.symbol}</span>
            <span className={coin.price_change_percentage_24h >= 0 ? 'text-accent-green' : 'text-accent-red'}>
              ${coin.current_price.toLocaleString()}
            </span>
            {coin.price_change_percentage_24h >= 0 ? (
              <TrendingUp size={10} className="text-accent-green" />
            ) : (
              <TrendingDown size={10} className="text-accent-red" />
            )}
          </button>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};
