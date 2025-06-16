// ===========================================
// src/utils/financial/portfolio.ts
// Portfolio calculations and optimization
// ===========================================

import type { Asset, OptimizationResult, EfficientFrontierPoint, OptimizationType, PortfolioConstraints, ConvergenceInfo } from '../../types';
import { calculateVolatility, calculateSharpeRatio, calculateAnnualizedReturn } from './riskMetrics';

/**
 * Calculate portfolio variance
 */
export function calculatePortfolioVariance(weights: number[], covarianceMatrix: number[][]): number {
  const n = weights.length;
  let variance = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covarianceMatrix[i][j];
    }
  }
  
  return variance;
}

/**
 * Calculate covariance matrix from asset returns
 */
export function calculateCovarianceMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = calculateCovariance(assets[i].returns, assets[j].returns);
    }
  }
  
  return matrix;
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
 * Normalize weights to sum to 1
 */
export function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum === 0) return weights;
  return weights.map(w => w / sum);
}

/**
 * Portfolio optimization using Modern Portfolio Theory
 */

/**
 * Generate efficient frontier points
 */
export function generateEfficientFrontier(
  assets: Asset[],
  targetReturns: number[] = [],
  constraints: PortfolioConstraints = {},
  points: number = 50
): EfficientFrontierPoint[] {
  if (assets.length < 2) return [];
  
  const expectedReturns = assets.map(asset => calculateAnnualizedReturn(asset.returns));
  const covarianceMatrix = calculateCovarianceMatrix(assets);
  
  // Generate target returns if not provided
  if (targetReturns.length === 0) {
    const minReturn = Math.min(...expectedReturns);
    const maxReturn = Math.max(...expectedReturns);
    targetReturns = Array.from({ length: points }, (_, i) => 
      minReturn + (maxReturn - minReturn) * i / (points - 1)
    );
  }
  
  const frontierPoints: EfficientFrontierPoint[] = [];
  
  for (const targetReturn of targetReturns) {
    try {
      const weights = optimizeForTargetReturn(
        expectedReturns,
        covarianceMatrix,
        targetReturn,
        constraints
      );
      
      if (weights) {
        const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
        const portfolioRisk = Math.sqrt(calculatePortfolioVariance(weights, covarianceMatrix));
        const sharpeRatio = calculateSharpeRatio(
          assets.map((_, i) => weights.reduce((sum, w, j) => sum + w * assets[j].returns[i] || 0, 0))
        );
        
        frontierPoints.push({
          risk: portfolioRisk,
          return: portfolioReturn,
          weights,
          sharpeRatio
        });
      }
    } catch (error) {
      // Skip invalid points
      continue;
    }
  }
  
  return frontierPoints.sort((a, b) => a.risk - b.risk);
}

/**
 * Markowitz mean-variance optimization for target return
 */
export function optimizeForTargetReturn(
  expectedReturns: number[],
  covarianceMatrix: number[][],
  targetReturn: number,
  constraints: PortfolioConstraints = {}
): number[] | null {
  const n = expectedReturns.length;
  
  // Simple quadratic programming solution using method of Lagrange multipliers
  // This is a simplified implementation - for production, use a proper QP solver
  
  try {
    // Create augmented matrix for the KKT system
    const A = createAugmentedMatrix(covarianceMatrix, expectedReturns, constraints);
    const b = createConstraintVector(n, targetReturn, constraints);
    
    // Solve the linear system (simplified)
    const solution = solveLinearSystem(A, b);
    if (!solution) return null;
    
    // Extract weights (first n elements of solution)
    const weights = solution.slice(0, n);
    
    // Apply constraints and normalize
    return applyConstraints(weights, constraints);
  } catch (error) {
    return null;
  }
}

/**
 * Maximum Sharpe ratio optimization
 */
export function optimizeMaxSharpe(
  assets: Asset[],
  riskFreeRate: number = 0.02,
  constraints: PortfolioConstraints = {}
): OptimizationResult | null {
  const expectedReturns = assets.map(asset => calculateAnnualizedReturn(asset.returns));
  const covarianceMatrix = calculateCovarianceMatrix(assets);
  
  // Convert to excess returns
  const excessReturns = expectedReturns.map(r => r - riskFreeRate);
  
  try {
    // Solve for maximum Sharpe ratio portfolio
    const weights = optimizeMaxSharpeWeights(excessReturns, covarianceMatrix, constraints);
    if (!weights) return null;
    
    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    const portfolioRisk = Math.sqrt(calculatePortfolioVariance(weights, covarianceMatrix));
    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioRisk;
    
    return {
      type: 'maxSharpe',
      weights,
      expectedReturn: portfolioReturn,
      volatility: portfolioRisk,
      sharpeRatio,
      convergence: {
        converged: true,
        iterations: 1,
        objectiveValue: sharpeRatio
      },
      metrics: {
        volatility: portfolioRisk,
        sharpeRatio,
        maxDrawdown: 0, // Would need historical simulation
        beta: 1, // Would need benchmark
        alpha: 0, // Would need benchmark
        var95: 0, // Would need VaR calculation
        var99: 0,
        cvar95: 0,
        cvar99: 0
      }
    };
  } catch (error) {
    return null;
  }
}

