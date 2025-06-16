// ===========================================
// src/utils/financial/riskMetrics.ts
// Advanced Risk Metrics (Updated)
// ===========================================

/**
 * Comprehensive risk metrics calculations for portfolio analysis
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
 * Calculate Sortino ratio (downside deviation-adjusted Sharpe)
 */
export function calculateSortinoRatio(
  returns: number[],
  targetReturn: number = 0,
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): number {
  if (returns.length === 0) return 0;
  
  const annualizedReturn = calculateAnnualizedReturn(returns, periodsPerYear);
  const downsideDeviation = calculateDownsideDeviation(returns, targetReturn, periodsPerYear);
  
  if (downsideDeviation === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Calmar ratio (return to max drawdown ratio)
 */
export function calculateCalmarRatio(
  returns: number[],
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): number {
  if (returns.length === 0) return 0;
  
  const annualizedReturn = calculateAnnualizedReturn(returns, periodsPerYear);
  const cumulativeReturns = calculateCumulativeReturns(returns);
  const maxDrawdown = calculateMaxDrawdown(cumulativeReturns);
  
  if (maxDrawdown === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / maxDrawdown;
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
 * Calculate downside deviation
 */
export function calculateDownsideDeviation(
  returns: number[],
  targetReturn: number = 0,
  periodsPerYear: number = 252
): number {
  if (returns.length === 0) return 0;
  
  const downsideReturns = returns.filter(ret => ret < targetReturn);
  
  if (downsideReturns.length === 0) return 0;
  
  const downsideVariance = downsideReturns.reduce(
    (sum, ret) => sum + Math.pow(ret - targetReturn, 2), 0
  ) / downsideReturns.length;
  
  return Math.sqrt(downsideVariance * periodsPerYear);
}

/**
 * Calculate tracking error
 */
export function calculateTrackingError(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  periodsPerYear: number = 252
): number {
  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  
  if (minLength === 0) return 0;
  
  const excessReturns = portfolioReturns
    .slice(0, minLength)
    .map((ret, i) => ret - benchmarkReturns[i]);
  
  return calculateVolatility(excessReturns, periodsPerYear);
}

/**
 * Calculate Information Ratio
 */
export function calculateInformationRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  periodsPerYear: number = 252
): number {
  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  
  if (minLength === 0) return 0;
  
  const excessReturns = portfolioReturns
    .slice(0, minLength)
    .map((ret, i) => ret - benchmarkReturns[i]);
  
  const meanExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  const trackingError = calculateVolatility(excessReturns, periodsPerYear);
  
  if (trackingError === 0) return 0;
  
  return (meanExcessReturn * periodsPerYear) / trackingError;
}

/**
 * Calculate skewness (asymmetry of return distribution)
 */
export function calculateSkewness(returns: number[]): number {
  if (returns.length < 3) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  const skewness = returns.reduce((sum, ret) => 
    sum + Math.pow((ret - mean) / stdDev, 3), 0) / returns.length;
  
  return skewness;
}

/**
 * Calculate kurtosis (tail risk/fat tails)
 */
export function calculateKurtosis(returns: number[]): number {
  if (returns.length < 4) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  const kurtosis = returns.reduce((sum, ret) => 
    sum + Math.pow((ret - mean) / stdDev, 4), 0) / returns.length;
  
  return kurtosis - 3; // Excess kurtosis (normal distribution = 0)
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
 * Calculate cumulative returns
 */
export function calculateCumulativeReturns(returns: number[]): number[] {
  const cumulative: number[] = [];
  let cumulativeValue = 1;
  
  for (const ret of returns) {
    cumulativeValue *= (1 + ret);
    cumulative.push(cumulativeValue);
  }
  
  return cumulative;
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
                 confidenceLevel === 0.975 ? 1.96 : 1.645;
  
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
  const expectedShortfall = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
  
  return -expectedShortfall;
}

/**
 * Calculate rolling volatility
 */
export function calculateRollingVolatility(
  returns: number[],
  window: number = 30,
  periodsPerYear: number = 252
): number[] {
  const rollingVol: number[] = [];
  
  for (let i = window - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window + 1, i + 1);
    rollingVol.push(calculateVolatility(windowReturns, periodsPerYear));
  }
  
  return rollingVol;
}

/**
 * Calculate rolling Sharpe ratio
 */
export function calculateRollingSharpe(
  returns: number[],
  window: number = 30,
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): number[] {
  const rollingSharpe: number[] = [];
  
  for (let i = window - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window + 1, i + 1);
    rollingSharpe.push(calculateSharpeRatio(windowReturns, riskFreeRate, periodsPerYear));
  }
  
  return rollingSharpe;
}

/**
 * Calculate rolling maximum drawdown
 */
export function calculateRollingMaxDrawdown(
  returns: number[],
  window: number = 252
): number[] {
  const rollingDrawdown: number[] = [];
  
  for (let i = window - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window + 1, i + 1);
    const cumulativeReturns = calculateCumulativeReturns(windowReturns);
    rollingDrawdown.push(calculateMaxDrawdown(cumulativeReturns));
  }
  
  return rollingDrawdown;
}

/**
 * Calculate pain index (average drawdown)
 */
export function calculatePainIndex(returns: number[]): number {
  const cumulativeReturns = calculateCumulativeReturns(returns);
  let peak = cumulativeReturns[0];
  let sumDrawdowns = 0;
  
  for (const value of cumulativeReturns) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    sumDrawdowns += drawdown;
  }
  
  return sumDrawdowns / cumulativeReturns.length;
}

