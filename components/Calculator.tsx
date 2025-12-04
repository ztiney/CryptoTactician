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

  // Auto-fill entry price when coin changes (optional, but requested behavior implies user wants control)
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
    // Long: Entry * (1 - 1/Lev)
    // Short: Entry * (1 + 1/Lev)
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
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      {/* Header / Mode Toggles */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex bg-gray-900 rounded p-1">
          <button
            onClick={() => setMode('spot')}
            className={`px-3 py-1 text-xs font-medium rounded ${mode === 'spot' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
          >
            现货
          </button>
          <button
            onClick={() => setMode('future')}
            className={`px-3 py-1 text-xs font-medium rounded ${mode === 'future' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
          >
            合约
          </button>
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white font-mono">{activeCoin?.symbol.toUpperCase() || '---'}</span>
            <span className="text-xs text-gray-500">${activeCoin?.current_price.toLocaleString()}</span>
        </div>
      </div>

      {/* Side Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('long')}
          className={`py-1.5 rounded text-sm font-bold border transition-all ${
            side === 'long' 
              ? 'bg-accent-green/10 text-accent-green border-accent-green' 
              : 'bg-gray-900 text-gray-500 border-transparent'
          }`}
        >
          做多 (Long)
        </button>
        <button
          onClick={() => setSide('short')}
          disabled={mode === 'spot'}
          className={`py-1.5 rounded text-sm font-bold border transition-all ${
            side === 'short'
              ? 'bg-accent-red/10 text-accent-red border-accent-red'
              : 'bg-gray-900 text-gray-500 border-transparent'
          } ${mode === 'spot' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          做空 (Short)
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {/* Leverage Slider */}
        {mode === 'future' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>杠杆倍数</span>
              <span>{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="125"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />
          </div>
        )}

        {/* Entry & Exit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 relative">
            <div className="flex justify-between">
                <label className="text-[10px] uppercase text-gray-500">开仓价格</label>
                <button onClick={() => fillCurrentPrice('entry')} className="text-[10px] text-accent-blue hover:text-white flex items-center gap-0.5">
                    <Crosshair size={10} /> 当前
                </button>
            </div>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-accent-blue outline-none"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1 relative">
             <div className="flex justify-between">
                <label className="text-[10px] uppercase text-gray-500">平仓价格</label>
                <button onClick={() => fillCurrentPrice('exit')} className="text-[10px] text-accent-blue hover:text-white flex items-center gap-0.5">
                    <Crosshair size={10} /> 当前
                </button>
            </div>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-accent-blue outline-none"
              placeholder="Target"
            />
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gray-900/50 p-2 rounded border border-gray-800 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>数量/金额设置</span>
                <div className="flex gap-2">
                    <button onClick={() => setUnit(unit === 'USDT' ? 'COIN' : 'USDT')} className="hover:text-white underline">
                        {unit}
                    </button>
                    {unit === 'USDT' && (
                         <button onClick={() => setBasis(basis === 'principal' ? 'total' : 'principal')} className="hover:text-white underline">
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
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-accent-blue outline-none pr-12"
                    placeholder="0.00"
                />
                <span className="absolute right-2 top-1.5 text-xs text-gray-500 font-mono">
                    {unit === 'USDT' ? 'USDT' : activeCoin?.symbol.toUpperCase() || 'COIN'}
                </span>
            </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-center mb-4">
            <div className="bg-gray-900/50 p-1.5 rounded">
                <div className="text-[10px] text-gray-500">保证金 (Margin)</div>
                <div className="text-sm font-mono text-gray-300">{margin ? margin.toFixed(2) : '--'}</div>
            </div>
            <div className="bg-gray-900/50 p-1.5 rounded relative overflow-hidden">
                 {mode === 'future' && (
                     <div className="absolute right-1 top-1 text-gray-600">
                         <ArrowDownToLine size={10} />
                     </div>
                 )}
                <div className="text-[10px] text-gray-500">强平价格 (Liq)</div>
                <div className="text-sm font-mono text-orange-400">{liqPrice ? liqPrice.toFixed(2) : '--'}</div>
            </div>
            <div className="bg-gray-900/50 p-1.5 rounded">
                <div className="text-[10px] text-gray-500">预估盈亏 (PNL)</div>
                <div className={`text-sm font-bold font-mono ${pnl && pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {pnl ? pnl.toFixed(2) : '--'}
                </div>
            </div>
            <div className="bg-gray-900/50 p-1.5 rounded">
                <div className="text-[10px] text-gray-500">收益率 (ROE)</div>
                <div className={`text-sm font-bold font-mono ${roe && roe >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {roe ? `${roe.toFixed(2)}%` : '--'}
                </div>
            </div>
        </div>

        <button
            onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs font-bold transition-colors shadow"
        >
            <Save size={14} />
            <span>保存模拟持仓</span>
        </button>
      </div>
    </div>
  );
};