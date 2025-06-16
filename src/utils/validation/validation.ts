/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation rule type
 */
export type ValidationRule<T = any> = {
  validate: (value: T) => boolean;
  message: string;
  code?: string;
};

/**
 * Common validation rules
 */
export const commonRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value !== undefined && value !== null && value !== '',
    message,
    code: 'REQUIRED',
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
    code: 'MIN_LENGTH',
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
    code: 'MAX_LENGTH',
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
    code: 'PATTERN',
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    code: 'INVALID_EMAIL',
  }),

  number: (message = 'Must be a number'): ValidationRule => ({
    validate: (value) => !isNaN(Number(value)),
    message,
    code: 'INVALID_NUMBER',
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => Number(value) >= min,
    message: message || `Must be at least ${min}`,
    code: 'MIN_VALUE',
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => Number(value) <= max,
    message: message || `Must be at most ${max}`,
    code: 'MAX_VALUE',
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    code: 'INVALID_URL',
  }),

  date: (message = 'Invalid date'): ValidationRule<string> => ({
    validate: (value) => !isNaN(Date.parse(value)),
    message,
    code: 'INVALID_DATE',
  }),
};

/**
 * Validate a single value against a set of rules
 * @param value - The value to validate
 * @param rules - Array of validation rules
 * @returns Validation result
 */
export const validateValue = <T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult => {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push({
        field: '',
        message: rule.message,
        code: rule.code,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate an object against a schema of rules
 * @param data - The object to validate
 * @param schema - Object containing field names and their validation rules
 * @returns Validation result
 */
export const validateObject = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, ValidationRule<any>[]>
): ValidationResult => {
  const errors: ValidationError[] = [];

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    const result = validateValue(value, rules);

    if (!result.isValid) {
      errors.push(
        ...result.errors.map((error) => ({
          ...error,
          field,
        }))
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize a string value
 * @param value - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export const sanitizeString = (
  value: string,
  options: {
    trim?: boolean;
    lowercase?: boolean;
    removeSpecialChars?: boolean;
    maxLength?: number;
  } = {}
): string => {
  let sanitized = value;

  if (options.trim) {
    sanitized = sanitized.trim();
  }

  if (options.lowercase) {
    sanitized = sanitized.toLowerCase();
  }

  if (options.removeSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }

  return sanitized;
};

/**
 * Sanitize an object's string values
 * @param data - The object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export const sanitizeObject = <T extends Record<string, any>>(
  data: T,
  options: {
    trim?: boolean;
    lowercase?: boolean;
    removeSpecialChars?: boolean;
    maxLength?: number;
  } = {}
): T => {
  const sanitized = { ...data } as T;

  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeString(sanitized[key], options);
    }
  });

  return sanitized;
};

/**
 * Create a form validator
 * @param schema - Validation schema
 * @returns Form validator function
 */
export const createFormValidator = <T extends Record<string, any>>(
  schema: Record<keyof T, ValidationRule<any>[]>
) => {
  return (data: T): ValidationResult => {
    return validateObject(data, schema);
  };
};

/**
 * Create a field validator
 * @param rules - Validation rules
 * @returns Field validator function
 */
export const createFieldValidator = <T>(rules: ValidationRule<T>[]) => {
  return (value: T): ValidationResult => {
    return validateValue(value, rules);
  };
}; 