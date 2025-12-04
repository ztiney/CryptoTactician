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

  if (positions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-500 text-xs italic">
        暂无模拟持仓记录。
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-900 px-3 py-2 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-xs font-bold text-gray-300">模拟持仓列表</h3>
        <span className={`text-xs font-mono font-bold ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          总计: ${totalPnl.toFixed(2)}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {positions.map((pos) => {
          const currentPrice = prices[pos.coinId] || pos.entryPrice;
          const pnl = pos.side === 'long' 
            ? (currentPrice - pos.entryPrice) * pos.amount
            : (pos.entryPrice - currentPrice) * pos.amount;
          
          const roe = (pnl / ((pos.amount * pos.entryPrice) / pos.leverage)) * 100;

          return (
            <div key={pos.id} className="p-3 border-b border-gray-700/50 hover:bg-gray-750 transition-colors group relative">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-1 rounded ${pos.side === 'long' ? 'bg-accent-green text-gray-900' : 'bg-accent-red text-white'}`}>
                        {pos.side === 'long' ? '多' : '空'}
                    </span>
                    <span className="text-xs font-bold text-gray-200">{pos.symbol.toUpperCase()}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1 rounded">{pos.mode === 'spot' ? '现货' : `${pos.leverage}x`}</span>
                </div>
                <div className={`text-xs font-mono font-bold ${pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <div>
                      开仓: <span className="text-gray-300">{pos.entryPrice}</span>
                  </div>
                   <div>
                      当前: <span className="text-gray-300">{currentPrice}</span>
                  </div>
                  <div>
                      ROE: <span className={`${roe >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{roe.toFixed(1)}%</span>
                  </div>
              </div>

              <button 
                onClick={() => onDelete(pos.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-gray-900 text-red-500 rounded hover:bg-red-900 transition-all"
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