import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const sampleIndices: MarketIndex[] = [
  { symbol: '^GSPC', name: 'S&P 500', value: 4783.45, change: 12.34, changePercent: 0.26 },
  { symbol: '^DJI', name: 'Dow Jones', value: 37466.11, change: -45.67, changePercent: -0.12 },
  { symbol: '^IXIC', name: 'NASDAQ', value: 14897.34, change: 23.45, changePercent: 0.16 },
];

const sampleAssets = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 1.23, changePercent: 0.67 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 374.58, change: 2.45, changePercent: 0.66 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.65, change: -0.78, changePercent: -0.54 },
];

export default function MarketScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  const chartData = {
    labels: ['9:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:00'],
    datasets: [
      {
        data: [4780, 4785, 4782, 4788, 4790, 4785, 4783, 4783.45],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Overview</Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.timeframeSelector}>
          {(['1D', '1W', '1M', '1Y'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text style={styles.timeframeText}>{timeframe}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Major Indices</Text>
        {sampleIndices.map((index) => (
          <View key={index.symbol} style={styles.indexRow}>
            <View style={styles.indexInfo}>
              <Text style={styles.indexSymbol}>{index.symbol}</Text>
              <Text style={styles.indexName}>{index.name}</Text>
            </View>
            <View style={styles.indexValues}>
              <Text style={styles.indexValue}>{index.value.toFixed(2)}</Text>
              <Text
                style={[
                  styles.indexChange,
                  index.change >= 0 ? styles.positiveChange : styles.negativeChange,
                ]}
              >
                {index.change >= 0 ? '+' : ''}
                {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watchlist</Text>
        {sampleAssets.map((asset) => (
          <View key={asset.symbol} style={styles.assetRow}>
            <View style={styles.assetInfo}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName}>{asset.name}</Text>
            </View>
            <View style={styles.assetValues}>
              <Text style={styles.assetPrice}>${asset.price.toFixed(2)}</Text>
              <Text
                style={[
                  styles.assetChange,
                  asset.change >= 0 ? styles.positiveChange : styles.negativeChange,
                ]}
              >
                {asset.change >= 0 ? '+' : ''}
                {asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
              </Text>
            </View>
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
  },
  chartContainer: {
    padding: 20,
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTimeframe: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  indexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  indexInfo: {
    flex: 1,
  },
  indexSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  indexName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  indexValues: {
    alignItems: 'flex-end',
  },
  indexValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  indexChange: {
    fontSize: 14,
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
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
  assetValues: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  assetChange: {
    fontSize: 14,
  },
}); 