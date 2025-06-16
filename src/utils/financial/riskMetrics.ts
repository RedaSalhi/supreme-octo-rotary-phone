// ===========================================
// src/utils/financial/riskMetrics.ts
// ===========================================

/**
 * Core risk metrics calculations for portfolio analysis
 */

/**
 * Calculate annualized volatility from returns
 */
export function calculateVolatility(returns: number[], periodsPerYear: number = 252): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance * periodsPerYear);
}

/**
 * Calculate Sharpe ratio
 */
export function calculateSharpeRatio(
  returns: number[], 
  riskFreeRate: number = 0.02, 
  periodsPerYear: number = 252
): number {
  if (returns.length === 0) return 0;
  
  const annualizedReturn = calculateAnnualizedReturn(returns, periodsPerYear);
  const volatility = calculateVolatility(returns, periodsPerYear);
  
  if (volatility === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(cumulativeReturns: number[]): number {
  if (cumulativeReturns.length === 0) return 0;
  
  let peak = cumulativeReturns[0];
  let maxDrawdown = 0;
  
  for (const value of cumulativeReturns) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown;
}

/**
 * Calculate annualized return from periodic returns
 */
export function calculateAnnualizedReturn(returns: number[], periodsPerYear: number = 252): number {
  if (returns.length === 0) return 0;
  
  const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const periods = returns.length;
  
  return Math.pow(1 + totalReturn, periodsPerYear / periods) - 1;
}

/**
 * Calculate Value at Risk using parametric method
 */
export function calculateParametricVaR(returns: number[], confidenceLevel: number = 0.95): number {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = calculateVolatility(returns, 1); // Daily volatility
  
  // Z-score for confidence level
  const zScore = confidenceLevel === 0.95 ? 1.645 : 
                 confidenceLevel === 0.99 ? 2.326 : 
                 getZScore(confidenceLevel);
  
  return -(mean - zScore * volatility);
}

/**
 * Calculate Conditional Value at Risk (Expected Shortfall)
 */
export function calculateCVaR(returns: number[], confidenceLevel: number = 0.95): number {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  if (cutoffIndex === 0) return Math.abs(sortedReturns[0]);
  
  const tailReturns = sortedReturns.slice(0, cutoffIndex);
  const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  
  return -expectedShortfall;
}

/**
 * Get Z-score for confidence level (normal distribution)
 */
function getZScore(confidenceLevel: number): number {
  // Approximation for common confidence levels
  if (confidenceLevel >= 0.99) return 2.326;
  if (confidenceLevel >= 0.95) return 1.645;
  if (confidenceLevel >= 0.90) return 1.282;
  
  // More precise calculation would use inverse normal CDF
  return 1.645; // Default to 95%
}