import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingStep2() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="analytics" size={64} color="#007AFF" />
        </View>
        <Text style={styles.title}>Advanced Risk Analysis</Text>
        <Text style={styles.description}>
          Analyze your portfolio's risk using professional-grade tools including
          Value at Risk (VaR), Expected Shortfall, and Monte Carlo simulations.
        </Text>
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Value at Risk (VaR)</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Monte Carlo Simulations</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Stress Testing</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/onboarding/step3')}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 