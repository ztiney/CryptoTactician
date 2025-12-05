export type TradeSide = 'long' | 'short';
export type TradeMode = 'spot' | 'future';
export type AmountUnit = 'USDT' | 'COIN';
export type CalculationBasis = 'principal' | 'total'; // Only relevant if unit is USDT

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export interface Position {
  id: string;
  coinId: string;
  symbol: string;
  entryPrice: number;
  amount: number; // In base currency (e.g., amount of BTC)
  leverage: number;
  side: TradeSide;
  mode: TradeMode;
  timestamp: number;
}

export interface PredictionGame {
  id: string;
  symbol: string; // BTC or ETH
  startPrice: number;
  targetTime: number; // Timestamp when it ends
  duration: number; // Minutes
  direction: 'up' | 'down'; // User prediction
  betAmount: number; // New: Betting amount
  status: 'active' | 'won' | 'lost';
  settledPrice?: number;
  pnl?: number; // New: Resulting PnL
}