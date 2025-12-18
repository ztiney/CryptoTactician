import React, { useState, useEffect } from 'react';
import { Scale, ArrowRight, TrendingDown, Info } from 'lucide-react';

export const Averaging: React.FC = () => {
  // Persistence State
  const [initPrice, setInitPrice] = useState<string>(() => localStorage.getItem('avg_init_price') || '');
  const [initQty, setInitQty] = useState<string>(() => localStorage.getItem('avg_init_qty') || '');
  const [newPrice, setNewPrice] = useState<string>(() => localStorage.getItem('avg_new_price') || '');
  const [newQty, setNewQty] = useState<string>(() => localStorage.getItem('avg_new_qty') || '');
  const [targetAvg, setTargetAvg] = useState<string>(() => localStorage.getItem('avg_target_price') || '');

  // Persist values
  useEffect(() => {
    localStorage.setItem('avg_init_price', initPrice);
    localStorage.setItem('avg_init_qty', initQty);
    localStorage.setItem('avg_new_price', newPrice);
    localStorage.setItem('avg_new_qty', newQty);
    localStorage.setItem('avg_target_price', targetAvg);
  }, [initPrice, initQty, newPrice, newQty, targetAvg]);

  // Derived Calculations
  const p1 = parseFloat(initPrice);
  const q1 = parseFloat(initQty);
  const p2 = parseFloat(newPrice);
  const q2 = parseFloat(newQty);
  const tAvg = parseFloat(targetAvg);

  const currentTotalCost = (p1 || 0) * (q1 || 0);
  const newPurchaseCost = (p2 || 0) * (q2 || 0);
  const totalQty = (q1 || 0) + (q2 || 0);
  const totalCost = currentTotalCost + newPurchaseCost;
  const newAvgPrice = totalQty > 0 ? totalCost / totalQty : 0;
  const reductionPercent = p1 > 0 ? ((p1 - newAvgPrice) / p1) * 100 : 0;

  // Target Logic: How much more to buy to reach targetAvg?
  // NewAvg = (P1*Q1 + P2*X) / (Q1 + X) = Target
  // P1*Q1 + P2*X = Target*Q1 + Target*X
  // P1*Q1 - Target*Q1 = Target*X - P2*X
  // X = (Q1 * (P1 - Target)) / (Target - P2)
  let neededQty = 0;
  if (!isNaN(p1) && !isNaN(q1) && !isNaN(p2) && !isNaN(tAvg)) {
      const numerator = q1 * (p1 - tAvg);
      const denominator = tAvg - p2;
      if (denominator !== 0) {
          neededQty = numerator / denominator;
      }
  }

  return (
    <div className="p-4 space-y-4 text-sm bg-gray-950 min-h-full">
      <div className="flex items-center gap-2 text-accent-blue mb-2">
          <Scale size={16} />
          <h2 className="font-bold text-xs uppercase tracking-wider">现货补仓/摊平计算</h2>
      </div>

      {/* Input Group 1: Current Holding */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 space-y-3">
          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span> 当前持有
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">持仓均价</label>
                  <input 
                    type="number"
                    value={initPrice}
                    onChange={(e) => setInitPrice(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="例如 100"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">持有数量</label>
                  <input 
                    type="number"
                    value={initQty}
                    onChange={(e) => setInitQty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="例如 1"
                  />
              </div>
          </div>
          {currentTotalCost > 0 && (
              <div className="text-[10px] text-gray-600 font-mono">
                  当前总市值: ${currentTotalCost.toFixed(2)}
              </div>
          )}
      </div>

      {/* Input Group 2: New Purchase */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 space-y-3">
          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full"></span> 补仓计划
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">补仓价格</label>
                  <input 
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-green rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="例如 80"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">补仓数量</label>
                  <input 
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-green rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="例如 1"
                  />
              </div>
          </div>
      </div>

      {/* Result Card */}
      <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-blue/20 to-accent-green/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gray-900 border border-gray-800 rounded-lg p-4 grid grid-cols-2 gap-y-4">
              <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">补仓后均价</span>
                  <span className="text-lg font-bold font-mono text-accent-blue">
                      {newAvgPrice > 0 ? newAvgPrice.toFixed(4) : '--'}
                  </span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 uppercase">成本降低</span>
                  <div className="flex items-center gap-1 text-accent-green font-bold text-sm">
                      <TrendingDown size={14} />
                      {reductionPercent > 0 ? `${reductionPercent.toFixed(2)}%` : '0%'}
                  </div>
              </div>
              
              <div className="border-t border-gray-800 pt-3 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">总数量</span>
                  <span className="text-xs font-mono text-gray-300">{totalQty || '--'}</span>
              </div>
              <div className="border-t border-gray-800 pt-3 flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 uppercase">总投入 (USDT)</span>
                  <span className="text-xs font-mono text-gray-300">{totalCost ? totalCost.toFixed(2) : '--'}</span>
              </div>
          </div>
      </div>

      {/* Reverse Target Calculator */}
      <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
              <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
                  <Info size={12} className="text-accent-blue" /> 目标成本倒推
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-gray-400">我想要的均价</label>
                  <input 
                    type="number"
                    value={targetAvg}
                    onChange={(e) => setTargetAvg(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="目标价格"
                  />
              </div>
              <div className="flex items-center pt-4">
                  <ArrowRight size={14} className="text-gray-700" />
              </div>
              <div className="flex-1 bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-[9px] text-gray-500 mb-0.5">需在补仓价买入</div>
                  <div className="text-xs font-bold font-mono text-white">
                      {neededQty > 0 ? neededQty.toFixed(4) : '--'}
                  </div>
              </div>
          </div>
          <p className="text-[9px] text-gray-600 italic">
              * 假设在您输入的“补仓价格”位置进行购买。
          </p>
      </div>

      <button 
        onClick={() => {
            setInitPrice(''); setInitQty(''); setNewPrice(''); setNewQty(''); setTargetAvg('');
        }}
        className="w-full py-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase font-bold tracking-widest border border-dashed border-gray-800 rounded"
      >
          重置所有输入
      </button>
    </div>
  );
};