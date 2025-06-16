// src/types/index.ts
export interface Asset {
  symbol: string;
  name: string;
  price: number;
  returns: number[];
  weight?: number;
  sector?: string;
  marketCap?: number;
}

export interface Portfolio {
  assets: Asset[];
  weights: number[];
  totalValue: number;
  returns: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  trackingError?: number;
}

export interface VaRResult {
  parametric: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
  };
  historical: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
  };
  monteCarlo?: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
    simulations: number;
  };
}

export interface CAPMResult {
  alpha: number;
  beta: number;
  rSquared: number;
  sharpeRatio: number;
  treynorRatio: number;
  informationRatio: number;
}
