// ===========================================
// src/services/api/providers/alphavantage.ts
// AlphaVantage API Integration Service
// ===========================================

import { BaseApiService, BaseApiConfig, RequestConfig, ApiError } from '../base';
import {
  ApiProvider,
  MarketData,
  HistoricalDataPoint,
  AssetSearchResult,
  TimeInterval,
  ApiResult,
  AlphaVantageQuoteResponse
} from '@/types';

// ========================================
// AlphaVantage Specific Types
// ========================================

export interface AlphaVantageConfig extends BaseApiConfig {
  apiKey: string;
}

interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval'?: string;
    '5. Output Size': string;
    '6. Time Zone': string;
  };
  [timeSeriesKey: string]: any;
}

interface AlphaVantageSearchResponse {
  bestMatches: Array<{
    '1. symbol': string;
    '2. name': string;
    '3. type': string;
    '4. region': string;
    '5. marketOpen': string;
    '6. marketClose': string;
    '7. timezone': string;
    '8. currency': string;
    '9. matchScore': string;
  }>;
}

interface AlphaVantageOverviewResponse {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  '50DayMovingAverage': string;
  '200DayMovingAverage': string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

// ========================================
// AlphaVantage Service Implementation
// ========================================

export class AlphaVantageService extends BaseApiService {
  private static readonly BASE_URL = 'https://www.alphavantage.co/query';
  private static readonly RATE_LIMITS = {
    requestsPerMinute: 5,
    requestsPerHour: 500,
    requestsPerDay: 500
  };

  constructor(apiKey: string) {
    const config: AlphaVantageConfig = {
      baseUrl: AlphaVantageService.BASE_URL,
      apiKey,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: AlphaVantageService.RATE_LIMITS,
      headers: {
        'Accept': 'application/json'
      }
    };

    super(config);
  }

  // ========================================
  // Base Class Implementation
  // ========================================

  get providerName(): ApiProvider {
    return 'alphavantage';
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

    if (error.message?.includes('rate limit')) {
      return new ApiError({
        ...baseError,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'AlphaVantage rate limit exceeded',
        rateLimited: true,
        retryAfter: 60000 // 1 minute
      });
    }

    if (error.status) {
      return new ApiError({
        ...baseError,
        code: `HTTP_${error.status}`,
        message: `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`,
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
    const now = Date.now();
    const resetTime = this.getRateLimitStatus().resetTime.getTime();
    
    if (now >= resetTime) {
      // Reset the rate limit
      this.rateLimit = {
        remaining: AlphaVantageService.RATE_LIMITS.requestsPerMinute,
        limit: AlphaVantageService.RATE_LIMITS.requestsPerMinute,
        resetTime: new Date(now + 60000)
      };
      return true;
    }

    return this.getRateLimitStatus().remaining > 0;
  }

  async getHealthStatus(): Promise<boolean> {
    try {
      // Test with a simple quote request
      const result = await this.getQuote('MSFT');
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
      endpoint: '',
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    const response = await this.makeRequest<AlphaVantageQuoteResponse>(config);
    
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
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<ApiResult<HistoricalDataPoint[]>> {
    const functionName = this.getTimeSeriesFunction(interval);
    
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: functionName,
        symbol: symbol.toUpperCase(),
        outputsize: outputSize,
        apikey: this.config.apiKey
      }
    };

    if (interval !== '1day' && interval !== '1week' && interval !== '1month') {
      config.params!.interval = interval;
    }

    const response = await this.makeRequest<AlphaVantageTimeSeriesResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformTimeSeriesResponse(response.data),
      timestamp: new Date()
    };
  }

  async searchSymbols(query: string): Promise<ApiResult<AssetSearchResult[]>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: this.config.apiKey
      }
    };

