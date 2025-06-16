import React from 'react';
import { FinancialInput } from '../ui/FinancialInput';

interface PercentageInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  placeholder?: string;
  maxValue?: number;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  onChange,
  label,
  error,
  placeholder = '0.00',
  maxValue = 100,
}) => {
  const formatPercentage = (input: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = input.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join('')}`;
    }
    
    // Format with 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    
    // Ensure value doesn't exceed maxValue
    const numValue = parseFloat(numericValue);
    if (!isNaN(numValue) && numValue > maxValue) {
      return maxValue.toString();
    }
    
    return numericValue;
  };

  const handleChange = (text: string) => {
    const formattedValue = formatPercentage(text);
    onChange(formattedValue);
  };

  return (
    <FinancialInput
      label={label}
      value={value ? `${value}%` : ''}
      onChangeText={handleChange}
      error={error}
      keyboardType="decimal-pad"
      placeholder={placeholder}
    />
  );
}; 