/**
 * Minimum variance optimization
 */
export function optimizeMinVariance(
  assets: Asset[],
  constraints: PortfolioConstraints = {}
): OptimizationResult | null {
  const expectedReturns = assets.map(asset => calculateAnnualizedReturn(asset.returns));
  const covarianceMatrix = calculateCovarianceMatrix(assets);
  
  try {
    const weights = optimizeMinVarianceWeights(covarianceMatrix, constraints);
    if (!weights) return null;
    
    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    const portfolioRisk = Math.sqrt(calculatePortfolioVariance(weights, covarianceMatrix));
    const sharpeRatio = calculateSharpeRatio(
      assets.map((_, i) => weights.reduce((sum, w, j) => sum + w * assets[j].returns[i] || 0, 0))
    );
    
    return {
      type: 'minVariance',
      weights,
      expectedReturn: portfolioReturn,
      volatility: portfolioRisk,
      sharpeRatio,
      convergence: {
        converged: true,
        iterations: 1,
        objectiveValue: portfolioRisk
      },
      metrics: {
        volatility: portfolioRisk,
        sharpeRatio,
        maxDrawdown: 0,
        beta: 1,
        alpha: 0,
        var95: 0,
        var99: 0,
        cvar95: 0,
        cvar99: 0
      }
    };
  } catch (error) {
    return null;
  }
}

/**
 * Risk parity optimization
 */
export function optimizeRiskParity(
  assets: Asset[],
  constraints: PortfolioConstraints = {}
): OptimizationResult | null {
  const covarianceMatrix = calculateCovarianceMatrix(assets);
  const n = assets.length;
  
  try {
    // Start with equal weights
    let weights = new Array(n).fill(1/n);
    let iterations = 0;
    let converged = false;
    let objectiveValue = Infinity;
    
    // Iterative algorithm to find risk parity weights
    for (let iter = 0; iter < 100; iter++) {
      iterations = iter + 1;
      const riskContributions = calculateRiskContributions(weights, covarianceMatrix);
      const targetContribution = 1 / n;
      
      // Update weights based on risk contribution differences
      for (let i = 0; i < n; i++) {
        const adjustment = targetContribution / riskContributions[i];
        weights[i] *= Math.pow(adjustment, 0.1); // Small step size
      }
      
      // Normalize weights
      weights = normalizeWeights(weights);
      
      // Apply constraints
      weights = applyConstraints(weights, constraints) || weights;
      
      // Check convergence
      const maxDiff = Math.max(...riskContributions.map(rc => Math.abs(rc - targetContribution)));
      objectiveValue = maxDiff;
      if (maxDiff < 1e-6) {
        converged = true;
        break;
      }
    }
    
    const expectedReturns = assets.map(asset => calculateAnnualizedReturn(asset.returns));
    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    const portfolioRisk = Math.sqrt(calculatePortfolioVariance(weights, covarianceMatrix));
    const sharpeRatio = calculateSharpeRatio(
      assets.map((_, i) => weights.reduce((sum, w, j) => sum + w * assets[j].returns[i] || 0, 0))
    );
    
    return {
      type: 'riskParity',
      weights,
      expectedReturn: portfolioReturn,
      volatility: portfolioRisk,
      sharpeRatio,
      convergence: {
        converged,
        iterations,
        objectiveValue
      },
      metrics: {
        volatility: portfolioRisk,
        sharpeRatio,
        maxDrawdown: 0,
        beta: 1,
        alpha: 0,
        var95: 0,
        var99: 0,
        cvar95: 0,
        cvar99: 0
      }
    };
  } catch (error) {
    return null;
  }
}

/**
 * Calculate risk contributions for each asset
 */
