import React, { useEffect, useState } from 'react';
import { Position } from '../types';
import { Trash2 } from 'lucide-react';

interface PositionsProps {
  positions: Position[];
  prices: Record<string, number>;
  onDelete: (id: string) => void;
}

export const Positions: React.FC<PositionsProps> = ({ positions, prices, onDelete }) => {
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    const total = positions.reduce((acc, pos) => {
      const currentPrice = prices[pos.coinId] || pos.entryPrice;
      let pnl = 0;
      if (pos.side === 'long') {
        pnl = (currentPrice - pos.entryPrice) * pos.amount;
      } else {
        pnl = (pos.entryPrice - currentPrice) * pos.amount;
      }
      return acc + pnl;
    }, 0);
    setTotalPnl(total);
  }, [positions, prices]);

  const formatPrice = (p: number) => {
      if (p < 0.0001) return p.toFixed(8);
      if (p < 1) return p.toFixed(6);
      return p.toFixed(4);
  };

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 text-[10px]">
        暂无持仓
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-4 py-2 flex justify-between items-center bg-gray-900/30">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase">模拟持仓 ({positions.length})</h3>
        <span className={`text-xs font-mono font-bold ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          ${totalPnl.toFixed(2)}
        </span>
      </div>
      <div>
        {positions.map((pos) => {
          const currentPrice = prices[pos.coinId] || pos.entryPrice;
          const pnl = pos.side === 'long' 
            ? (currentPrice - pos.entryPrice) * pos.amount
            : (pos.entryPrice - currentPrice) * pos.amount;
          
          const cost = (pos.amount * pos.entryPrice) / pos.leverage;
          const roe = (pnl / cost) * 100;

          return (
            <div key={pos.id} className="px-4 py-3 border-b border-gray-800 hover:bg-gray-900/50 group relative">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1 rounded-[2px] ${pos.side === 'long' ? 'bg-accent-green text-gray-900' : 'bg-accent-red text-white'}`}>
                        {pos.side === 'long' ? '多' : '空'}
                    </span>
                    <span className="text-xs font-bold text-gray-200">{pos.symbol.toUpperCase()}</span>
                    <span className="text-[9px] text-gray-500">{pos.mode === 'spot' ? '现货' : `${pos.leverage}x`}</span>
                </div>
                <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                    </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                  <span className="text-gray-400">本金: ${cost.toFixed(2)}</span>
                  <span className={`${roe >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{roe.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-[9px] text-gray-600 font-mono mt-0.5">
                  <span>@{formatPrice(pos.entryPrice)} → {formatPrice(currentPrice)}</span>
              </div>

              <button 
                onClick={() => onDelete(pos.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded transition-all"
              >
                  <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};