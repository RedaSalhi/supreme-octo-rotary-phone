// ===========================================
// src/services/api/providers/finnhub.ts
// Finnhub API Integration Service
// ===========================================

import { BaseApiService, BaseApiConfig, RequestConfig, ApiError } from '../base';
import {
  ApiProvider,
  MarketData,
  HistoricalDataPoint,
  AssetSearchResult,
  TimeInterval,
  ApiResult,
  FinnhubQuoteResponse
} from '@/types';

// ========================================
// Finnhub Specific Types
// ========================================

export interface FinnhubConfig extends BaseApiConfig {
  apiKey: string;
  websocketUrl?: string;
}

interface FinnhubCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volume data
}

interface FinnhubSearchResponse {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface FinnhubMetrics {
  metric: {
    '10DayAverageTradingVolume': number;
    '52WeekHigh': number;
    '52WeekLow': number;
    '52WeekLowDate': string;
    '52WeekHighDate': string;
    '52WeekPriceReturnDaily': number;
    beta: number;
    marketCapitalization: number;
    peBasicExclExtraTTM: number;
    peCurrent: number;
    peNormalizedAnnual: number;
  };
  series: {
    annual: any;
    quarterly: any;
  };
}

// ========================================
// Finnhub Service Implementation
// ========================================

export class FinnhubService extends BaseApiService {
  private static readonly BASE_URL = 'https://finnhub.io/api/v1';
  private static readonly WEBSOCKET_URL = 'wss://ws.finnhub.io';
  private static readonly RATE_LIMITS = {
    requestsPerMinute: 60,
    requestsPerHour: 600,
    requestsPerDay: 600
  };

  private websocket?: WebSocket;
  private subscriptions: Set<string> = new Set();

  constructor(apiKey: string, websocketUrl?: string) {
    const config: FinnhubConfig = {
      baseUrl: FinnhubService.BASE_URL,
      apiKey,
      websocketUrl: websocketUrl || FinnhubService.WEBSOCKET_URL,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: FinnhubService.RATE_LIMITS,
      headers: {
        'Accept': 'application/json',
        'X-Finnhub-Token': apiKey
      }
    };

    super(config);
  }

  // ========================================
  // Base Class Implementation
  // ========================================

  get providerName(): ApiProvider {
    return 'finnhub';
  }

  normalizeError(error: any): ApiError {
    const baseError = {
      provider: this.providerName as ApiProvider,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred'
    };

    if (error.message?.includes('timeout')) {
      return new ApiError({
        ...baseError,
        code: 'TIMEOUT',
        message: 'Request timeout'
      });
    }

    if (error.status === 429) {
      return new ApiError({
        ...baseError,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Finnhub rate limit exceeded',
        rateLimited: true,
        retryAfter: 60000 // 1 minute
      });
    }

    if (error.status === 401) {
      return new ApiError({
        ...baseError,
        code: 'INVALID_API_KEY',
        message: 'Invalid Finnhub API key',
        statusCode: error.status
      });
    }

    if (error.status >= 400 && error.status < 500) {
      return new ApiError({
        ...baseError,
        code: 'CLIENT_ERROR',
        message: `Client error: ${error.status}`,
        statusCode: error.status
      });
    }

    if (error.status >= 500) {
      return new ApiError({
        ...baseError,
        code: 'SERVER_ERROR',
        message: `Server error: ${error.status}`,
        statusCode: error.status
      });
    }

    return new ApiError({
      ...baseError,
      message: error.message || 'Unknown error',
      details: error
    });
  }

  checkRateLimit(): boolean {
    return this.getRateLimitStatus().remaining > 0;
  }

  async getHealthStatus(): Promise<boolean> {
    try {
      const result = await this.getQuote('AAPL');
      return result.status === 'success';
    } catch {
      return false;
    }
  }

  // ========================================
  // Market Data Methods
  // ========================================

