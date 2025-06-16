export interface Asset {
  id: string;
  symbol: string;
  name: string;
  expectedReturn: number;
  volatility: number;
  correlation: Record<string, number>;
  price: number;
  quantity: number;
}

export interface Portfolio {
  assets: Asset[];
  weights: Record<string, number>;
  lastUpdated: Date;
}

export type PortfolioWeight = number; 