export function calculateRiskContributions(weights: number[], covarianceMatrix: number[][]): number[] {
  const n = weights.length;
  const portfolioVariance = calculatePortfolioVariance(weights, covarianceMatrix);
  
  if (portfolioVariance === 0) return new Array(n).fill(0);
  
  const riskContributions: number[] = [];
  
  for (let i = 0; i < n; i++) {
    let marginalContribution = 0;
    for (let j = 0; j < n; j++) {
      marginalContribution += weights[j] * covarianceMatrix[i][j];
    }
    riskContributions.push((weights[i] * marginalContribution) / portfolioVariance);
  }
  
  return riskContributions;
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Create augmented matrix for KKT system
 */
function createAugmentedMatrix(
  covarianceMatrix: number[][],
  expectedReturns: number[],
  constraints: PortfolioConstraints
): number[][] {
  const n = expectedReturns.length;
  const size = n + 2; // n weights + 2 Lagrange multipliers
  
  const A: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Top-left: 2 * covariance matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      A[i][j] = 2 * covarianceMatrix[i][j];
    }
  }
  
  // Right columns: constraint gradients
  for (let i = 0; i < n; i++) {
    A[i][n] = 1; // Budget constraint
    A[i][n + 1] = expectedReturns[i]; // Return constraint
  }
  
  // Bottom rows: constraint equations
  for (let j = 0; j < n; j++) {
    A[n][j] = 1; // Budget constraint
    A[n + 1][j] = expectedReturns[j]; // Return constraint
  }
  
  return A;
}

/**
 * Create constraint vector
 */
function createConstraintVector(
  n: number,
  targetReturn: number,
  constraints: PortfolioConstraints
): number[] {
  const b = new Array(n + 2).fill(0);
  b[n] = 1; // Budget constraint (sum of weights = 1)
  b[n + 1] = targetReturn; // Return constraint
  return b;
}

/**
 * Simplified linear system solver (Gaussian elimination)
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) return null;
    
    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }
  
  return x;
}

/**
 * Optimize for maximum Sharpe ratio weights
 */
function optimizeMaxSharpeWeights(
  excessReturns: number[],
  covarianceMatrix: number[][],
  constraints: PortfolioConstraints
): number[] | null {
  // Simplified approach: assume no short-selling constraints
  // For production, use proper constrained optimization
  
  try {
    // Inverse covariance matrix
    const invCov = invertMatrix(covarianceMatrix);
    if (!invCov) return null;
    
    // Calculate optimal weights (unconstrained)
    const weights = multiplyMatrixVector(invCov, excessReturns);
    
    // Normalize and apply constraints
    const normalizedWeights = normalizeWeights(weights);
    return applyConstraints(normalizedWeights, constraints);
  } catch (error) {
    return null;
  }
}

/**
 * Optimize for minimum variance weights
 */
function optimizeMinVarianceWeights(
  covarianceMatrix: number[][],
  constraints: PortfolioConstraints
): number[] | null {
  try {
    const n = covarianceMatrix.length;
    const ones = new Array(n).fill(1);
    
    // Inverse covariance matrix
    const invCov = invertMatrix(covarianceMatrix);
    if (!invCov) return null;
    
    // Calculate optimal weights: (Σ^-1 * 1) / (1' * Σ^-1 * 1)
    const numerator = multiplyMatrixVector(invCov, ones);
    const denominator = ones.reduce((sum, _, i) => sum + numerator[i], 0);
    
    const weights = numerator.map(w => w / denominator);
    return applyConstraints(weights, constraints);
  } catch (error) {
    return null;
  }
}

/**
 * Apply portfolio constraints
 */
function applyConstraints(
  weights: number[],
  constraints: PortfolioConstraints
): number[] | null {
  let constrainedWeights = [...weights];
  
  // Apply min/max weight constraints
  if (constraints.minWeight !== undefined) {
    constrainedWeights = constrainedWeights.map(w => Math.max(w, constraints.minWeight!));
  }
  
  if (constraints.maxWeight !== undefined) {
    constrainedWeights = constrainedWeights.map(w => Math.min(w, constraints.maxWeight!));
  }
  
  // Ensure no short selling if not allowed
  if (!constraints.allowShortSelling) {
    constrainedWeights = constrainedWeights.map(w => Math.max(w, 0));
  }
  
  // Renormalize weights to sum to 1
  constrainedWeights = normalizeWeights(constrainedWeights);
  
  return constrainedWeights;
}

/**
 * Matrix inversion using Gaussian elimination
 */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
  ]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) return null;
    
    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  return augmented.map(row => row.slice(n));
}

/**
 * Multiply matrix by vector
 */
function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => 
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}