import React, { useState, useEffect } from 'react';
import { Coin, TradeMode, TradeSide, AmountUnit, CalculationBasis, Position } from '../types';
import { Save, Crosshair, ArrowDownToLine } from 'lucide-react';

interface CalculatorProps {
  activeCoin: Coin | null;
  onSavePosition: (pos: Position) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ activeCoin, onSavePosition }) => {
  // Settings
  const [mode, setMode] = useState<TradeMode>('future');
  const [side, setSide] = useState<TradeSide>('long');
  const [unit, setUnit] = useState<AmountUnit>('USDT');
  const [basis, setBasis] = useState<CalculationBasis>('principal');
  const [leverage, setLeverage] = useState<number>(10);

  // Inputs
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');

  // Results
  const [pnl, setPnl] = useState<number | null>(null);
  const [roe, setRoe] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);
  const [liqPrice, setLiqPrice] = useState<number | null>(null);

  // Auto-fill entry price if empty when coin changes
  useEffect(() => {
    if (activeCoin && !entryPrice) {
      setEntryPrice(activeCoin.current_price.toString());
    }
  }, [activeCoin]);

  useEffect(() => {
    if(mode === 'spot') setLeverage(1);
  }, [mode]);

  const fillCurrentPrice = (target: 'entry' | 'exit') => {
      if (activeCoin) {
          if (target === 'entry') setEntryPrice(activeCoin.current_price.toString());
          else setExitPrice(activeCoin.current_price.toString());
      }
  };

  const calculate = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const amt = parseFloat(amountInput);
    const lev = mode === 'spot' ? 1 : leverage;

    if (isNaN(entry) || isNaN(amt)) {
        setPnl(null); setRoe(null); setMargin(null); setLiqPrice(null);
        return;
    }

    let positionSizeCoins = 0;
    let requiredMargin = 0;

    // 1. Calculate Margin & Size
    if (unit === 'COIN') {
      positionSizeCoins = amt;
      requiredMargin = (positionSizeCoins * entry) / lev;
    } else {
      if (basis === 'total') {
        positionSizeCoins = amt / entry;
        requiredMargin = amt / lev;
      } else {
        requiredMargin = amt;
        const totalValue = amt * lev;
        positionSizeCoins = totalValue / entry;
      }
    }

    // 2. Calculate PnL (if exit price exists)
    if (!isNaN(exit)) {
        let profit = 0;
        if (side === 'long') {
          profit = (exit - entry) * positionSizeCoins;
        } else {
          profit = (entry - exit) * positionSizeCoins;
        }
        setPnl(profit);
        const roeVal = (profit / requiredMargin) * 100;
        setRoe(roeVal);
    } else {
        setPnl(null);
        setRoe(null);
    }

    setMargin(requiredMargin);

    // 3. Calculate Liquidation Price (Approximate)
    if (mode === 'future') {
        let liq = 0;
        if (side === 'long') {
            liq = entry * (1 - 1/lev);
        } else {
            liq = entry * (1 + 1/lev);
        }
        setLiqPrice(liq > 0 ? liq : 0);
    } else {
        setLiqPrice(null);
    }
  };

  useEffect(() => {
    calculate();
  }, [entryPrice, exitPrice, amountInput, leverage, mode, side, unit, basis]);

  const handleSave = () => {
    if (!activeCoin || !margin) return;
    const entry = parseFloat(entryPrice);
    const amt = parseFloat(amountInput);
    
    let quantity = 0;
    const lev = mode === 'spot' ? 1 : leverage;

    if (unit === 'COIN') {
        quantity = amt;
    } else {
        if (basis === 'total') {
            quantity = amt / entry;
        } else {
            quantity = (amt * lev) / entry;
        }
    }

    const newPos: Position = {
      id: Date.now().toString(),
      coinId: activeCoin.id,
      symbol: activeCoin.symbol,
      entryPrice: entry,
      amount: quantity,
      leverage: lev,
      side,
      mode,
      timestamp: Date.now()
    };
    onSavePosition(newPos);
  };

  return (
    <div className="p-4 space-y-4 text-sm">
      {/* Mode & Side Selection */}
      <div className="grid grid-cols-2 gap-3">
         {/* Mode Switch */}
         <div className="bg-gray-900 p-0.5 rounded flex text-center">
            <button
                onClick={() => setMode('spot')}
                className={`flex-1 py-1 text-[10px] rounded-[2px] font-bold ${mode === 'spot' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-400'}`}
            >
                现货
            </button>
            <button
                onClick={() => setMode('future')}
                className={`flex-1 py-1 text-[10px] rounded-[2px] font-bold ${mode === 'future' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-400'}`}
            >
                合约
            </button>
         </div>

         {/* Side Switch */}
         <div className="flex bg-gray-900 rounded p-0.5">
            <button
            onClick={() => setSide('long')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-[2px] transition-all ${
                side === 'long' 
                ? 'bg-accent-green text-gray-900' 
                : 'text-gray-500 hover:text-gray-400'
            }`}
            >
            做多
            </button>
            <button
            onClick={() => setSide('short')}
            disabled={mode === 'spot'}
            className={`flex-1 py-1 text-[10px] font-bold rounded-[2px] transition-all ${
                side === 'short'
                ? 'bg-accent-red text-white'
                : 'text-gray-500 hover:text-gray-400'
            } ${mode === 'spot' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
            做空
            </button>
        </div>
      </div>

      {/* Leverage - Always rendered to maintain layout height, dimmed in Spot mode */}
      <div className={`space-y-1 transition-opacity duration-200 ${mode === 'spot' ? 'opacity-25 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase">
              <span>杠杆倍数</span>
              <span className="text-accent-blue font-bold">{leverage}x</span>
          </div>
          <input
              type="range"
              min="1"
              max="125"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent-blue"
          />
      </div>

      {/* Price Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
           <div className="flex justify-between items-end">
                <label className="text-[10px] text-gray-500">开仓价</label>
                <button onClick={() => fillCurrentPrice('entry')} className="text-[10px] text-accent-blue hover:text-white flex items-center">
                    当前
                </button>
           </div>
           <div className="relative">
                <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                placeholder="Entry Price"
                />
           </div>
        </div>
        <div className="space-y-1">
           <div className="flex justify-between items-end">
                <label className="text-[10px] text-gray-500">平仓价</label>
                <button onClick={() => fillCurrentPrice('exit')} className="text-[10px] text-accent-blue hover:text-white flex items-center">
                    当前
                </button>
           </div>
           <div className="relative">
                <input
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none"
                placeholder="Exit Price"
                />
           </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-1">
         <div className="flex justify-between text-[10px] text-gray-500">
            <span>数量 / 金额</span>
            <div className="space-x-2">
                <button onClick={() => setUnit(unit === 'USDT' ? 'COIN' : 'USDT')} className="hover:text-white underline decoration-dotted">
                    单位: {unit}
                </button>
                {unit === 'USDT' && (
                    <button onClick={() => setBasis(basis === 'principal' ? 'total' : 'principal')} className="hover:text-white underline decoration-dotted">
                        {basis === 'principal' ? '按本金' : '按总值'}
                    </button>
                )}
            </div>
         </div>
         <div className="relative">
            <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-accent-blue rounded px-2 py-1.5 text-xs text-white outline-none pr-10"
                placeholder="0.00"
            />
            <span className="absolute right-2 top-1.5 text-[10px] text-gray-500 font-mono">
                {unit === 'USDT' ? 'USDT' : activeCoin?.symbol.toUpperCase()}
            </span>
         </div>
      </div>

      {/* Results Dashboard */}
      <div className="bg-gray-900/30 border border-gray-800 rounded p-2 grid grid-cols-2 gap-2">
          <div className="flex justify-between items-center">
             <span className="text-[10px] text-gray-500">保证金</span>
             <span className="text-xs font-mono text-gray-300">{margin ? margin.toFixed(1) : '--'}</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[10px] text-gray-500 flex items-center gap-1">
                 <ArrowDownToLine size={10}/> 强平
             </span>
             <span className="text-xs font-mono text-orange-400">{liqPrice ? liqPrice.toFixed(2) : '--'}</span>
          </div>
          <div className="flex justify-between items-center col-span-2 border-t border-gray-800/50 pt-1 mt-1">
             <span className="text-[10px] text-gray-500">预估盈亏</span>
             <div className="text-right">
                 <span className={`text-sm font-bold font-mono ${pnl && pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {pnl ? pnl.toFixed(2) : '--'}
                 </span>
                 <span className={`text-[10px] ml-2 ${roe && roe >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    ({roe ? roe.toFixed(2) : '--'}%)
                 </span>
             </div>
          </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
      >
        <Save size={12} />
        保存至模拟盘
      </button>
    </div>
  );
};