// ===========================================
// src/utils/data/transformers.ts
// ===========================================

import type { Asset } from '../../types';
import type { MarketDataPoint, StockQuote } from './types';

/**
 * Data transformation utilities
 */

export function calculateReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const previousPrice = prices[i - 1];
    const currentPrice = prices[i];
    
    if (previousPrice > 0) {
      returns.push((currentPrice - previousPrice) / previousPrice);
    }
  }
  
  return returns;
}

export function calculateLogReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const previousPrice = prices[i - 1];
    const currentPrice = prices[i];
    
    if (previousPrice > 0 && currentPrice > 0) {
      logReturns.push(Math.log(currentPrice / previousPrice));
    }
  }
  
  return logReturns;
}

export function marketDataToAsset(
  symbol: string, 
  name: string, 
  quote: StockQuote, 
  historicalData: MarketDataPoint[]
): Asset {
  const prices = historicalData.map(point => point.close);
  const returns = calculateReturns(prices);
  
  return {
    symbol,
    name,
    price: quote.price,
    returns,
    sector: undefined, // Would need to get from company profile
    marketCap: undefined // Would need to get from company profile
  };
}

export function resampleData(
  data: MarketDataPoint[], 
  targetFrequency: 'daily' | 'weekly' | 'monthly'
): MarketDataPoint[] {
  if (data.length === 0) return [];
  
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  switch (targetFrequency) {
    case 'weekly':
      return resampleToWeekly(sortedData);
    case 'monthly':
      return resampleToMonthly(sortedData);
    default:
      return sortedData;
  }
}

function resampleToWeekly(data: MarketDataPoint[]): MarketDataPoint[] {
  const weeklyData: MarketDataPoint[] = [];
  let currentWeek: MarketDataPoint[] = [];
  let currentWeekStart = getWeekStart(new Date(data[0].timestamp));
  
  for (const point of data) {
    const pointDate = new Date(point.timestamp);
    const pointWeekStart = getWeekStart(pointDate);
    
    if (pointWeekStart.getTime() === currentWeekStart.getTime()) {
      currentWeek.push(point);
    } else {
      if (currentWeek.length > 0) {
        weeklyData.push(aggregateWeeklyData(currentWeek));
      }
      currentWeek = [point];
      currentWeekStart = pointWeekStart;
    }
  }
  
  if (currentWeek.length > 0) {
    weeklyData.push(aggregateWeeklyData(currentWeek));
  }
  
  return weeklyData;
}

function resampleToMonthly(data: MarketDataPoint[]): MarketDataPoint[] {
  const monthlyData: MarketDataPoint[] = [];
  const groupedByMonth = new Map<string, MarketDataPoint[]>();
  
  for (const point of data) {
    const date = new Date(point.timestamp);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!groupedByMonth.has(monthKey)) {
      groupedByMonth.set(monthKey, []);
    }
    groupedByMonth.get(monthKey)!.push(point);
  }
  
  for (const monthData of groupedByMonth.values()) {
    monthlyData.push(aggregateMonthlyData(monthData));
  }
  
  return monthlyData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

function aggregateWeeklyData(weekData: MarketDataPoint[]): MarketDataPoint {
  const sorted = weekData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  return {
    timestamp: sorted[sorted.length - 1].timestamp, // Last day of week
    open: sorted[0].open,
    high: Math.max(...sorted.map(d => d.high)),
    low: Math.min(...sorted.map(d => d.low)),
    close: sorted[sorted.length - 1].close,
    volume: sorted.reduce((sum, d) => sum + d.volume, 0)
  };
}

function aggregateMonthlyData(monthData: MarketDataPoint[]): MarketDataPoint {
  const sorted = monthData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  return {
    timestamp: sorted[sorted.length - 1].timestamp, // Last day of month
    open: sorted[0].open,
    high: Math.max(...sorted.map(d => d.high)),
    low: Math.min(...sorted.map(d => d.low)),
    close: sorted[sorted.length - 1].close,
    volume: sorted.reduce((sum, d) => sum + d.volume, 0)
  };
}

// ===========================================
// src/utils/validation/schemas.ts
// ===========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PortfolioValidationOptions {
  minAssets?: number;
  maxAssets?: number;
  allowNegativeWeights?: boolean;
  requireNormalizedWeights?: boolean;
  minWeight?: number;
  maxWeight?: number;
}

export interface AssetValidationOptions {
  minPrice?: number;
  maxPrice?: number;
  minReturnsLength?: number;
  maxReturnsLength?: number;
  allowInfiniteReturns?: boolean;
}
