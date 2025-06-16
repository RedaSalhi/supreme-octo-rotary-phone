import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = 2, 
  gap = 16,
  style 
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, { gap }, style]}>
      {childrenArray.map((child, index) => (
        <View 
          key={index} 
          style={[
            styles.item, 
            { 
              width: `${100 / columns}%`,
              padding: gap / 2
            }
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  item: {
    flexGrow: 0,
    flexShrink: 0,
  },
}); 