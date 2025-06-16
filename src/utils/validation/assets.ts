// ===========================================
// src/utils/validation/asset.ts
// ===========================================

import type { Asset } from '../../types';
import type { ValidationResult, AssetValidationOptions } from './schemas';

export function validateAsset(
  asset: Asset, 
  options: AssetValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  
  const {
    minPrice = 0.01,
    maxPrice = 1000000,
    minReturnsLength = 10,
    maxReturnsLength = 10000,
    allowInfiniteReturns = false
  } = options;
  
  // Validate symbol
  if (!asset.symbol || typeof asset.symbol !== 'string') {
    errors.push('Asset symbol is required and must be a string');
  } else if (asset.symbol.trim().length === 0) {
    errors.push('Asset symbol cannot be empty');
  } else if (!/^[A-Z0-9.-]+$/i.test(asset.symbol)) {
    errors.push('Asset symbol contains invalid characters');
  }
  
  // Validate name
  if (!asset.name || typeof asset.name !== 'string') {
    errors.push('Asset name is required and must be a string');
  } else if (asset.name.trim().length === 0) {
    errors.push('Asset name cannot be empty');
  }
  
  // Validate price
  if (typeof asset.price !== 'number' || !isFinite(asset.price)) {
    errors.push('Asset price must be a finite number');
  } else if (asset.price < minPrice) {
    errors.push(`Asset price must be at least ${minPrice}`);
  } else if (asset.price > maxPrice) {
    errors.push(`Asset price cannot exceed ${maxPrice}`);
  }
  
  // Validate returns
  if (!Array.isArray(asset.returns)) {
    errors.push('Asset returns must be an array');
  } else {
    if (asset.returns.length < minReturnsLength) {
      errors.push(`Asset must have at least ${minReturnsLength} return observations`);
    }
    
    if (asset.returns.length > maxReturnsLength) {
      errors.push(`Asset cannot have more than ${maxReturnsLength} return observations`);
    }
    
    // Check for invalid return values
    const invalidReturns = asset.returns.filter(r => 
      typeof r !== 'number' || (!allowInfiniteReturns && !isFinite(r)) || isNaN(r)
    );
    
    if (invalidReturns.length > 0) {
      errors.push(`Asset contains ${invalidReturns.length} invalid return values`);
    }
    
    // Check for extreme returns (likely data errors)
    const extremeReturns = asset.returns.filter(r => Math.abs(r) > 1); // > 100% change
    if (extremeReturns.length > asset.returns.length * 0.05) { // More than 5% extreme returns
      errors.push('Asset has too many extreme return values (>100% change)');
    }
  }
  
  // Validate optional fields
  if (asset.weight !== undefined) {
    if (typeof asset.weight !== 'number' || !isFinite(asset.weight)) {
      errors.push('Asset weight must be a finite number');
    } else if (asset.weight < 0 || asset.weight > 1) {
      errors.push('Asset weight must be between 0 and 1');
    }
  }
  
  if (asset.marketCap !== undefined) {
    if (typeof asset.marketCap !== 'number' || !isFinite(asset.marketCap) || asset.marketCap < 0) {
      errors.push('Asset market cap must be a positive finite number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateSymbol(symbol: string): ValidationResult {
  const errors: string[] = [];
  
  if (!symbol || typeof symbol !== 'string') {
    errors.push('Symbol must be a non-empty string');
  } else {
    const trimmedSymbol = symbol.trim().toUpperCase();
    
    if (trimmedSymbol.length === 0) {
      errors.push('Symbol cannot be empty');
    } else if (trimmedSymbol.length > 10) {
      errors.push('Symbol cannot be longer than 10 characters');
    } else if (!/^[A-Z0-9.-]+$/.test(trimmedSymbol)) {
      errors.push('Symbol can only contain letters, numbers, dots, and hyphens');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
