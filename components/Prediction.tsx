import React, { useState, useEffect } from 'react';
import { PredictionGame } from '../types';
import { Timer, Trophy, XCircle, TrendingUp, DollarSign, Wallet } from 'lucide-react';

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

  // Game Logic Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGames(prev => prev.map(game => {
        if (game.status !== 'active') return game;
        
        if (now >= game.targetTime) {
          const coinId = game.symbol === 'BTC' ? 'bitcoin' : 'ethereum';
          const currentPrice = currentPrices[coinId];
          
          if (!currentPrice) return game; // Wait for price update

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
  
  // Statistics
  const totalGames = historyGames.length;
  const wins = historyGames.filter(g => g.status === 'won').length;
  const totalPnl = historyGames.reduce((acc, g) => acc + (g.pnl || 0), 0);
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Stats Header */}
      <div className="bg-gray-800 rounded-lg p-3 grid grid-cols-3 divide-x divide-gray-700 border border-gray-700">
        <div className="text-center px-2">
            <div className="text-[10px] text-gray-500 uppercase">总场次</div>
            <div className="text-lg font-bold text-white">{totalGames}</div>
        </div>
        <div className="text-center px-2">
            <div className="text-[10px] text-gray-500 uppercase">胜率</div>
            <div className="text-lg font-bold text-accent-blue">{winRate.toFixed(1)}%</div>
        </div>
        <div className="text-center px-2">
            <div className="text-[10px] text-gray-500 uppercase">总盈亏</div>
            <div className={`text-lg font-bold ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(0)}
            </div>
        </div>
      </div>

      {/* Game Control */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <Timer size={16} className="text-accent-blue"/> 
                    战法预测
               </h3>
                <div className="flex bg-gray-900 rounded p-0.5">
                    <button onClick={() => setSelectedAsset('BTC')} className={`text-xs px-3 py-1 rounded transition-colors ${selectedAsset === 'BTC' ? 'bg-gray-700 text-white font-bold' : 'text-gray-500'}`}>BTC</button>
                    <button onClick={() => setSelectedAsset('ETH')} className={`text-xs px-3 py-1 rounded transition-colors ${selectedAsset === 'ETH' ? 'bg-gray-700 text-white font-bold' : 'text-gray-500'}`}>ETH</button>
                </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 5, 15].map((m) => (
            <button
                key={m}
                onClick={() => setDuration(m as any)}
                className={`text-xs py-2 rounded border font-medium transition-all ${duration === m ? 'border-accent-blue text-accent-blue bg-accent-blue/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-gray-700 text-gray-500 hover:bg-gray-750'}`}
            >
                {m} 分钟
            </button>
            ))}
         </div>

         <div className="mb-4 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                 <Wallet size={14} />
             </div>
             <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded py-2 pl-9 pr-4 text-sm text-white focus:border-accent-blue outline-none"
                placeholder="投入本金"
             />
             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USDT</span>
         </div>

         <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => startGame('up')}
                className="bg-gradient-to-br from-green-900/50 to-green-800/50 hover:from-green-800 hover:to-green-700 border border-green-600/30 text-accent-green rounded-lg py-3 text-sm font-bold transition shadow-lg flex flex-col items-center justify-center gap-1"
            >
                <TrendingUp size={18} />
                看涨 (BULL)
            </button>
            <button 
                onClick={() => startGame('down')}
                className="bg-gradient-to-br from-red-900/50 to-red-800/50 hover:from-red-800 hover:to-red-700 border border-red-600/30 text-accent-red rounded-lg py-3 text-sm font-bold transition shadow-lg flex flex-col items-center justify-center gap-1"
            >
                 <TrendingUp size={18} className="rotate-180"/>
                看跌 (BEAR)
            </button>
         </div>
      </div>

      {/* Active Games */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider px-1">当前进行中</p>
        {activeGames.length === 0 && <p className="text-xs text-gray-600 px-1 italic">无进行中的预测</p>}
        {activeGames.map(game => (
            <div key={game.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${game.direction === 'up' ? 'bg-accent-green' : 'bg-accent-red'}`}></div>
              <div className="pl-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-200">{game.symbol}</span>
                    <span className={`text-[10px] px-1.5 rounded font-bold ${game.direction === 'up' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                        {game.direction === 'up' ? '看多' : '看空'}
                    </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                    入场: {game.startPrice} • 投入: {game.betAmount}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">剩余时间</div>
                <Countdown target={game.targetTime} />
              </div>
            </div>
        ))}

        {historyGames.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-1 mb-2">最近记录 (Top 10)</p>
                 <div className="space-y-1.5">
                    {historyGames.slice(0, 10).map(game => (
                        <div key={game.id} className="flex justify-between items-center text-xs bg-gray-900/50 p-2 rounded border border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 w-8">{game.symbol}</span>
                                <span className={`w-8 ${game.direction === 'up' ? 'text-accent-green' : 'text-accent-red'}`}>
                                    {game.direction === 'up' ? '多' : '空'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={game.status === 'won' ? 'text-accent-green' : 'text-accent-red'}>
                                    {game.status === 'won' ? `+${game.betAmount}` : `-${game.betAmount}`}
                                </span>
                                {game.status === 'won' ? <Trophy size={12} className="text-accent-green"/> : <XCircle size={12} className="text-gray-600"/>}
                            </div>
                        </div>
                    ))}
                 </div>
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
    
    return <span className="font-mono text-lg font-bold text-gray-200">{Math.floor(left / 60)}:{(left % 60).toString().padStart(2, '0')}</span>
}