/**
 * Calculate Ulcer Index (volatility of drawdown)
 */
export function calculateUlcerIndex(returns: number[], periodsPerYear: number = 252): number {
  const cumulativeReturns = calculateCumulativeReturns(returns);
  let peak = cumulativeReturns[0];
  const drawdowns: number[] = [];
  
  for (const value of cumulativeReturns) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    drawdowns.push(drawdown);
  }
  
  const meanDrawdown = drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length;
  const drawdownVariance = drawdowns.reduce((sum, dd) => 
    sum + Math.pow(dd - meanDrawdown, 2), 0) / drawdowns.length;
  
  return Math.sqrt(drawdownVariance * periodsPerYear);
}

/**
 * Calculate Burke Ratio (return to Ulcer Index ratio)
 */
export function calculateBurkeRatio(
  returns: number[],
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): number {
  const annualizedReturn = calculateAnnualizedReturn(returns, periodsPerYear);
  const ulcerIndex = calculateUlcerIndex(returns, periodsPerYear);
  
  if (ulcerIndex === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / ulcerIndex;
}

/**
 * Calculate Martin Ratio (return to Ulcer Index, alternative calculation)
 */
export function calculateMartinRatio(
  returns: number[],
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): number {
  // Similar to Burke ratio but with different Ulcer Index calculation
  return calculateBurkeRatio(returns, riskFreeRate, periodsPerYear);
}

/**
 * Calculate tail ratio (95th percentile / 5th percentile)
 */
export function calculateTailRatio(returns: number[]): number {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const length = sortedReturns.length;
  
  const percentile5 = sortedReturns[Math.floor(0.05 * length)];
  const percentile95 = sortedReturns[Math.floor(0.95 * length)];
  
  if (percentile5 === 0) return 0;
  
  return Math.abs(percentile95 / percentile5);
}

/**
 * Calculate comprehensive risk metrics
 */
export function calculateAllRiskMetrics(
  returns: number[],
  benchmarkReturns?: number[],
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): {
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  skewness: number;
  kurtosis: number;
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  trackingError?: number;
  informationRatio?: number;
  painIndex: number;
  ulcerIndex: number;
  burkeRatio: number;
  tailRatio: number;
} {
  const cumulativeReturns = calculateCumulativeReturns(returns);
  
  const baseMetrics = {
    volatility: calculateVolatility(returns, periodsPerYear),
    sharpeRatio: calculateSharpeRatio(returns, riskFreeRate, periodsPerYear),
    sortinoRatio: calculateSortinoRatio(returns, 0, riskFreeRate, periodsPerYear),
    calmarRatio: calculateCalmarRatio(returns, riskFreeRate, periodsPerYear),
    maxDrawdown: calculateMaxDrawdown(cumulativeReturns),
    skewness: calculateSkewness(returns),
    kurtosis: calculateKurtosis(returns),
    var95: calculateParametricVaR(returns, 0.95),
    var99: calculateParametricVaR(returns, 0.99),
    cvar95: calculateCVaR(returns, 0.95),
    cvar99: calculateCVaR(returns, 0.99),
    painIndex: calculatePainIndex(returns),
    ulcerIndex: calculateUlcerIndex(returns, periodsPerYear),
    burkeRatio: calculateBurkeRatio(returns, riskFreeRate, periodsPerYear),
    tailRatio: calculateTailRatio(returns)
  };
  
  if (benchmarkReturns) {
    return {
      ...baseMetrics,
      trackingError: calculateTrackingError(returns, benchmarkReturns, periodsPerYear),
      informationRatio: calculateInformationRatio(returns, benchmarkReturns, periodsPerYear)
    };
  }
  
  return baseMetrics;
}