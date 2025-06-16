import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { commonRules, createFormValidator, sanitizeObject } from '@/utils/validation/validation';

/**
 * Interface for CSV parsing options
 */
interface CSVParsingOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  columns?: boolean;
  trim?: boolean;
}

/**
 * Interface for data cleaning options
 */
interface DataCleaningOptions {
  removeDuplicates?: boolean;
  fillMissingValues?: boolean;
  fillValue?: any;
  removeNullValues?: boolean;
  trimStrings?: boolean;
}

/**
 * Type for data type conversion
 */
type DataType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Parse CSV string to array of objects
 * @param csvString - The CSV string to parse
 * @param options - Parsing options
 * @returns Array of objects representing the CSV data
 */
export const parseCSV = (csvString: string, options: CSVParsingOptions = {}): Record<string, any>[] => {
  const defaultOptions: CSVParsingOptions = {
    delimiter: ',',
    skipEmptyLines: true,
    columns: true,
    trim: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return parse(csvString, mergedOptions);
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV data');
  }
};

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param options - Stringify options
 * @returns CSV string
 */
export const stringifyToCSV = (data: Record<string, any>[], options = {}): string => {
  try {
    return stringify(data, {
      header: true,
      ...options,
    });
  } catch (error) {
    console.error('Error stringifying to CSV:', error);
    throw new Error('Failed to convert data to CSV');
  }
};

/**
 * Clean and normalize data
 * @param data - Array of objects to clean
 * @param options - Cleaning options
 * @returns Cleaned array of objects
 */
export const cleanData = (
  data: Record<string, any>[],
  options: DataCleaningOptions = {}
): Record<string, any>[] => {
  const defaultOptions: DataCleaningOptions = {
    removeDuplicates: true,
    fillMissingValues: true,
    fillValue: null,
    removeNullValues: false,
    trimStrings: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  let cleanedData = [...data];

  // Remove duplicates if specified
  if (mergedOptions.removeDuplicates) {
    cleanedData = Array.from(
      new Map(cleanedData.map(item => [JSON.stringify(item), item])).values()
    );
  }

  // Process each object in the array
  cleanedData = cleanedData.map(item => {
    const cleanedItem = { ...item };

    // Process each field in the object
    Object.keys(cleanedItem).forEach(key => {
      let value = cleanedItem[key];

      // Trim strings if specified
      if (mergedOptions.trimStrings && typeof value === 'string') {
        value = value.trim();
      }

      // Fill missing values if specified
      if (mergedOptions.fillMissingValues && (value === undefined || value === '')) {
        value = mergedOptions.fillValue;
      }

      // Remove null values if specified
      if (mergedOptions.removeNullValues && value === null) {
        delete cleanedItem[key];
      } else {
        cleanedItem[key] = value;
      }
    });

    return cleanedItem;
  });

  return cleanedData;
};

/**
 * Validate data structure against a schema
 * @param data - Data to validate
 * @param schema - Schema to validate against
 * @returns Object containing validation results
 */
export const validateDataStructure = (
  data: Record<string, any>[],
  schema: Record<string, string>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Data must be an array'] };
  }

  data.forEach((item, index) => {
    // Check if all required fields are present
    Object.keys(schema).forEach(field => {
      if (!(field in item)) {
        errors.push(`Missing required field '${field}' in item ${index}`);
      } else {
        // Check if the value type matches the schema
        const expectedType = schema[field];
        const actualType = typeof item[field];
        
        if (actualType !== expectedType) {
          errors.push(
            `Invalid type for field '${field}' in item ${index}. Expected ${expectedType}, got ${actualType}`
          );
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Convert data types in an array of objects
 * @param data - Array of objects to convert
 * @param typeMap - Map of field names to their target types
 * @returns Array of objects with converted types
 */
export const convertDataTypes = (
  data: Record<string, any>[],
  typeMap: Record<string, DataType>
): Record<string, any>[] => {
  return data.map(item => {
    const convertedItem = { ...item };

    Object.entries(typeMap).forEach(([field, targetType]: [string, DataType]) => {
      if (field in convertedItem) {
        try {
          switch (targetType) {
            case 'string':
              convertedItem[field] = String(convertedItem[field]);
              break;
            case 'number':
              convertedItem[field] = Number(convertedItem[field]);
              break;
            case 'boolean':
              convertedItem[field] = Boolean(convertedItem[field]);
              break;
            case 'date':
              convertedItem[field] = new Date(convertedItem[field]);
              break;
          }
        } catch (error) {
          console.warn(`Failed to convert field '${field}' to type '${targetType}'`);
        }
      }
    });

    return convertedItem;
  });
};

// Create a form validator
const validateUserForm = createFormValidator({
  email: [
    commonRules.required(),
    commonRules.email(),
  ],
  password: [
    commonRules.required(),
    commonRules.minLength(8, 'Password must be at least 8 characters'),
    commonRules.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  ],
  age: [
    commonRules.number(),
    commonRules.min(18, 'Must be at least 18 years old'),
  ],
});

// Use the validator
const formData = {
  email: 'user@example.com',
  password: 'Password123',
  age: 25,
};

const result = validateUserForm(formData);
if (!result.isValid) {
  console.log(result.errors);
}

// Sanitize data
const sanitizedData = sanitizeObject(formData, {
  trim: true,
  lowercase: true,
  removeSpecialChars: true,
}); 