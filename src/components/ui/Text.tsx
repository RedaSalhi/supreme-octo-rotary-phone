import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

export interface TextProps extends RNTextProps {
  variant?: 'default' | 'title' | 'subtitle' | 'caption';
}

export const Text: React.FC<TextProps> = ({ style, variant = 'default', ...props }) => {
  return (
    <RNText
      style={[
        styles.base,
        variant === 'title' && styles.title,
        variant === 'subtitle' && styles.subtitle,
        variant === 'caption' && styles.caption,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    color: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  caption: {
    fontSize: 12,
    color: '#666',
  },
}); 