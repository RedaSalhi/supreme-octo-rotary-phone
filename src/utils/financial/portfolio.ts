// ===========================================
// src/utils/financial/portfolio.ts
// ===========================================

import type { Asset, Portfolio } from '../../types';

/**
 * Portfolio optimization and analysis utilities
 */

/**
 * Calculate portfolio returns from asset weights and returns
 */
export function calculatePortfolioReturns(assets: Asset[], weights: number[]): number[] {
  if (assets.length === 0 || weights.length !== assets.length) return [];
  
  const maxLength = Math.max(...assets.map(asset => asset.returns.length));
  const portfolioReturns: number[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    let portfolioReturn = 0;
    let validWeights = 0;
    
    for (let j = 0; j < assets.length; j++) {
      if (i < assets[j].returns.length) {
        portfolioReturn += weights[j] * assets[j].returns[i];
        validWeights += weights[j];
      }
    }
    
    if (validWeights > 0) {
      portfolioReturns.push(portfolioReturn / validWeights);
    }
  }
  
  return portfolioReturns;
}

/**
 * Calculate covariance matrix for assets
 */
export function calculateCovarianceMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const covariance: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      covariance[i][j] = calculateCovariance(assets[i].returns, assets[j].returns);
    }
  }
  
  return covariance;
}

/**
 * Calculate covariance between two return series
 */
export function calculateCovariance(returns1: number[], returns2: number[]): number {
  const minLength = Math.min(returns1.length, returns2.length);
  if (minLength < 2) return 0;
  
  const mean1 = returns1.slice(0, minLength).reduce((sum, r) => sum + r, 0) / minLength;
  const mean2 = returns2.slice(0, minLength).reduce((sum, r) => sum + r, 0) / minLength;
  
  let covariance = 0;
  for (let i = 0; i < minLength; i++) {
    covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
  }
  
  return covariance / (minLength - 1);
}

/**
 * Calculate correlation matrix for assets
 */
export function calculateCorrelationMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const correlation: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlation[i][j] = 1;
      } else {
        correlation[i][j] = calculateCorrelation(assets[i].returns, assets[j].returns);
      }
    }
  }
  
  return correlation;
}

/**
 * Calculate correlation coefficient between two return series
 */
export function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const covar = calculateCovariance(returns1, returns2);
  const vol1 = calculateVolatility(returns1, 1);
  const vol2 = calculateVolatility(returns2, 1);
  
  if (vol1 === 0 || vol2 === 0) return 0;
  
  return covar / (vol1 * vol2);
}

/**
 * Calculate portfolio variance using weights and covariance matrix
 */
export function calculatePortfolioVariance(weights: number[], covarianceMatrix: number[][]): number {
  let variance = 0;
  const n = weights.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covarianceMatrix[i][j];
    }
  }
  
  return variance;
}

/**
 * Normalize weights to sum to 1
 */
export function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return sum === 0 ? weights : weights.map(w => w / sum);
}

/**
 * Generate equal-weighted portfolio
 */
export function createEqualWeightedPortfolio(assets: Asset[]): number[] {
  const weight = 1 / assets.length;
  return new Array(assets.length).fill(weight);
}