import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingStep1() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="pie-chart" size={64} color="#007AFF" />
        </View>
        <Text style={styles.title}>Portfolio Optimization</Text>
        <Text style={styles.description}>
          Optimize your investment portfolio using advanced techniques like Markowitz
          optimization and Maximum Sharpe Ratio to achieve the best risk-adjusted returns.
        </Text>
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Modern Portfolio Theory</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Risk-Return Analysis</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Asset Allocation</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/onboarding/step2')}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 