import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface FinancialFormContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

export const FinancialFormContainer: React.FC<FinancialFormContainerProps> = ({
  children,
  style,
  scrollable = true,
}) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <Container
        style={[styles.container, style]}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
      >
        {children}
      </Container>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
}); 