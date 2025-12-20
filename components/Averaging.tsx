
import React, { useState, useEffect } from 'react';
import { Scale, ArrowRight, TrendingDown, Info, Calculator, DollarSign } from 'lucide-react';

export const Averaging: React.FC = () => {
  // Persistence State
  const [initPrice, setInitPrice] = useState<string>(() => localStorage.getItem('avg_init_price') || '');
  const [initQty, setInitQty] = useState<string>(() => localStorage.getItem('avg_init_qty') || '');
  
  // New Purchase logic changed to USDT
  const [newPrice, setNewPrice] = useState<string>(() => localStorage.getItem('avg_new_price') || '');
  const [newAmountUsdt, setNewAmountUsdt] = useState<string>(() => localStorage.getItem('avg_new_usdt') || '');
  
  // Target Logic inputs
  const [targetAvg, setTargetAvg] = useState<string>(() => localStorage.getItem('avg_target_price') || '');
  const [planToInvest, setPlanToInvest] = useState<string>(() => localStorage.getItem('avg_plan_invest') || '');

  // Persist values
  useEffect(() => {
    localStorage.setItem('avg_init_price', initPrice);
    localStorage.setItem('avg_init_qty', initQty);
    localStorage.setItem('avg_new_price', newPrice);
    localStorage.setItem('avg_new_usdt', newAmountUsdt);
    localStorage.setItem('avg_target_price', targetAvg);
    localStorage.setItem('avg_plan_invest', planToInvest);
  }, [initPrice, initQty, newPrice, newAmountUsdt, targetAvg, planToInvest]);

  // --- Normal Averaging Calculation ---
  const p1 = parseFloat(initPrice);
  const q1 = parseFloat(initQty);
  const p2 = parseFloat(newPrice);
  const amt2 = parseFloat(newAmountUsdt);

  const currentTotalValue = (p1 || 0) * (q1 || 0);
  const newQtyFromUsdt = (p2 > 0 && amt2 > 0) ? amt2 / p2 : 0;
  
  const totalQty = (q1 || 0) + newQtyFromUsdt;
  const totalCost = currentTotalValue + (amt2 || 0);
  const newAvgPrice = totalQty > 0 ? totalCost / totalQty : 0;
  const reductionPercent = p1 > 0 ? ((p1 - newAvgPrice) / p1) * 100 : 0;

  // --- Target Logic: What price do I need to buy at? ---
  // Formula: TargetAvg = (P1*Q1 + InvestAmt) / (Q1 + InvestAmt/BuyPrice)
  // Let V1 = P1 * Q1
  // TargetAvg * (Q1 + InvestAmt/BuyPrice) = V1 + InvestAmt
  // Q1 + InvestAmt/BuyPrice = (V1 + InvestAmt) / TargetAvg
  // InvestAmt/BuyPrice = (V1 + InvestAmt) / TargetAvg - Q1
  // BuyPrice = InvestAmt / ((V1 + InvestAmt) / TargetAvg - Q1)
  
  // Fix: Parsed numeric values for target calculation and replaced the missing 'tAvg' reference.
  const tAvgVal = parseFloat(targetAvg);
  const investVal = parseFloat(planToInvest);
  let requiredEntryPrice = 0;
  if (!isNaN(p1) && !isNaN(q1) && !isNaN(tAvgVal) && !isNaN(investVal) && tAvgVal > 0) {
      const v1 = p1 * q1;
      const denominator = ((v1 + investVal) / tAvgVal) - q1;
      if (denominator > 0) {
          requiredEntryPrice = investVal / denominator;
      }
  }

  return (
    <div className="p-4 space-y-4 text-sm bg-gray-950 min-h-full">
      <div className="flex items-center gap-2 text-accent-blue mb-2">
          <Scale size={16} />
          <h2 className="font-bold text-xs uppercase tracking-wider">现货补仓成本计算</h2>
      </div>

      {/* Input Group 1: Current Holding */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 space-y-3">
          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span> 当前持仓信息
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">平均买入价</label>
                  <input 
                    type="number"
                    value={initPrice}
                    onChange={(e) => setInitPrice(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="0.00"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">持有币数 (Qty)</label>
                  <input 
                    type="number"
                    value={initQty}
                    onChange={(e) => setInitQty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="0.00"
                  />
              </div>
          </div>
          {currentTotalValue > 0 && (
              <div className="text-[10px] text-gray-600 font-mono">
                  当前市值: <span className="text-gray-400">${currentTotalValue.toLocaleString()}</span>
              </div>
          )}
      </div>

      {/* Input Group 2: New Purchase (USDT Based) */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 space-y-3">
          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full"></span> 补仓计划 (以U计算)
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">补仓预期价</label>
                  <input 
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-accent-green rounded px-2 py-1.5 text-xs text-white outline-none"
                    placeholder="例如 80"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">打算投入金额 (USDT)</label>
                  <div className="relative">
                      <input 
                        type="number"
                        value={newAmountUsdt}
                        onChange={(e) => setNewAmountUsdt(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 focus:border-accent-green rounded px-2 py-1.5 text-xs text-white outline-none pr-7"
                        placeholder="例如 500"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-gray-600">U</span>
                  </div>
              </div>
          </div>
          {newQtyFromUsdt > 0 && (
              <div className="text-[10px] text-gray-600 font-mono">
                  补仓数量: <span className="text-accent-green">{newQtyFromUsdt.toFixed(4)} 币</span>
              </div>
          )}
      </div>

      {/* Result Card */}
      <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-blue/20 to-accent-green/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gray-900 border border-gray-800 rounded-lg p-4 grid grid-cols-2 gap-y-4 shadow-2xl">
              <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">补仓后新均价</span>
                  <span className="text-lg font-bold font-mono text-accent-blue">
                      {newAvgPrice > 0 ? newAvgPrice.toFixed(4) : '--'}
                  </span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 uppercase">成本降低幅度</span>
                  <div className="flex items-center gap-1 text-accent-green font-bold text-sm">
                      <TrendingDown size={14} />
                      {reductionPercent > 0 ? `${reductionPercent.toFixed(2)}%` : '0%'}
                  </div>
              </div>
              
              <div className="border-t border-gray-800 pt-3 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">总持有数量</span>
                  <span className="text-xs font-mono text-gray-300">{totalQty ? totalQty.toFixed(4) : '--'}</span>
              </div>
              <div className="border-t border-gray-800 pt-3 flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 uppercase">累计总投入</span>
                  <span className="text-xs font-mono text-gray-300">{totalCost ? `$${totalCost.toLocaleString()}` : '--'}</span>
              </div>
          </div>
      </div>

      {/* Reverse Target Calculator: The "What Price?" Logic */}
      <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
              <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
                  <Calculator size={12} className="text-accent-blue" /> 目标成本倒推 (我想拉到多少钱)
              </div>
          </div>
          <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">我想要的目标均价</label>
                      <input 
                        type="number"
                        value={targetAvg}
                        onChange={(e) => setTargetAvg(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                        placeholder="例如 90"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">我打算再投多少U</label>
                      <input 
                        type="number"
                        value={planToInvest}
                        onChange={(e) => setPlanToInvest(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                        placeholder="例如 1000"
                      />
                  </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-md border border-gray-800">
                  <div className="flex-1 text-[10px] text-gray-500">
                      若要实现该目标，你必须在以下价格买入：
                  </div>
                  <ArrowRight size={14} className="text-gray-700" />
                  <div className="flex-1 text-center">
                      <div className="text-lg font-bold font-mono text-white">
                          {requiredEntryPrice > 0 ? requiredEntryPrice.toFixed(4) : '--'}
                      </div>
                      <div className="text-[9px] text-gray-600 uppercase">挂单参考价</div>
                  </div>
              </div>
          </div>
          <p className="text-[9px] text-gray-600 italic leading-relaxed">
              * 逻辑说明：根据你当前的持仓，如果投入 <span className="text-gray-400">{planToInvest || 'X'} U</span>，
              买入价必须达到 <span className="text-gray-400">{requiredEntryPrice ? requiredEntryPrice.toFixed(2) : 'Y'}</span> 才能将整体均价摊平至 <span className="text-gray-400">{targetAvg || 'Z'}</span>。
          </p>
      </div>

      <button 
        onClick={() => {
            setInitPrice(''); setInitQty(''); setNewPrice(''); setNewAmountUsdt(''); setTargetAvg(''); setPlanToInvest('');
        }}
        className="w-full py-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase font-bold tracking-widest border border-dashed border-gray-800 rounded"
      >
          重置计算器
      </button>
    </div>
  );
};
