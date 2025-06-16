import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { FinancialInput } from '../../src/components/ui/FinancialInput';

type VaRMethod = 'parametric' | 'historical' | 'monteCarlo';

export default function RiskAnalysisScreen() {
  const [selectedMethod, setSelectedMethod] = useState<VaRMethod>('parametric');
  const [confidenceLevel, setConfidenceLevel] = useState('95');
  const [timeHorizon, setTimeHorizon] = useState('1');
  const [portfolioValue, setPortfolioValue] = useState('100000');

  const calculateVaR = () => {
    // TODO: Implement actual VaR calculation logic
    console.log('Calculating VaR with:', {
      method: selectedMethod,
      confidenceLevel,
      timeHorizon,
      portfolioValue,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Risk Analysis</Text>
        <Text style={styles.subtitle}>Calculate Value at Risk (VaR)</Text>
      </View>

      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'parametric' && styles.activeMethod,
          ]}
          onPress={() => setSelectedMethod('parametric')}
        >
          <Text style={styles.methodText}>Parametric</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'historical' && styles.activeMethod,
          ]}
          onPress={() => setSelectedMethod('historical')}
        >
          <Text style={styles.methodText}>Historical</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'monteCarlo' && styles.activeMethod,
          ]}
          onPress={() => setSelectedMethod('monteCarlo')}
        >
          <Text style={styles.methodText}>Monte Carlo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputsContainer}>
        <FinancialInput
          label="Portfolio Value"
          placeholder="Enter portfolio value"
          value={portfolioValue}
          onChangeText={setPortfolioValue}
          keyboardType="numeric"
        />

        <FinancialInput
          label="Confidence Level (%)"
          placeholder="Enter confidence level"
          value={confidenceLevel}
          onChangeText={setConfidenceLevel}
          keyboardType="numeric"
        />

        <FinancialInput
          label="Time Horizon (days)"
          placeholder="Enter time horizon"
          value={timeHorizon}
          onChangeText={setTimeHorizon}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculateVaR}>
        <Text style={styles.calculateButtonText}>Calculate VaR</Text>
      </TouchableOpacity>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Results</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>VaR (95%):</Text>
          <Text style={styles.resultValue}>$5,000</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Expected Shortfall:</Text>
          <Text style={styles.resultValue}>$7,500</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  methodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  activeMethod: {
    backgroundColor: '#007AFF',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  inputsContainer: {
    padding: 20,
    gap: 16,
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 20,
    backgroundColor: '#F2F2F7',
    margin: 20,
    borderRadius: 12,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 