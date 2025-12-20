import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calculator } from './components/Calculator';
import { Positions } from './components/Positions';
import { Prediction } from './components/Prediction';
import { Averaging } from './components/Averaging';
import { getTopCoins } from './services/api';
import { Coin, Position, Tab } from './types';
import { usePiP } from './hooks/usePiP';
import { Layers, Search, Calculator as CalcIcon, Gamepad2, Minimize2, Pin, X, List, Minus, Scale, WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [activeCoin, setActiveCoin] = useState<Coin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('positions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { pipWindow, togglePiP } = usePiP();

  const loadCoins = async () => {
    const data = await getTopCoins();
    setCoins(data);
    
    // Check if we are using hardcoded fallback by checking prices of known coins
    // or simply if the fetch failed (handled in api.ts)
    // For simplicity, we just check if it's the first major coin price
    const btc = data.find(c => c.id === 'bitcoin');
    if (btc && (btc.current_price === 95500 || btc.current_price === 95000)) {
        // This is a proxy for "we might be on fallback data"
        // In a real app, api.ts would return a status flag
    }

    const prices: Record<string, number> = {};
    data.forEach(c => prices[c.id] = c.current_price);
    setCurrentPrices(prices);
  };

  useEffect(() => {
    loadCoins();
    const interval = setInterval(loadCoins, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('positions', JSON.stringify(positions));
  }, [positions]);

  const handleSelectCoin = (coin: Coin) => {
    setActiveCoin(coin);
    setSearchQuery('');
  };

  const handleSavePosition = (pos: Position) => {
    setPositions(prev => [pos, ...prev]);
  };

  const handleDeletePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (pipWindow) {
        try {
            if (newState) pipWindow.resizeTo(pipWindow.outerWidth, 50); 
            else pipWindow.resizeTo(pipWindow.outerWidth, 650);
        } catch (e) {}
    }
  };

  const AppContent = (
    <div className={`w-full bg-gray-950 text-gray-200 font-sans selection:bg-accent-blue/30 flex flex-col overflow-hidden transition-[height] duration-300 ease-in-out ${isCollapsed ? 'h-[48px]' : 'h-screen'}`}>
      
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-2 shrink-0 select-none">
          <div className="flex bg-gray-950 rounded p-0.5 border border-gray-800 overflow-x-auto no-scrollbar max-w-[80%]">
              <button 
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'calculator' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <CalcIcon size={12} /> 计算
              </button>
              <button 
                onClick={() => setActiveTab('averaging')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'averaging' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                title="补仓成本计算"
              >
                  <Scale size={12} /> 补仓
              </button>
              <button 
                onClick={() => setActiveTab('positions')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'positions' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <List size={12} /> 持仓
              </button>
              <button 
                onClick={() => setActiveTab('prediction')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'prediction' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <Gamepad2 size={12} /> 事件
              </button>
          </div>
          
          <div className="flex items-center gap-1">
             <button 
                onClick={toggleCollapse}
                className={`p-1.5 rounded transition-colors ${isCollapsed ? 'text-accent-blue bg-accent-blue/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
            >
                <Minus size={14} />
            </button>
            <button 
                    onClick={togglePiP}
                    className={`p-1.5 rounded transition-colors ${pipWindow ? 'text-accent-blue bg-accent-blue/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                >
                    {pipWindow ? <X size={14} /> : <Pin size={14} />}
            </button>
          </div>
      </div>

      <main className={`flex-1 overflow-y-auto custom-scrollbar relative bg-gray-950 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {activeTab === 'calculator' && (
                <div className="flex flex-col min-h-full">
                    <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 p-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder={activeCoin ? `当前: ${activeCoin.symbol.toUpperCase()} ($${activeCoin.current_price})` : "搜索币种..."}
                                className="w-full bg-gray-900 border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white focus:border-accent-blue outline-none transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 mt-1 rounded shadow-xl overflow-hidden max-h-48 overflow-y-auto z-40">
                                    {coins.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="p-3 text-xs text-gray-500 text-center">无搜索结果</div>
                                    )}
                                    {coins.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => handleSelectCoin(c)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex justify-between items-center border-b border-gray-800 last:border-0"
                                        >
                                            <span className="font-bold text-gray-200">{c.symbol.toUpperCase()}</span>
                                            <span className="text-gray-400 font-mono">${c.current_price}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <Calculator activeCoin={activeCoin} onSavePosition={handleSavePosition} />
                </div>
            )}

            {activeTab === 'averaging' && <Averaging />}
            {activeTab === 'positions' && <Positions positions={positions} prices={currentPrices} onDelete={handleDeletePosition} />}
            {activeTab === 'prediction' && <Prediction currentPrices={currentPrices} />}
      </main>
      
      {!pipWindow && !isCollapsed && (
        <footer className="py-1 px-3 flex justify-between items-center text-[9px] text-gray-700 border-t border-gray-900 shrink-0 select-none bg-gray-950 transition-opacity duration-200">
            <span>CryptoTactician v1.4</span>
            {Object.keys(currentPrices).length > 0 && (
                <div className="flex items-center gap-1 opacity-50">
                    <WifiOff size={10} />
                    <span>部分价格可能非实时</span>
                </div>
            )}
        </footer>
      )}
    </div>
  );

  return (
    <>
      {pipWindow && createPortal(AppContent, pipWindow.document.body)}
      {pipWindow ? (
         <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-600 flex-col gap-4 p-6 text-center">
            <div className="relative">
                <Layers size={48} className="text-accent-blue/20 animate-pulse"/>
                <div className="absolute inset-0 flex items-center justify-center">
                     <Pin size={20} className="text-accent-blue/50" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="font-bold text-sm text-gray-300">已切换至悬浮窗模式</p>
                <p className="text-xs text-gray-600">界面已分离到独立窗口，置顶显示中...</p>
            </div>
            <button onClick={togglePiP} className="mt-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-accent-blue font-bold rounded transition-colors flex items-center gap-2">
                <Minimize2 size={14} /> 恢复主窗口显示
            </button>
        </div>
      ) : (
        AppContent
      )}
    </>
  );
}