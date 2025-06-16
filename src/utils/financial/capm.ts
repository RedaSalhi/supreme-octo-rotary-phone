// ===========================================
// src/utils/financial/capm.ts
// ===========================================

import type { CAPMResult } from '../../types';

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
  
  return {
    alpha,
    beta,
    rSquared,
    sharpeRatio,
    treynorRatio,
    informationRatio
  };
}

/**
 * Calculate Beta (systematic risk)
 */
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
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
  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const excessReturns = portfolioReturns.slice(0, minLength).map((r, i) => r - benchmarkReturns[i]);
  
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