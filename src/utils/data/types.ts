// ===========================================
// src/utils/data/types.ts
// ===========================================

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
  source: string;
  cached: boolean;
  timestamp: string;
}

export interface MarketDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  beta?: number;
  timestamp: string;
}