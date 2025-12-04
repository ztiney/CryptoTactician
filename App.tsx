import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calculator } from './components/Calculator';
import { Positions } from './components/Positions';
import { Prediction } from './components/Prediction';
import { getTopCoins, searchCoins } from './services/api';
import { Coin, Position } from './types';
import { usePiP } from './hooks/usePiP';
import { Layers, Search, Calculator as CalcIcon, Gamepad2, Maximize2, Minimize2, Pin } from 'lucide-react';

type Tab = 'calculator' | 'prediction';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [activeCoin, setActiveCoin] = useState<Coin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('positions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  
  const { pipWindow, togglePiP } = usePiP();

  // Initial Data Load
  useEffect(() => {
    const loadCoins = async () => {
      const data = await getTopCoins();
      setCoins(data);
      if (data.length > 0 && !activeCoin) {
        setActiveCoin(data[0]);
      }
      // Initialize price map
      const prices: Record<string, number> = {};
      data.forEach(c => prices[c.id] = c.current_price);
      setCurrentPrices(prices);
    };
    loadCoins();
    
    // Refresh interval for ticker and prices
    const interval = setInterval(loadCoins, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Sync positions to storage
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

  // Main Content to Render
  const AppContent = (
    <div className="h-screen bg-gray-950 text-gray-200 font-sans selection:bg-accent-blue/30 flex flex-col overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center shrink-0">
          <div className="flex space-x-1 bg-gray-950 rounded p-1 border border-gray-800">
              <button 
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'calculator' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <CalcIcon size={14} /> 计算器
              </button>
              <button 
                onClick={() => setActiveTab('prediction')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'prediction' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <Gamepad2 size={14} /> 极速战法
              </button>
          </div>
           <button 
                onClick={togglePiP}
                className="bg-gray-800 border border-gray-700 text-accent-blue hover:text-white hover:border-accent-blue p-2 rounded-lg transition-all flex items-center gap-2"
                title="开启悬浮窗 (PiP) 以置顶显示"
            >
                {pipWindow ? <Minimize2 size={16} /> : <Pin size={16} />}
                <span className="hidden sm:inline text-xs font-bold">{pipWindow ? '返回' : '悬浮/置顶'}</span>
            </button>
      </div>

      <main className="flex-1 p-3 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-md mx-auto space-y-4 pb-6">
          
          {/* Search Bar (Only visible in Calculator tab for context) */}
          {activeTab === 'calculator' && (
             <div className="relative z-20">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="搜索币种 (e.g., BTC, SOL)..." 
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm focus:border-accent-blue outline-none transition-colors shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 mt-1 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {coins.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="p-3 text-xs text-gray-500 text-center">无搜索结果</div>
                        )}
                        {coins.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => handleSelectCoin(c)}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-gray-700 flex justify-between items-center border-b border-gray-700/50 last:border-0"
                            >
                                <span className="font-bold text-gray-200">{c.symbol.toUpperCase()}</span>
                                <span className="text-gray-400 font-mono">${c.current_price}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'calculator' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Calculator activeCoin={activeCoin} onSavePosition={handleSavePosition} />
                <Positions positions={positions} prices={currentPrices} onDelete={handleDeletePosition} />
            </div>
          ) : (
            <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Prediction currentPrices={currentPrices} />
            </div>
          )}

        </div>
      </main>
      
      {!pipWindow && (
        <footer className="p-2 text-center text-[10px] text-gray-600 border-t border-gray-900 shrink-0">
            CryptoTactician v1.1
        </footer>
      )}
    </div>
  );

  // If PiP is active, render content into the PiP window body using Portal
  if (pipWindow) {
    return createPortal(AppContent, pipWindow.document.body);
  }

  return (
      <>
        {/* Placeholder for main window when PiP is active could go here if we wanted to show something else, 
            but for now we just render the content normally if no PiP, or the placeholder below if PiP is active
            Wait, React Portal removes it from here. We need a placeholder in the main window.
        */}
        {pipWindow ? (
             <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-500 flex-col gap-4">
                <Layers size={48} className="opacity-20 animate-pulse"/>
                <p className="font-bold">应用正在悬浮窗中运行</p>
                <button 
                    onClick={togglePiP} 
                    className="px-6 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 text-sm text-white transition-colors"
                >
                    恢复到主窗口
                </button>
            </div>
        ) : AppContent}
      </>
  );
}