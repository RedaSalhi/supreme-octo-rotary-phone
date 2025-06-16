import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

interface Asset {
  symbol: string;
  allocation: number;
  name: string;
}

const sampleAssets: Asset[] = [
  { symbol: 'AAPL', allocation: 25, name: 'Apple Inc.' },
  { symbol: 'MSFT', allocation: 20, name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', allocation: 15, name: 'Alphabet Inc.' },
  { symbol: 'AMZN', allocation: 15, name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', allocation: 25, name: 'Tesla Inc.' },
];

export default function PortfolioScreen() {
  const [optimizationType, setOptimizationType] = useState<'markowitz' | 'maxSharpe'>('markowitz');
  const [assets, setAssets] = useState<Asset[]>(sampleAssets);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [100, 105, 102, 108, 112, 115],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Overview</Text>
        <View style={styles.optimizationToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              optimizationType === 'markowitz' && styles.activeToggle,
            ]}
            onPress={() => setOptimizationType('markowitz')}
          >
            <Text style={styles.toggleText}>Markowitz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              optimizationType === 'maxSharpe' && styles.activeToggle,
            ]}
            onPress={() => setOptimizationType('maxSharpe')}
          >
            <Text style={styles.toggleText}>Max Sharpe</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.assetsContainer}>
        <Text style={styles.sectionTitle}>Asset Allocation</Text>
        {assets.map((asset) => (
          <View key={asset.symbol} style={styles.assetRow}>
            <View style={styles.assetInfo}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName}>{asset.name}</Text>
            </View>
            <Text style={styles.allocation}>{asset.allocation}%</Text>
          </View>
        ))}
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
    marginBottom: 20,
  },
  optimizationToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    padding: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  assetsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  assetName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  allocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
}); 