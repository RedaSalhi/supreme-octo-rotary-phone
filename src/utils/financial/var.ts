// ===========================================
// src/utils/financial/var.ts
// ===========================================

import type { VaRResult } from '../../types';

/**
 * Value at Risk calculation methods
 */

/**
 * Calculate comprehensive VaR using multiple methods
 */
export function calculateVaR(
  returns: number[], 
  portfolioValue: number = 1000000,
  confidenceLevels: number[] = [0.95, 0.99]
): VaRResult {
  const result: VaRResult = {
    parametric: {
      var95: 0,
      var99: 0,
      cvar95: 0,
      cvar99: 0
    },
    historical: {
      var95: 0,
      var99: 0,
      cvar95: 0,
      cvar99: 0
    }
  };
  
  // Parametric VaR
  result.parametric.var95 = calculateParametricVaR(returns, 0.95) * portfolioValue;
  result.parametric.var99 = calculateParametricVaR(returns, 0.99) * portfolioValue;
  result.parametric.cvar95 = calculateCVaR(returns, 0.95) * portfolioValue;
  result.parametric.cvar99 = calculateCVaR(returns, 0.99) * portfolioValue;
  
  // Historical VaR
  result.historical.var95 = calculateHistoricalVaR(returns, 0.95) * portfolioValue;
  result.historical.var99 = calculateHistoricalVaR(returns, 0.99) * portfolioValue;
  result.historical.cvar95 = calculateHistoricalCVaR(returns, 0.95) * portfolioValue;
  result.historical.cvar99 = calculateHistoricalCVaR(returns, 0.99) * portfolioValue;
  
  return result;
}

/**
 * Historical Value at Risk
 */
export function calculateHistoricalVaR(returns: number[], confidenceLevel: number = 0.95): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  return -sortedReturns[Math.max(0, index - 1)];
}

/**
 * Historical Conditional Value at Risk
 */
export function calculateHistoricalCVaR(returns: number[], confidenceLevel: number = 0.95): number {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  if (cutoffIndex === 0) return Math.abs(sortedReturns[0]);
  
  const tailReturns = sortedReturns.slice(0, cutoffIndex);
  const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  
  return -expectedShortfall;
}

/**
 * Monte Carlo VaR simulation
 */
export function calculateMonteCarloVaR(
  meanReturn: number,
  volatility: number,
  portfolioValue: number = 1000000,
  timeHorizon: number = 1,
  simulations: number = 10000,
  confidenceLevel: number = 0.95
): { var: number; cvar: number; simulations: number } {
  const simulatedReturns: number[] = [];
  
  for (let i = 0; i < simulations; i++) {
    const randomReturn = generateNormalRandom(meanReturn * timeHorizon, volatility * Math.sqrt(timeHorizon));
    simulatedReturns.push(randomReturn);
  }
  
  const var95 = calculateHistoricalVaR(simulatedReturns, confidenceLevel) * portfolioValue;
  const cvar95 = calculateHistoricalCVaR(simulatedReturns, confidenceLevel) * portfolioValue;
  
  return {
    var: var95,
    cvar: cvar95,
    simulations
  };
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function generateNormalRandom(mean: number = 0, standardDeviation: number = 1): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  
  const standardNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + standardDeviation * standardNormal;
}

/**
 * Parametric Value at Risk (assuming normal distribution)
 */
export function calculateParametricVaR(returns: number[], confidenceLevel: number = 0.95): number {
  if (returns.length === 0) return 0;
  
  // Calculate mean and standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Get z-score for confidence level
  const zScore = getZScore(confidenceLevel);
  
  // Parametric VaR = -z * σ - μ
  return -(zScore * stdDev + mean);
}

/**
 * Parametric Conditional Value at Risk (assuming normal distribution)
 */
export function calculateCVaR(returns: number[], confidenceLevel: number = 0.95): number {
  if (returns.length === 0) return 0;
  
  // Calculate mean and standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Get z-score for confidence level
  const zScore = getZScore(confidenceLevel);
  
  // Calculate CVaR using normal distribution formula
  // CVaR = -μ - σ * φ(z) / (1 - α)
  const normalPDF = Math.exp(-0.5 * Math.pow(zScore, 2)) / Math.sqrt(2 * Math.PI);
  return -(mean + stdDev * normalPDF / (1 - confidenceLevel));
}

/**
 * Get z-score for a given confidence level
 */
function getZScore(confidenceLevel: number): number {
  // Common confidence levels and their z-scores
  const zScores: { [key: number]: number } = {
    0.99: 2.326,
    0.95: 1.645,
    0.90: 1.282,
    0.85: 1.036,
    0.80: 0.842
  };
  
  return zScores[confidenceLevel] || 1.645; // Default to 95% confidence if not found
}