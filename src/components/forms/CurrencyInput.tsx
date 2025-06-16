import React, { useState } from 'react';
import { FinancialInput } from '../ui/FinancialInput';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  currency?: string;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  error,
  currency = 'USD',
  placeholder = '0.00',
}) => {
  const formatCurrency = (input: string): string => {
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
    
    return numericValue;
  };

  const handleChange = (text: string) => {
    const formattedValue = formatCurrency(text);
    onChange(formattedValue);
  };

  return (
    <FinancialInput
      label={label}
      value={value ? `${currency} ${value}` : ''}
      onChangeText={handleChange}
      error={error}
      keyboardType="decimal-pad"
      placeholder={placeholder}
    />
  );
}; 