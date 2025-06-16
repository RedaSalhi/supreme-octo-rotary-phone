// ===========================================
// src/utils/data/aggregator.ts
// ===========================================

import type { StockQuote, MarketDataPoint, ApiResponse } from './types';
import { alphaVantageClient, finnhubClient, polygonClient } from './apiClients';

/**
 * Data aggregation utilities that combine multiple data sources
 */

export class DataAggregator {
  private clients = [alphaVantageClient, finnhubClient, polygonClient];

  async getQuoteWithFallback(symbol: string): Promise<ApiResponse<StockQuote>> {
    const errors: string[] = [];

    for (const client of this.clients) {
      try {
        const result = await client.getQuote(symbol);
        if (result.success && result.data) {
          return result;
        }
        if (result.error) {
          errors.push(`${result.source}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${client.constructor.name}: ${error}`);
      }
    }

    return {
      data: null as any,
      success: false,
      error: `All sources failed: ${errors.join(', ')}`,
      source: 'aggregator',
      cached: false,
      timestamp: new Date().toISOString()
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    
    const promises = symbols.map(async (symbol) => {
      const quote = await this.getQuoteWithFallback(symbol);
      if (quote.success && quote.data) {
        results.set(symbol, quote.data);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async getBestHistoricalData(symbol: string, days: number = 252): Promise<MarketDataPoint[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Try Polygon first (most reliable for historical data)
    try {
      const polygonResult = await polygonClient.getHistoricalData(symbol, startDate, endDate);
      if (polygonResult.success && polygonResult.data && polygonResult.data.length > 0) {
        return polygonResult.data;
      }
    } catch (error) {
      console.warn('Polygon historical data failed:', error);
    }

    // Fallback to Alpha Vantage
    try {
      const avResult = await alphaVantageClient.getHistoricalData(symbol);
      if (avResult.success && avResult.data && avResult.data.length > 0) {
        return avResult.data.slice(-days); // Get last N days
      }
    } catch (error) {
      console.warn('Alpha Vantage historical data failed:', error);
    }

    return [];
  }
}

export const dataAggregator = new DataAggregator();