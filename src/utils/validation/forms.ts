// ===========================================
// src/utils/validation/forms.ts
// ===========================================

import { validateSymbol } from './assets';
import type { ValidationResult } from './schemas';

export interface FormValidationRule<T> {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

export interface FormValidationSchema {
  [fieldName: string]: FormValidationRule<any>;
}

export interface FormValidationErrors {
  [fieldName: string]: string[];
}

/**
 * Validate portfolio value
 */
function validatePortfolioValue(value: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof value !== 'number' || !isFinite(value)) {
    errors.push('Portfolio value must be a finite number');
  } else if (value < 1000) {
    errors.push('Portfolio value must be at least $1,000');
  } else if (value > 1000000000) {
    errors.push('Portfolio value cannot exceed $1 billion');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: FormValidationSchema
): { isValid: boolean; errors: FormValidationErrors } {
  const errors: FormValidationErrors = {};
  
  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data[fieldName];
    const fieldErrors: string[] = [];
    
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${fieldName} is required`);
      continue;
    }
    
    // Skip other validations if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type-specific validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        fieldErrors.push(`${fieldName} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        fieldErrors.push(`${fieldName} cannot exceed ${rule.max}`);
      }
    }
    
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        fieldErrors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        fieldErrors.push(`${fieldName} cannot exceed ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push(`${fieldName} format is invalid`);
      }
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Common validation schemas
export const portfolioFormSchema: FormValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s-_]+$/
  },
  totalValue: {
    required: true,
    min: 1000,
    max: 1000000000,
    custom: (value) => validatePortfolioValue(value).isValid ? null : 'Invalid portfolio value'
  },
  riskTolerance: {
    required: true,
    min: 1,
    max: 10
  }
};

export const assetFormSchema: FormValidationSchema = {
  symbol: {
    required: true,
    minLength: 1,
    maxLength: 10,
    pattern: /^[A-Z0-9.-]+$/i,
    custom: (value) => validateSymbol(value).isValid ? null : 'Invalid symbol format'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  weight: {
    required: true,
    min: 0,
    max: 1
  }
};