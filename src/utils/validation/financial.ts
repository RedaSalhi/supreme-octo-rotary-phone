
// ===========================================
// src/utils/validation/financial.ts
// ===========================================

import type { ValidationResult } from './schemas';

export function validateConfidenceLevel(level: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof level !== 'number' || !isFinite(level)) {
    errors.push('Confidence level must be a finite number');
  } else if (level <= 0 || level >= 1) {
    errors.push('Confidence level must be between 0 and 1 (exclusive)');
  } else if (level < 0.8) {
    errors.push('Confidence level should be at least 0.8 (80%)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRiskFreeRate(rate: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof rate !== 'number' || !isFinite(rate)) {
    errors.push('Risk-free rate must be a finite number');
  } else if (rate < 0) {
    errors.push('Risk-free rate cannot be negative');
  } else if (rate > 0.2) {
    errors.push('Risk-free rate seems unreasonably high (>20%)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateTimeHorizon(days: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof days !== 'number' || !isFinite(days) || !Number.isInteger(days)) {
    errors.push('Time horizon must be a finite integer');
  } else if (days <= 0) {
    errors.push('Time horizon must be positive');
  } else if (days > 365 * 5) {
    errors.push('Time horizon cannot exceed 5 years');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePortfolioValue(value: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof value !== 'number' || !isFinite(value)) {
    errors.push('Portfolio value must be a finite number');
  } else if (value <= 0) {
    errors.push('Portfolio value must be positive');
  } else if (value > 1e12) {
    errors.push('Portfolio value seems unreasonably large');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
