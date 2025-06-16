import { useState, useEffect, useCallback } from 'react';
import { Asset } from '../types/portfolio';

interface MarketData {
  price: number;
  volume: number;
  timestamp: Date;
}

interface UseMarketDataReturn {
  marketData: Record<string, MarketData>;
  loading: boolean;
  error: string | null;
  fetchMarketData: (symbols: string[]) => Promise<void>;
  subscribeToRealTimeUpdates: (symbols: string[]) => void;
  unsubscribeFromRealTimeUpdates: (symbols: string[]) => void;
}

export const useMarketData = (): UseMarketDataReturn => {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async (symbols: string[]) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch(`https://api.marketdata.com/v1/quotes?symbols=${symbols.join(',')}`);
      const data = await response.json();
      
      const newMarketData: Record<string, MarketData> = {};
      symbols.forEach(symbol => {
        if (data[symbol]) {
          newMarketData[symbol] = {
            price: data[symbol].price,
            volume: data[symbol].volume,
            timestamp: new Date(data[symbol].timestamp),
          };
        }
      });
      
      setMarketData(prev => ({ ...prev, ...newMarketData }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeToRealTimeUpdates = useCallback((symbols: string[]) => {
    // TODO: Implement WebSocket connection for real-time updates
    console.log('Subscribing to real-time updates for:', symbols);
  }, []);

  const unsubscribeFromRealTimeUpdates = useCallback((symbols: string[]) => {
    // TODO: Implement WebSocket disconnection
    console.log('Unsubscribing from real-time updates for:', symbols);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any active subscriptions
      unsubscribeFromRealTimeUpdates(Object.keys(marketData));
    };
  }, [unsubscribeFromRealTimeUpdates, marketData]);

  return {
    marketData,
    loading,
    error,
    fetchMarketData,
    subscribeToRealTimeUpdates,
    unsubscribeFromRealTimeUpdates,
  };
}; 