import React, { useState, useEffect } from 'react';
import { PredictionGame } from '../types';
import { Timer, Trophy, XCircle, TrendingUp, Wallet } from 'lucide-react';

interface PredictionProps {
  currentPrices: Record<string, number>; // symbol -> price
}

export const Prediction: React.FC<PredictionProps> = ({ currentPrices }) => {
  const [games, setGames] = useState<PredictionGame[]>(() => {
    const saved = localStorage.getItem('prediction_games');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH'>('BTC');
  const [duration, setDuration] = useState<1 | 5 | 15>(1);
  const [betAmount, setBetAmount] = useState<string>('100');

  useEffect(() => {
    localStorage.setItem('prediction_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGames(prev => prev.map(game => {
        if (game.status !== 'active') return game;
        
        if (now >= game.targetTime) {
          const coinId = game.symbol === 'BTC' ? 'bitcoin' : 'ethereum';
          const currentPrice = currentPrices[coinId];
          
          if (!currentPrice) return game; 

          const isWin = game.direction === 'up' 
            ? currentPrice > game.startPrice 
            : currentPrice < game.startPrice;
          
          return {
            ...game,
            status: isWin ? 'won' : 'lost',
            settledPrice: currentPrice,
            pnl: isWin ? game.betAmount : -game.betAmount
          };
        }
        return game;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPrices]);

  const startGame = (direction: 'up' | 'down') => {
    const assetId = selectedAsset === 'BTC' ? 'bitcoin' : 'ethereum';
    const currentPrice = currentPrices[assetId];
    if (!currentPrice) return;
    
    const bet = parseFloat(betAmount);
    if(isNaN(bet) || bet <= 0) {
        alert("请输入有效的投注金额");
        return;
    }

    const newGame: PredictionGame = {
      id: Date.now().toString(),
      symbol: selectedAsset,
      startPrice: currentPrice,
      targetTime: Date.now() + duration * 60 * 1000,
      duration,
      direction,
      status: 'active',
      betAmount: bet
    };
    setGames(prev => [newGame, ...prev]);
  };

  const activeGames = games.filter(g => g.status === 'active');
  const historyGames = games.filter(g => g.status !== 'active');
  
  const totalGames = historyGames.length;
  const wins = historyGames.filter(g => g.status === 'won').length;
  const totalPnl = historyGames.reduce((acc, g) => acc + (g.pnl || 0), 0);
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Mini Stats Dashboard */}
      <div className="bg-gray-900 border-b border-gray-800 p-3 grid grid-cols-3 divide-x divide-gray-800 shrink-0">
        <div className="text-center px-2">
            <div className="text-[9px] text-gray-500 uppercase">胜率 (Win Rate)</div>
            <div className="text-sm font-bold text-accent-blue font-mono">{winRate.toFixed(1)}%</div>
        </div>
        <div className="text-center px-2">
            <div className="text-[9px] text-gray-500 uppercase">净盈亏 (PNL)</div>
            <div className={`text-sm font-bold font-mono ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(0)}
            </div>
        </div>
        <div className="text-center px-2">
            <div className="text-[9px] text-gray-500 uppercase">总场次</div>
            <div className="text-sm font-bold text-gray-300 font-mono">{totalGames}</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 space-y-4 shrink-0">
          <div className="flex justify-between items-center">
                <div className="flex bg-gray-900 rounded p-0.5">
                    <button onClick={() => setSelectedAsset('BTC')} className={`text-xs px-3 py-1 rounded-[2px] transition-colors ${selectedAsset === 'BTC' ? 'bg-gray-800 text-white font-bold shadow-sm' : 'text-gray-500'}`}>BTC</button>
                    <button onClick={() => setSelectedAsset('ETH')} className={`text-xs px-3 py-1 rounded-[2px] transition-colors ${selectedAsset === 'ETH' ? 'bg-gray-800 text-white font-bold shadow-sm' : 'text-gray-500'}`}>ETH</button>
                </div>
                <div className="flex bg-gray-900 rounded p-0.5">
                    {[1, 5, 15].map((m) => (
                    <button
                        key={m}
                        onClick={() => setDuration(m as any)}
                        className={`text-[10px] px-2 py-1 rounded-[2px] font-medium transition-all ${duration === m ? 'bg-gray-800 text-accent-blue shadow-sm' : 'text-gray-500'}`}
                    >
                        {m}m
                    </button>
                    ))}
                </div>
          </div>

         <div className="relative">
             <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                 <Wallet size={12} />
             </div>
             <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-accent-blue rounded px-2 py-2 pl-8 text-xs text-white outline-none"
                placeholder="投入本金"
             />
             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">USDT</span>
         </div>

         <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => startGame('up')}
                className="bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/30 text-accent-green rounded py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
                <TrendingUp size={14} />
                看涨 (BULL)
            </button>
            <button 
                onClick={() => startGame('down')}
                className="bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/30 text-accent-red rounded py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
                 <TrendingUp size={14} className="rotate-180"/>
                看跌 (BEAR)
            </button>
         </div>
      </div>

      <div className="h-2 bg-gray-900 border-y border-gray-800 shrink-0"></div>

      {/* Active & History List */}
      <div className="flex-1 overflow-y-auto">
         {activeGames.length > 0 && (
            <div className="border-b border-gray-800">
                <div className="bg-gray-900/30 px-4 py-1 text-[10px] text-gray-500 uppercase font-bold">进行中</div>
                {activeGames.map(game => (
                    <div key={game.id} className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${game.direction === 'up' ? 'bg-accent-green' : 'bg-accent-red'}`}></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-200 text-xs">{game.symbol}</span>
                            <span className={`text-[9px] px-1 rounded font-bold ${game.direction === 'up' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                {game.direction === 'up' ? '看多' : '看空'}
                            </span>
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5 font-mono">
                            ${game.betAmount} • Entry: {game.startPrice}
                        </div>
                    </div>
                    <div className="text-right">
                        <Countdown target={game.targetTime} />
                        <div className="text-[9px] text-gray-500">剩余时间</div>
                    </div>
                    </div>
                ))}
            </div>
         )}

         {historyGames.length > 0 && (
            <div>
                 <div className="bg-gray-900/30 px-4 py-1 text-[10px] text-gray-500 uppercase font-bold sticky top-0 backdrop-blur">历史记录</div>
                 {historyGames.slice(0, 15).map(game => (
                    <div key={game.id} className="px-4 py-2 flex justify-between items-center text-xs border-b border-gray-800 last:border-0 hover:bg-gray-900/30">
                        <div className="flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full ${game.direction === 'up' ? 'bg-accent-green' : 'bg-accent-red'}`}></span>
                            <span className="text-gray-400 font-mono w-8">{game.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`font-mono ${game.status === 'won' ? 'text-accent-green' : 'text-accent-red'}`}>
                                {game.status === 'won' ? '+' : '-'}{game.betAmount}
                            </span>
                            {game.status === 'won' ? <Trophy size={10} className="text-accent-green"/> : <XCircle size={10} className="text-gray-700"/>}
                        </div>
                    </div>
                 ))}
            </div>
         )}
      </div>
    </div>
  );
};

const Countdown: React.FC<{ target: number }> = ({ target }) => {
    const [left, setLeft] = useState(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    useEffect(() => {
        const i = setInterval(() => {
            const sec = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setLeft(sec);
            if(sec === 0) clearInterval(i);
        }, 1000);
        return () => clearInterval(i);
    }, [target]);
    
    return <div className="font-mono text-xs font-bold text-gray-300">{Math.floor(left / 60)}:{(left % 60).toString().padStart(2, '0')}</div>
}