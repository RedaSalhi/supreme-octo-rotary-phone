// Financial data types
export interface StockData {
  symbol: string;
  prices: number[];
  returns: number[];
  timestamps: string[];
  metadata: {
    source: string;
    lastUpdated: string;
    dataQuality: 'Good' | 'Fair' | 'Poor';
  };
}

export interface Portfolio {
  id: string;
  name: string;
  assets: Asset[];
  weights: number[];
  createdAt: string;
  lastUpdated: string;
}

export interface Asset {
  symbol: string;
  name: string;
  sector?: string;
  weight: number;
  currentPrice?: number;
  change24h?: number;
}

export interface VaRResult {
  individual?: IndividualVaRResult[];
  portfolio?: PortfolioVaRResult;
  method: VaRMethod;
  confidenceLevel: number;
  timeframe: string;
  calculatedAt: string;
}

export type VaRMethod = 'parametric' | 'historical' | 'monte_carlo';

export interface OptimizationResult {
  type: 'max_sharpe' | 'min_variance' | 'target_return' | 'target_risk';
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  efficientFrontier?: EfficientFrontierPoint[];
}

export interface EfficientFrontierPoint {
  risk: number;
  return: number;
  sharpe: number;
}