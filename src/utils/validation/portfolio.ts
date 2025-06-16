// ===========================================
// src/utils/validation/portfolio.ts
// ===========================================

import type { Asset, Portfolio } from '../../types';
import type { ValidationResult, PortfolioValidationOptions } from './schemas';
import { validateAsset } from './assets';

export function validatePortfolio(
  portfolio: Portfolio, 
  options: PortfolioValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  
  const {
    minAssets = 1,
    maxAssets = 50,
    allowNegativeWeights = false,
    requireNormalizedWeights = true,
    minWeight = 0,
    maxWeight = 1
  } = options;
  
  // Check number of assets
  if (portfolio.assets.length < minAssets) {
    errors.push(`Portfolio must have at least ${minAssets} asset(s)`);
  }
  
  if (portfolio.assets.length > maxAssets) {
    errors.push(`Portfolio cannot have more than ${maxAssets} assets`);
  }
  
  // Check weights length matches assets length
  if (portfolio.weights.length !== portfolio.assets.length) {
    errors.push('Number of weights must match number of assets');
  }
  
  // Validate weights
  const weightValidation = validateWeights(portfolio.weights, {
    allowNegative: allowNegativeWeights,
    requireNormalized: requireNormalizedWeights,
    minWeight,
    maxWeight
  });
  
  errors.push(...weightValidation.errors);
  
  // Validate each asset
  portfolio.assets.forEach((asset, index) => {
    const assetValidation = validateAsset(asset);
    if (!assetValidation.isValid) {
      errors.push(`Asset ${index + 1} (${asset.symbol}): ${assetValidation.errors.join(', ')}`);
    }
  });
  
  // Check portfolio value
  if (portfolio.totalValue <= 0) {
    errors.push('Portfolio total value must be positive');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateWeights(
  weights: number[], 
  options: {
    allowNegative?: boolean;
    requireNormalized?: boolean;
    minWeight?: number;
    maxWeight?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  
  const {
    allowNegative = false,
    requireNormalized = true,
    minWeight = 0,
    maxWeight = 1
  } = options;
  
  if (weights.length === 0) {
    errors.push('Weights array cannot be empty');
    return { isValid: false, errors };
  }
  
  // Check for invalid numbers
  const invalidWeights = weights.filter(w => !isFinite(w) || isNaN(w));
  if (invalidWeights.length > 0) {
    errors.push('All weights must be finite numbers');
  }
  
  // Check weight constraints
  weights.forEach((weight, index) => {
    if (!allowNegative && weight < 0) {
      errors.push(`Weight ${index + 1} cannot be negative`);
    }
    
    if (weight < minWeight) {
      errors.push(`Weight ${index + 1} must be at least ${minWeight}`);
    }
    
    if (weight > maxWeight) {
      errors.push(`Weight ${index + 1} cannot exceed ${maxWeight}`);
    }
  });
  
  // Check if weights sum to 1 (normalized)
  if (requireNormalized) {
    const sum = weights.reduce((acc, w) => acc + w, 0);
    const tolerance = 1e-6;
    
    if (Math.abs(sum - 1) > tolerance) {
      errors.push(`Weights must sum to 1, current sum: ${sum.toFixed(6)}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}