  async getQuote(symbol: string): Promise<ApiResult<MarketData>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/quote',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    const response = await this.makeRequest<FinnhubQuoteResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformQuoteResponse(response.data, symbol),
      timestamp: new Date()
    };
  }

  async getHistoricalData(
    symbol: string, 
    interval: TimeInterval = '1day',
    from?: Date,
    to?: Date
  ): Promise<ApiResult<HistoricalDataPoint[]>> {
    const resolution = this.mapTimeIntervalToResolution(interval);
    const fromTimestamp = from ? Math.floor(from.getTime() / 1000) : Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
    const toTimestamp = to ? Math.floor(to.getTime() / 1000) : Math.floor(Date.now() / 1000);

    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/candle',
      params: {
        symbol: symbol.toUpperCase(),
        resolution,
        from: fromTimestamp,
        to: toTimestamp
      }
    };

    const response = await this.makeRequest<FinnhubCandleResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformCandleResponse(response.data),
      timestamp: new Date()
    };
  }

  async searchSymbols(query: string): Promise<ApiResult<AssetSearchResult[]>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/search',
      params: {
        q: query
      }
    };

    const response = await this.makeRequest<FinnhubSearchResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformSearchResponse(response.data),
      timestamp: new Date()
    };
  }

  async getCompanyProfile(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/profile2',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    const response = await this.makeRequest<FinnhubCompanyProfile>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformProfileResponse(response.data),
      timestamp: new Date()
    };
  }

  async getBasicFinancials(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/metric',
      params: {
        symbol: symbol.toUpperCase(),
        metric: 'all'
      }
    };

    const response = await this.makeRequest<FinnhubMetrics>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformMetricsResponse(response.data),
      timestamp: new Date()
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<ApiResult<MarketData[]>> {
    // Finnhub doesn't support batch requests, so we'll make individual requests
    const results: MarketData[] = [];
    const errors: string[] = [];

    for (const symbol of symbols) {
      try {
        const result = await this.getQuote(symbol);
        if (result.status === 'success') {
          results.push(result.data);
        } else {
          errors.push(`${symbol}: ${result.error.message}`);
        }
        
        // Small delay to respect rate limits
        await this.sleep(100);
        
      } catch (error) {
        errors.push(`${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (results.length === 0) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'BATCH_REQUEST_FAILED',
          message: `All batch requests failed: ${errors.join(', ')}`
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: results,
      timestamp: new Date()
    };
  }

  // ========================================
  // WebSocket Real-time Data
  // ========================================

  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${(this.config as FinnhubConfig).websocketUrl}?token=${this.config.apiKey}`;
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('[Finnhub] WebSocket connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('[Finnhub] WebSocket message parse error:', error);
          }
        };

        this.websocket.onclose = () => {
          console.log('[Finnhub] WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.websocket.onerror = (error) => {
          console.error('[Finnhub] WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  subscribeToSymbol(symbol: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: 'subscribe', symbol: symbol.toUpperCase() });
      this.websocket.send(message);
      this.subscriptions.add(symbol.toUpperCase());
    }
  }

  unsubscribeFromSymbol(symbol: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: 'unsubscribe', symbol: symbol.toUpperCase() });
      this.websocket.send(message);
      this.subscriptions.delete(symbol.toUpperCase());
    }
  }

  private handleWebSocketMessage(data: any): void {
    if (data.type === 'trade') {
      // Handle real-time trade data
      data.data?.forEach((trade: any) => {
        const marketData: MarketData = {
          symbol: trade.s,
          price: trade.p,
          change: 0, // Calculate from previous price
          changePercent: 0,
          volume: trade.v,
          timestamp: new Date(trade.t),
          high: trade.p,
          low: trade.p,
          open: trade.p,
          previousClose: trade.p,
          currency: 'USD'
        };

        // Emit real-time data event
        this.emitRealTimeData(marketData);
      });
    }
  }

  private emitRealTimeData(data: MarketData): void {
    // This would emit to event listeners
    // Implementation depends on your event system
  }

  // ========================================
  // Response Transformation Methods
  // ========================================

  private transformQuoteResponse(data: FinnhubQuoteResponse, symbol: string): MarketData {
    return {
      symbol: symbol.toUpperCase(),
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      volume: 0, // Not available in quote response
      timestamp: new Date(data.t * 1000),
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      currency: 'USD'
    };
  }

  private transformCandleResponse(data: FinnhubCandleResponse): HistoricalDataPoint[] {
    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      return [];
    }

    const dataPoints: HistoricalDataPoint[] = [];

    for (let i = 0; i < data.c.length; i++) {
      dataPoints.push({
        date: new Date(data.t[i] * 1000),
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i]
      });
    }

    // Sort by date (most recent first)
    return dataPoints.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private transformSearchResponse(data: FinnhubSearchResponse): AssetSearchResult[] {
    return data.result.map(item => ({
      symbol: item.symbol,
      name: item.description,
      type: this.mapAssetType(item.type),
      exchange: 'NASDAQ', // Finnhub doesn't provide exchange in search
      currency: 'USD',
      country: 'US',
      source: this.providerName
    }));
  }

  private transformProfileResponse(data: FinnhubCompanyProfile): any {
    return {
      symbol: data.ticker,
      name: data.name,
      country: data.country,
      currency: data.currency,
      exchange: data.exchange,
      ipo: data.ipo,
      marketCap: data.marketCapitalization,
      industry: data.finnhubIndustry,
      website: data.weburl,
      logo: data.logo,
      phone: data.phone,
      sharesOutstanding: data.shareOutstanding
    };
  }

  private transformMetricsResponse(data: FinnhubMetrics): any {
    const metric = data.metric;
    return {
      volume10Day: metric['10DayAverageTradingVolume'],
      fiftyTwoWeekHigh: metric['52WeekHigh'],
      fiftyTwoWeekLow: metric['52WeekLow'],
      beta: metric.beta,
      marketCap: metric.marketCapitalization,
      peRatio: metric.peBasicExclExtraTTM || metric.peCurrent,
      priceReturn52Week: metric['52WeekPriceReturnDaily']
    };
  }

  // ========================================
  // Utility Methods
  // ========================================

  private mapTimeIntervalToResolution(interval: TimeInterval): string {
    const intervalMap: Record<TimeInterval, string> = {
      '1min': '1',
      '5min': '5',
      '15min': '15',
      '30min': '30',
      '1hour': '60',
      '4hour': '240',
      '1day': 'D',
      '1week': 'W',
      '1month': 'M'
    };

    return intervalMap[interval] || 'D';
  }

  private mapAssetType(finnhubType: string): string {
    const typeMap: Record<string, string> = {
      'Common Stock': 'stock',
      'ETF': 'etf',
      'Mutual Fund': 'mutual_fund',
      'Index': 'index',
      'ADR': 'stock'
    };

    return typeMap[finnhubType] || 'stock';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // Advanced Features
  // ========================================

  async getEarnings(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/earnings',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getNews(symbol?: string, category?: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: symbol ? '/company-news' : '/news',
      params: symbol ? {
        symbol: symbol.toUpperCase(),
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      } : {
        category: category || 'general'
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getRecommendations(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/recommendation',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getPriceTarget(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/price-target',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getUpgrades(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/stock/upgrade-downgrade',
      params: {
        symbol: symbol.toUpperCase()
      }
    };

    return await this.makeRequest<any>(config);
  }

  // ========================================
  // Cleanup
  // ========================================

  dispose(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    this.subscriptions.clear();
  }
}