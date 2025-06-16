// ===========================================
// src/utils/data/apiClients.ts
// ===========================================

import { dataCache } from './cache';
import { rateLimiter } from './rateLimiter';
import type { MarketDataPoint, StockQuote, ApiResponse } from './types';

const API_KEYS = {
  ALPHAVANTAGE: process.env.EXPO_PUBLIC_ALPHAVANTAGE_API_KEY || '0ZM65PFX02WM5ONI',
  FINNHUB: process.env.EXPO_PUBLIC_FINNHUB_API_KEY || 'd182659r01ql1b4lb3t0d182659r01ql1b4lb3tg',
  POLYGON: process.env.EXPO_PUBLIC_POLYGON_API_KEY || 'Nx00VvIlcVLkEOLKFPe3TEPfP28UFYe_',
  TWELVE_DATA: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY || '33fe6887baf24b6f9cb9b5c28910bece'
};

// Base API client with common functionality
abstract class BaseApiClient {
  protected abstract baseUrl: string;
  protected abstract apiKey: string;
  protected abstract rateLimitKey: string;

  protected async makeRequest<T>(url: string, cacheKey?: string, cacheTTL?: number): Promise<ApiResponse<T>> {
    // Check cache first
    if (cacheKey && dataCache.has(cacheKey)) {
      return {
        data: dataCache.get<T>(cacheKey)!,
        success: true,
        source: this.rateLimitKey,
        cached: true,
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limits
    if (!rateLimiter.canMakeRequest(this.rateLimitKey)) {
      const waitTime = rateLimiter.getTimeUntilReset(this.rateLimitKey);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    try {
      const response = await fetch(url);
      rateLimiter.recordRequest(this.rateLimitKey);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      if (cacheKey) {
        dataCache.set(cacheKey, data, cacheTTL);
      }

      return {
        data,
        success: true,
        source: this.rateLimitKey,
        cached: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: this.rateLimitKey,
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Alpha Vantage API Client
class AlphaVantageClient extends BaseApiClient {
  protected baseUrl = 'https://www.alphavantage.co/query';
  protected apiKey = API_KEYS.ALPHAVANTAGE;
  protected rateLimitKey = 'alphavantage';

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    const cacheKey = `av_quote_${symbol}`;
    
    const response = await this.makeRequest<any>(url, cacheKey, 60000); // 1 minute cache
    
    if (!response.success) return response as ApiResponse<StockQuote>;

    const quote = response.data['Global Quote'];
    if (!quote) {
      return {
        ...response,
        success: false,
        error: 'Invalid response format',
        data: null as any
      };
    }

    const transformedData: StockQuote = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      timestamp: quote['07. latest trading day']
    };

    return {
      ...response,
      data: transformedData
    };
  }

  async getHistoricalData(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ApiResponse<MarketDataPoint[]>> {
    const functionMap = {
      daily: 'TIME_SERIES_DAILY_ADJUSTED',
      weekly: 'TIME_SERIES_WEEKLY_ADJUSTED',
      monthly: 'TIME_SERIES_MONTHLY_ADJUSTED'
    };

    const url = `${this.baseUrl}?function=${functionMap[period]}&symbol=${symbol}&apikey=${this.apiKey}`;
    const cacheKey = `av_historical_${symbol}_${period}`;
    
    const response = await this.makeRequest<any>(url, cacheKey, 300000); // 5 minute cache
    
    if (!response.success) return response as ApiResponse<MarketDataPoint[]>;

    const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
    const timeSeries = response.data[timeSeriesKey!];
    
    if (!timeSeries) {
      return {
        ...response,
        success: false,
        error: 'No time series data found',
        data: []
      };
    }

    const transformedData: MarketDataPoint[] = Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
      timestamp: date,
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      adjustedClose: parseFloat(data['5. adjusted close']),
      volume: parseInt(data['6. volume'])
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      ...response,
      data: transformedData
    };
  }
}

// Finnhub API Client
class FinnhubClient extends BaseApiClient {
  protected baseUrl = 'https://finnhub.io/api/v1';
  protected apiKey = API_KEYS.FINNHUB;
  protected rateLimitKey = 'finnhub';

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;
    const cacheKey = `fh_quote_${symbol}`;
    
    const response = await this.makeRequest<any>(url, cacheKey, 60000);
    
    if (!response.success) return response as ApiResponse<StockQuote>;

    const data = response.data;
    const transformedData: StockQuote = {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      timestamp: new Date(data.t * 1000).toISOString()
    };

    return {
      ...response,
      data: transformedData
    };
  }

  async getCompanyProfile(symbol: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`;
    const cacheKey = `fh_profile_${symbol}`;
    
    return this.makeRequest<any>(url, cacheKey, 3600000); // 1 hour cache
  }
}

// Polygon API Client
class PolygonClient extends BaseApiClient {
  protected baseUrl = 'https://api.polygon.io/v2';
  protected apiKey = API_KEYS.POLYGON;
  protected rateLimitKey = 'polygon';

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const url = `${this.baseUrl}/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${this.apiKey}`;
    const cacheKey = `pg_quote_${symbol}`;
    
    const response = await this.makeRequest<any>(url, cacheKey, 60000);
    
    if (!response.success) return response as ApiResponse<StockQuote>;

    const result = response.data.results?.[0];
    if (!result) {
      return {
        ...response,
        success: false,
        error: 'No data found',
        data: null as any
      };
    }

    const transformedData: StockQuote = {
      symbol,
      price: result.c,
      change: result.c - result.o,
      changePercent: ((result.c - result.o) / result.o) * 100,
      volume: result.v,
      timestamp: new Date(result.t).toISOString()
    };

    return {
      ...response,
      data: transformedData
    };
  }

  async getHistoricalData(
    symbol: string, 
    startDate: string, 
    endDate: string,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<ApiResponse<MarketDataPoint[]>> {
    const url = `${this.baseUrl}/aggs/ticker/${symbol}/range/1/${timespan}/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`;
    const cacheKey = `pg_historical_${symbol}_${startDate}_${endDate}_${timespan}`;
    
    const response = await this.makeRequest<any>(url, cacheKey, 300000);
    
    if (!response.success) return response as ApiResponse<MarketDataPoint[]>;

    const results = response.data.results || [];
    const transformedData: MarketDataPoint[] = results.map((item: any) => ({
      timestamp: new Date(item.t).toISOString(),
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v
    }));

    return {
      ...response,
      data: transformedData
    };
  }
}

// Export API clients
export const alphaVantageClient = new AlphaVantageClient();
export const finnhubClient = new FinnhubClient();
export const polygonClient = new PolygonClient();