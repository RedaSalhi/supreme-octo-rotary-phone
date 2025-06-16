import { ValidationRule } from './validation';
import { commonRules } from './validation';

/**
 * Authentication form validation schemas
 */
export const authSchemas = {
  login: {
    email: [
      commonRules.required('Email is required'),
      commonRules.email('Please enter a valid email address'),
    ] as ValidationRule<string>[],
    password: [
      commonRules.required('Password is required'),
      commonRules.minLength(8, 'Password must be at least 8 characters'),
    ] as ValidationRule<string>[],
  },

  register: {
    email: [
      commonRules.required('Email is required'),
      commonRules.email('Please enter a valid email address'),
    ] as ValidationRule<string>[],
    password: [
      commonRules.required('Password is required'),
      commonRules.minLength(8, 'Password must be at least 8 characters'),
      commonRules.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    ] as ValidationRule<string>[],
    confirmPassword: [
      commonRules.required('Please confirm your password'),
    ] as ValidationRule<string>[],
  },

  forgotPassword: {
    email: [
      commonRules.required('Email is required'),
      commonRules.email('Please enter a valid email address'),
    ] as ValidationRule<string>[],
  },

  resetPassword: {
    password: [
      commonRules.required('New password is required'),
      commonRules.minLength(8, 'Password must be at least 8 characters'),
      commonRules.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    ] as ValidationRule<string>[],
    confirmPassword: [
      commonRules.required('Please confirm your new password'),
    ] as ValidationRule<string>[],
  },
};

/**
 * Onboarding form validation schemas
 */
export const onboardingSchemas = {
  personalInfo: {
    firstName: [
      commonRules.required('First name is required'),
      commonRules.minLength(2, 'First name must be at least 2 characters'),
      commonRules.maxLength(50, 'First name must be at most 50 characters'),
    ] as ValidationRule<string>[],
    lastName: [
      commonRules.required('Last name is required'),
      commonRules.minLength(2, 'Last name must be at least 2 characters'),
      commonRules.maxLength(50, 'Last name must be at most 50 characters'),
    ] as ValidationRule<string>[],
    dateOfBirth: [
      commonRules.required('Date of birth is required'),
      commonRules.date('Please enter a valid date'),
    ] as ValidationRule<string>[],
    phoneNumber: [
      commonRules.required('Phone number is required'),
      commonRules.pattern(
        /^\+?[1-9]\d{1,14}$/,
        'Please enter a valid phone number'
      ),
    ] as ValidationRule<string>[],
  },

  financialProfile: {
    investmentExperience: [
      commonRules.required('Investment experience is required'),
    ] as ValidationRule<string>[],
    riskTolerance: [
      commonRules.required('Risk tolerance is required'),
    ] as ValidationRule<string>[],
    investmentGoals: [
      commonRules.required('Investment goals are required'),
    ] as ValidationRule<string>[],
    annualIncome: [
      commonRules.required('Annual income is required'),
      commonRules.number('Please enter a valid number'),
      commonRules.min(0, 'Annual income cannot be negative'),
    ] as ValidationRule<number>[],
    netWorth: [
      commonRules.required('Net worth is required'),
      commonRules.number('Please enter a valid number'),
      commonRules.min(0, 'Net worth cannot be negative'),
    ] as ValidationRule<number>[],
  },

  preferences: {
    notificationPreferences: [
      commonRules.required('Notification preferences are required'),
    ] as ValidationRule<string[]>[],
    language: [
      commonRules.required('Language preference is required'),
    ] as ValidationRule<string>[],
    currency: [
      commonRules.required('Currency preference is required'),
    ] as ValidationRule<string>[],
    theme: [
      commonRules.required('Theme preference is required'),
    ] as ValidationRule<string>[],
  },
};

/**
 * Settings form validation schemas
 */
export const settingsSchemas = {
  profile: {
    firstName: [
      commonRules.required('First name is required'),
      commonRules.minLength(2, 'First name must be at least 2 characters'),
      commonRules.maxLength(50, 'First name must be at most 50 characters'),
    ] as ValidationRule<string>[],
    lastName: [
      commonRules.required('Last name is required'),
      commonRules.minLength(2, 'Last name must be at least 2 characters'),
      commonRules.maxLength(50, 'Last name must be at most 50 characters'),
    ] as ValidationRule<string>[],
    email: [
      commonRules.required('Email is required'),
      commonRules.email('Please enter a valid email address'),
    ] as ValidationRule<string>[],
    phoneNumber: [
      commonRules.required('Phone number is required'),
      commonRules.pattern(
        /^\+?[1-9]\d{1,14}$/,
        'Please enter a valid phone number'
      ),
    ] as ValidationRule<string>[],
  },

  security: {
    currentPassword: [
      commonRules.required('Current password is required'),
    ] as ValidationRule<string>[],
    newPassword: [
      commonRules.required('New password is required'),
      commonRules.minLength(8, 'Password must be at least 8 characters'),
      commonRules.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    ] as ValidationRule<string>[],
    confirmNewPassword: [
      commonRules.required('Please confirm your new password'),
    ] as ValidationRule<string>[],
  },

  preferences: {
    notificationPreferences: [
      commonRules.required('Notification preferences are required'),
    ] as ValidationRule<string[]>[],
    language: [
      commonRules.required('Language preference is required'),
    ] as ValidationRule<string>[],
    currency: [
      commonRules.required('Currency preference is required'),
    ] as ValidationRule<string>[],
    theme: [
      commonRules.required('Theme preference is required'),
    ] as ValidationRule<string>[],
  },

  apiKeys: {
    apiKey: [
      commonRules.required('API key is required'),
      commonRules.minLength(32, 'API key must be at least 32 characters'),
    ] as ValidationRule<string>[],
    apiSecret: [
      commonRules.required('API secret is required'),
      commonRules.minLength(32, 'API secret must be at least 32 characters'),
    ] as ValidationRule<string>[],
  },
};

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Options for asset validation
 */
export interface AssetValidationOptions {
  /** Minimum allowed price */
  minPrice?: number;
  /** Maximum allowed price */
  maxPrice?: number;
  /** Minimum number of return observations required */
  minReturnsLength?: number;
  /** Maximum number of return observations allowed */
  maxReturnsLength?: number;
  /** Whether to allow infinite return values */
  allowInfiniteReturns?: boolean;
}

/**
 * Options for portfolio validation
 */
export interface PortfolioValidationOptions {
  /** Whether to allow short positions (negative weights) */
  allowShortSelling?: boolean;
  /** Whether to allow leverage (weights sum > 1) */
  allowLeverage?: boolean;
  /** Maximum number of assets allowed */
  maxAssets?: number;
  /** Minimum number of assets required */
  minAssets?: number;
  /** Maximum weight for any single asset */
  maxWeight?: number;
  /** Minimum weight for any single asset */
  minWeight?: number;
  /** Whether to allow negative weights */
  allowNegativeWeights?: boolean;
  /** Whether weights must sum to 1 */
  requireNormalizedWeights?: boolean;
}

/**
 * Options for benchmark validation
 */
export interface BenchmarkValidationOptions {
  /** Minimum number of return observations required */
  minReturnsLength?: number;
  /** Maximum number of return observations allowed */
  maxReturnsLength?: number;
  /** Whether to allow infinite return values */
  allowInfiniteReturns?: boolean;
  /** Whether to validate benchmark weights sum to 1 */
  validateWeights?: boolean;
} 