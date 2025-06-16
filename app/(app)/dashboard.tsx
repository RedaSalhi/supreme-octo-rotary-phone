import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';

interface PortfolioMetric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

interface AssetAllocation {
  name: string;
  percentage: number;
  value: string;
}

export default function DashboardScreen() {
  const portfolioMetrics: PortfolioMetric[] = [
    {
      label: 'Total Portfolio Value',
      value: '$1,234,567.89',
      change: '+2.34%',
      isPositive: true,
    },
    {
      label: 'Daily P&L',
      value: '$12,345.67',
      change: '+1.23%',
      isPositive: true,
    },
    {
      label: 'Value at Risk (95%)',
      value: '$45,678.90',
      change: '-0.5%',
      isPositive: false,
    },
  ];

  const assetAllocation: AssetAllocation[] = [
    { name: 'Stocks', percentage: 45, value: '$555,555.55' },
    { name: 'Bonds', percentage: 30, value: '$370,370.37' },
    { name: 'Cash', percentage: 15, value: '$185,185.19' },
    { name: 'Alternative', percentage: 10, value: '$123,456.78' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Overview</Text>
        <Text style={styles.subtitle}>Welcome back, John</Text>
      </View>

      <View style={styles.metricsContainer}>
        {portfolioMetrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text
              style={[
                styles.metricChange,
                { color: metric.isPositive ? '#34C759' : '#FF3B30' },
              ]}
            >
              {metric.change}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asset Allocation</Text>
        <View style={styles.allocationContainer}>
          {assetAllocation.map((asset, index) => (
            <View key={index} style={styles.allocationItem}>
              <View style={styles.allocationHeader}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetValue}>{asset.value}</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${asset.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.percentage}>{asset.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Metrics</Text>
        <View style={styles.riskMetricsContainer}>
          <View style={styles.riskMetricCard}>
            <Text style={styles.riskMetricLabel}>Sharpe Ratio</Text>
            <Text style={styles.riskMetricValue}>1.85</Text>
          </View>
          <View style={styles.riskMetricCard}>
            <Text style={styles.riskMetricLabel}>Beta</Text>
            <Text style={styles.riskMetricValue}>0.92</Text>
          </View>
          <View style={styles.riskMetricCard}>
            <Text style={styles.riskMetricLabel}>Alpha</Text>
            <Text style={styles.riskMetricValue}>2.3%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  metricsContainer: {
    padding: 20,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  allocationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  allocationItem: {
    gap: 8,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  assetValue: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#666',
  },
  riskMetricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  riskMetricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  riskMetricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  riskMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
}); 