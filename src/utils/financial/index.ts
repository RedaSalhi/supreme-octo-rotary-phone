// ===========================================
// src/utils/financial/index.ts
// Main export file for all financial calculations
// ===========================================

// Portfolio calculations
export * from './portfolio';

// Risk metrics and calculations
export {
  calculateAllRiskMetrics,
  calculateVolatility,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateTrackingError,
  calculateSkewness,
  calculateKurtosis,
  calculateMaxDrawdown,
  calculateCalmarRatio,
  calculateDownsideDeviation,
  calculateAnnualizedReturn,
  calculateCumulativeReturns,
  calculateRollingVolatility,
  calculateRollingSharpe,
  calculateRollingMaxDrawdown,
  calculatePainIndex,
  calculateUlcerIndex,
  calculateBurkeRatio,
  calculateMartinRatio,
  calculateTailRatio
} from './riskMetrics';

// Value at Risk calculations
export {
  calculateVaR,
  calculateHistoricalVaR,
  calculateHistoricalCVaR,
  calculateMonteCarloVaR,
  calculateParametricVaR,
  calculateCVaR
} from './var';

// CAPM analysis
export * from './capm';

// Performance attribution
export {
  calculateTimeBasedAttribution,
  calculateTrackingErrorAttribution
} from './attribution';

// ===========================================
// Convenience aggregation functions
// ===========================================

import { calculateAllRiskMetrics } from './riskMetrics';
import { calculateVaR } from './var';
import { calculateCAPM } from './capm';
import { calculateTimeBasedAttribution, calculateTrackingErrorAttribution } from './attribution';
import type { Asset, Portfolio, PortfolioConstraints } from '../../types';

/**
 * Complete financial analysis for a portfolio
 */
export function performCompleteAnalysis(
  portfolio: Portfolio,
  benchmarkReturns?: number[],
  riskFreeRate: number = 0.02,
  portfolioValue: number = 1000000
) {
  const riskMetrics = calculateAllRiskMetrics(
    portfolio.returns,
    benchmarkReturns,
    riskFreeRate
  );
  
  const varAnalysis = calculateVaR(portfolio.returns, portfolioValue);
  
  const capmAnalysis = benchmarkReturns 
    ? calculateCAPM(portfolio.returns, benchmarkReturns, riskFreeRate)
    : null;
    
  const attributionAnalysis = benchmarkReturns
    ? calculateTimeBasedAttribution(portfolio.returns, benchmarkReturns, [portfolio.returns.length])
    : null;
    
  const trackingErrorAnalysis = benchmarkReturns
    ? calculateTrackingErrorAttribution(portfolio.returns, benchmarkReturns)
    : null;
  
  return {
    riskMetrics,
    varAnalysis,
    capmAnalysis,
    attributionAnalysis,
    trackingErrorAnalysis,
    portfolio: {
      totalValue: portfolio.totalValue,
      assets: portfolio.assets.length,
      lastUpdated: portfolio.updatedAt
    }
  };
}

// ===========================================
// Financial constants and utilities
// ===========================================

export const FINANCIAL_CONSTANTS = {
  TRADING_DAYS_PER_YEAR: 252,
  RISK_FREE_RATE_DEFAULT: 0.02,
  CONFIDENCE_LEVELS: {
    VAR_95: 0.95,
    VAR_99: 0.99,
    VAR_99_9: 0.999
  },
  PERIODS: {
    DAILY: 1,
    WEEKLY: 5,
    MONTHLY: 21,
    QUARTERLY: 63,
    YEARLY: 252
  }
} as const;

/**
 * Validate portfolio data for analysis
 */
export function validatePortfolioData(portfolio: Portfolio): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check basic structure
  if (!portfolio.assets || portfolio.assets.length === 0) {
    errors.push('Portfolio must contain at least one asset');
  }
  
  if (!portfolio.weights || portfolio.weights.length !== portfolio.assets.length) {
    errors.push('Number of weights must match number of assets');
  }
  
  // Check weight constraints
  const totalWeight = portfolio.weights?.reduce((sum, w) => sum + w, 0) || 0;
  if (Math.abs(totalWeight - 1) > 1e-6) {
    errors.push(`Portfolio weights must sum to 1, currently sum to ${totalWeight.toFixed(6)}`);
  }
  
  // Check for negative weights if short selling not allowed
  const hasNegativeWeights = portfolio.weights?.some(w => w < 0) || false;
  if (hasNegativeWeights && !portfolio.constraints?.allowShortSelling) {
    warnings.push('Portfolio contains negative weights but short selling constraints not specified');
  }
  
  // Check for sufficient return data
  const minReturnsLength = 30; // Minimum for meaningful analysis
  if (portfolio.returns.length < minReturnsLength) {
    warnings.push(`Portfolio has only ${portfolio.returns.length} return observations, recommend at least ${minReturnsLength}`);
  }
  
  // Check for missing asset data
  portfolio.assets.forEach((asset, i) => {
    if (!asset.returns || asset.returns.length === 0) {
      errors.push(`Asset ${asset.symbol} has no return data`);
    }
    
    if (asset.returns.length < portfolio.returns.length) {
      warnings.push(`Asset ${asset.symbol} has fewer returns than portfolio (${asset.returns.length} vs ${portfolio.returns.length})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format financial numbers for display
 */
export function formatFinancialNumber(
  value: number,
  type: 'currency' | 'percentage' | 'ratio' | 'basis_points' = 'currency',
  decimals?: number
): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals ?? 2,
        maximumFractionDigits: decimals ?? 2
      }).format(value);
      
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals ?? 2,
        maximumFractionDigits: decimals ?? 2
      }).format(value);
      
    case 'basis_points':
      return `${(value * 10000).toFixed(decimals ?? 0)} bps`;
      
    case 'ratio':
      return value.toFixed(decimals ?? 3);
      
    default:
      return value.toString();
  }
}