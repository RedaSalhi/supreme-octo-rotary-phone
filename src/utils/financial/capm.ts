// ===========================================
// src/utils/financial/capm.ts
// ===========================================

import type { CAPMResult } from '../../types';
import { 
  calculateSharpeRatio, 
  calculateAnnualizedReturn, 
  calculateVolatility 
} from './riskMetrics';

/**
 * Capital Asset Pricing Model calculations
 */

/**
 * Calculate CAPM metrics for a portfolio vs benchmark
 */
export function calculateCAPM(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.02,
  periodsPerYear: number = 252
): CAPMResult {
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);
  const alpha = calculateAlpha(portfolioReturns, benchmarkReturns, riskFreeRate, beta, periodsPerYear);
  const rSquared = calculateRSquared(portfolioReturns, benchmarkReturns);
  const sharpeRatio = calculateSharpeRatio(portfolioReturns, riskFreeRate, periodsPerYear);
  const treynorRatio = calculateTreynorRatio(portfolioReturns, riskFreeRate, beta, periodsPerYear);
  const informationRatio = calculateInformationRatio(portfolioReturns, benchmarkReturns, periodsPerYear);
  
  // Calculate additional required metrics
  const marketReturn = calculateAnnualizedReturn(benchmarkReturns, periodsPerYear);
  const trackingError = calculateTrackingError(portfolioReturns, benchmarkReturns, periodsPerYear);
  const residualVolatility = calculateResidualVolatility(portfolioReturns, benchmarkReturns, beta, periodsPerYear);
  
  return {
    alpha,
    beta,
    rSquared,
    sharpeRatio,
    treynorRatio,
    informationRatio,
    marketReturn,
    riskFreeRate,
    trackingError,
    residualVolatility
  };
}

/**
 * Calculate Beta (systematic risk)
 */
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2 || 
      portfolioReturns.length !== benchmarkReturns.length) {
    return 0;
  }

  const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
  const benchmarkVariance = calculateVariance(benchmarkReturns);
  
  if (benchmarkVariance === 0) return 0;
  
  return covariance / benchmarkVariance;
}

/**
 * Calculate Alpha (excess return vs expected return)
 */
export function calculateAlpha(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number,
  beta: number,
  periodsPerYear: number = 252
): number {
  const portfolioReturn = calculateAnnualizedReturn(portfolioReturns, periodsPerYear);
  const benchmarkReturn = calculateAnnualizedReturn(benchmarkReturns, periodsPerYear);
  
  const expectedReturn = riskFreeRate + beta * (benchmarkReturn - riskFreeRate);
  
  return portfolioReturn - expectedReturn;
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateRSquared(portfolioReturns: number[], benchmarkReturns: number[]): number {
  const correlation = calculateCorrelation(portfolioReturns, benchmarkReturns);
  return Math.pow(correlation, 2);
}

/**
 * Calculate Treynor Ratio
 */
export function calculateTreynorRatio(
  portfolioReturns: number[],
  riskFreeRate: number,
  beta: number,
  periodsPerYear: number = 252
): number {
  if (beta === 0) return 0;
  
  const annualizedReturn = calculateAnnualizedReturn(portfolioReturns, periodsPerYear);
  return (annualizedReturn - riskFreeRate) / beta;
}

/**
 * Calculate Information Ratio
 */
export function calculateInformationRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  periodsPerYear: number = 252
): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) {
    return 0;
  }

  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const excessReturns = portfolioReturns.slice(0, minLength).map((r, i) => r - benchmarkReturns[i]);
  
  if (excessReturns.length === 0) {
    return 0;
  }

  const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
  const trackingError = calculateVolatility(excessReturns, periodsPerYear);
  
  if (trackingError === 0) return 0;
  
  return (meanExcessReturn * periodsPerYear) / trackingError;
}

/**
 * Calculate variance of returns
 */
function calculateVariance(returns: number[]): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
}

/**
 * Calculate covariance between two return series
 */
function calculateCovariance(returns1: number[], returns2: number[]): number {
  if (returns1.length < 2 || returns2.length < 2 || returns1.length !== returns2.length) {
    return 0;
  }

  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;

  return returns1.reduce((sum, r, i) => 
    sum + (r - mean1) * (returns2[i] - mean2), 0
  ) / (returns1.length - 1);
}

/**
 * Calculate correlation between two return series
 */
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length < 2 || returns2.length < 2 || returns1.length !== returns2.length) {
    return 0;
  }

  const covariance = calculateCovariance(returns1, returns2);
  const stdDev1 = Math.sqrt(calculateVariance(returns1));
  const stdDev2 = Math.sqrt(calculateVariance(returns2));

  if (stdDev1 === 0 || stdDev2 === 0) {
    return 0;
  }

  return covariance / (stdDev1 * stdDev2);
}

/**
 * Calculate tracking error (standard deviation of excess returns)
 */
function calculateTrackingError(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  periodsPerYear: number = 252
): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) {
    return 0;
  }

  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const excessReturns = portfolioReturns
    .slice(0, minLength)
    .map((ret, i) => ret - benchmarkReturns[i]);
  
  return calculateVolatility(excessReturns, periodsPerYear);
}

/**
 * Calculate residual volatility (standard deviation of residuals)
 */
function calculateResidualVolatility(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  beta: number,
  periodsPerYear: number = 252
): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) {
    return 0;
  }

  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const residuals = portfolioReturns
    .slice(0, minLength)
    .map((ret, i) => ret - (beta * benchmarkReturns[i]));
  
  return calculateVolatility(residuals, periodsPerYear);
}