    const response = await this.makeRequest<AlphaVantageSearchResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformSearchResponse(response.data),
      timestamp: new Date()
    };
  }

  async getCompanyOverview(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    const response = await this.makeRequest<AlphaVantageOverviewResponse>(config);
    
    if (response.status === 'error') {
      return response;
    }

    return {
      status: 'success',
      data: this.transformOverviewResponse(response.data),
      timestamp: new Date()
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<ApiResult<MarketData[]>> {
    // AlphaVantage doesn't support batch requests, so we'll make individual requests
    // with rate limiting considerations
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
        
        // Small delay between requests to respect rate limits
        await this.sleep(200);
        
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
  // Response Transformation Methods
  // ========================================

  private transformQuoteResponse(data: AlphaVantageQuoteResponse, symbol: string): MarketData {
    const quote = data['Global Quote'];
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      timestamp: new Date(quote['07. latest trading day']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      currency: 'USD', // AlphaVantage typically returns USD
      marketCap: undefined // Not available in quote response
    };
  }

  private transformTimeSeriesResponse(data: AlphaVantageTimeSeriesResponse): HistoricalDataPoint[] {
    const metaData = data['Meta Data'];
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    
    if (!timeSeriesKey) {
      throw new Error('Invalid time series response format');
    }

    const timeSeries = data[timeSeriesKey];
    const dataPoints: HistoricalDataPoint[] = [];

    Object.entries(timeSeries).forEach(([dateStr, values]: [string, any]) => {
      dataPoints.push({
        date: new Date(dateStr),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
        adjustedClose: values['5. adjusted close'] ? parseFloat(values['5. adjusted close']) : undefined
      });
    });

    // Sort by date (most recent first)
    return dataPoints.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private transformSearchResponse(data: AlphaVantageSearchResponse): AssetSearchResult[] {
    return data.bestMatches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: this.mapAssetType(match['3. type']),
      exchange: match['4. region'], // Using region as exchange
      currency: match['8. currency'],
      country: match['4. region'],
      source: this.providerName
    }));
  }

  private transformOverviewResponse(data: AlphaVantageOverviewResponse): any {
    return {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      exchange: data.Exchange,
      currency: data.Currency,
      country: data.Country,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: data.MarketCapitalization ? parseInt(data.MarketCapitalization) : undefined,
      peRatio: data.PERatio ? parseFloat(data.PERatio) : undefined,
      dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : undefined,
      beta: data.Beta ? parseFloat(data.Beta) : undefined,
      eps: data.EPS ? parseFloat(data.EPS) : undefined,
      fiftyTwoWeekHigh: data['52WeekHigh'] ? parseFloat(data['52WeekHigh']) : undefined,
      fiftyTwoWeekLow: data['52WeekLow'] ? parseFloat(data['52WeekLow']) : undefined,
      movingAverage50: data['50DayMovingAverage'] ? parseFloat(data['50DayMovingAverage']) : undefined,
      movingAverage200: data['200DayMovingAverage'] ? parseFloat(data['200DayMovingAverage']) : undefined
    };
  }

  // ========================================
  // Utility Methods
  // ========================================

  private getTimeSeriesFunction(interval: TimeInterval): string {
    const intervalMap: Record<TimeInterval, string> = {
      '1min': 'TIME_SERIES_INTRADAY',
      '5min': 'TIME_SERIES_INTRADAY',
      '15min': 'TIME_SERIES_INTRADAY',
      '30min': 'TIME_SERIES_INTRADAY',
      '1hour': 'TIME_SERIES_INTRADAY',
      '4hour': 'TIME_SERIES_INTRADAY',
      '1day': 'TIME_SERIES_DAILY',
      '1week': 'TIME_SERIES_WEEKLY',
      '1month': 'TIME_SERIES_MONTHLY'
    };

    return intervalMap[interval] || 'TIME_SERIES_DAILY';
  }

  private mapAssetType(alphaVantageType: string): string {
    const typeMap: Record<string, string> = {
      'Equity': 'stock',
      'ETF': 'etf',
      'Mutual Fund': 'mutual_fund',
      'Index': 'index'
    };

    return typeMap[alphaVantageType] || 'stock';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // Advanced Features
  // ========================================

  async getEarningsData(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'EARNINGS',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getIncomeStatement(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'INCOME_STATEMENT',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getBalanceSheet(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'BALANCE_SHEET',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getCashFlow(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: 'CASH_FLOW',
        symbol: symbol.toUpperCase(),
        apikey: this.config.apiKey
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval: TimeInterval,
    timePeriod?: number,
    seriesType?: string
  ): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '',
      params: {
        function: indicator.toUpperCase(),
        symbol: symbol.toUpperCase(),
        interval: interval,
        apikey: this.config.apiKey
      }
    };

    if (timePeriod) {
      config.params!.time_period = timePeriod;
    }

    if (seriesType) {
      config.params!.series_type = seriesType;
    }

    return await this.makeRequest<any>(config);
  }
}