import React from 'react';
import { FinancialInput } from '../ui/FinancialInput';

interface StockSymbolInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}

export const StockSymbolInput: React.FC<StockSymbolInputProps> = ({
  value,
  onChange,
  label,
  error,
  placeholder = 'Enter stock symbol',
  maxLength = 5,
}) => {
  const formatSymbol = (input: string): string => {
    // Convert to uppercase and remove any non-alphanumeric characters
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleChange = (text: string) => {
    const formattedValue = formatSymbol(text);
    onChange(formattedValue);
  };

  return (
    <FinancialInput
      label={label}
      value={value}
      onChangeText={handleChange}
      error={error}
      placeholder={placeholder}
      maxLength={maxLength}
      autoCapitalize="characters"
      autoCorrect={false}
    />
  );
}; 