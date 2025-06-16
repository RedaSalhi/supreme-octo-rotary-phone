// ===========================================
// src/services/api/providers/yahoo.ts
// Yahoo Finance API Integration Service
// ===========================================

import { BaseApiService, BaseApiConfig, RequestConfig, ApiError, ApiProvider, ApiResult } from '../base';
import { MarketData, HistoricalDataPoint } from '@/types';

// ========================================
// Yahoo Finance Specific Types
// ========================================

export type TimeInterval =
  | '1min'
  | '5min'
  | '15min'
  | '30min'
  | '1hour'
  | '4hour'
  | '1day'
  | '1week'
  | '1month';

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
  country: string;
  source: ApiProvider;
}

export interface YahooQuoteResponse {
  // Define as needed, or remove if not used
}

export interface YahooConfig extends BaseApiConfig {
  useProxy?: boolean;
  corsProxy?: string;
}

interface YahooHistoricalResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        scale: number;
        priceHint: number;
        currentTradingPeriod: any;
        tradingPeriods: any;
        dataGranularity: string;
        range: string;
        validRanges: string[];
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
        adjclose?: Array<{
          adjclose: (number | null)[];
        }>;
      };
    }>;
    error?: any;
  };
}

interface YahooSearchResponse {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    typeDisp?: string;
    exchange?: string;
    quoteType?: string;
    sector?: string;
    industry?: string;
    score?: number;
  }>;
}

// ========================================
// Yahoo Finance Service Implementation
// ========================================

export class YahooFinanceService extends BaseApiService {
  private static readonly BASE_URL = 'https://query1.finance.yahoo.com';
  private static readonly RATE_LIMITS = {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000
  };

  constructor(useProxy: boolean = false, corsProxy?: string) {
    const baseUrl = useProxy && corsProxy 
      ? `${corsProxy}/${YahooFinanceService.BASE_URL}`
      : YahooFinanceService.BASE_URL;

    const config: YahooConfig = {
      baseUrl,
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: YahooFinanceService.RATE_LIMITS,
      useProxy,
      corsProxy,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FinancialRiskAnalyzer/1.0)'
      }
    };

    super(config);
  }

  // ========================================
  // Base Class Implementation
  // ========================================

  get providerName(): ApiProvider {
    return 'yahoo_finance';
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

    if (error.message?.includes('CORS')) {
      return new ApiError({
        ...baseError,
        code: 'CORS_ERROR',
        message: 'CORS policy blocked the request. Consider using a proxy.',
        details: { suggestion: 'Enable proxy mode or configure CORS proxy' }
      });
    }

    if (error.status === 429) {
      return new ApiError({
        ...baseError,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Yahoo Finance rate limit exceeded',
        rateLimited: true,
        retryAfter: 60000
      });
    }

    if (error.status === 404) {
      return new ApiError({
        ...baseError,
        code: 'SYMBOL_NOT_FOUND',
        message: 'Symbol not found on Yahoo Finance',
        statusCode: error.status
      });
    }

    if (error.status >= 500) {
      return new ApiError({
        ...baseError,
        code: 'SERVER_ERROR',
        message: `Yahoo Finance server error: ${error.status}`,
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
      endpoint: '/v8/finance/chart/' + symbol.toUpperCase(),
      params: {
        interval: '1d',
        range: '1d',
        includePrePost: 'false',
        useYfid: 'true',
        includeAdjustedClose: 'true',
        includeTimestamps: 'false'
      }
    };

    const response = await this.makeRequest<YahooHistoricalResponse>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: this.transformQuoteResponse(response.data, symbol),
      timestamp: new Date()
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<ApiResult<MarketData[]>> {
    const symbolsParam = symbols.map(s => s.toUpperCase()).join(',');
    
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/v8/finance/chart/' + symbolsParam,
      params: {
        interval: '1d',
        range: '1d',
        includePrePost: 'false',
        useYfid: 'true',
        includeAdjustedClose: 'true'
      }
    };

    const response = await this.makeRequest<YahooHistoricalResponse>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: this.transformBatchQuoteResponse(response.data),
      timestamp: new Date()
    };
  }

  async getHistoricalData(
    symbol: string, 
    interval: TimeInterval = '1day',
    range: string = '1y'
  ): Promise<ApiResult<HistoricalDataPoint[]>> {
    const yahooInterval = this.mapTimeIntervalToYahoo(interval);
    const yahooRange = this.mapRangeToYahoo(range);

    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v8/finance/chart/${symbol.toUpperCase()}`,
      params: {
        interval: yahooInterval,
        range: yahooRange,
        includeAdjustedClose: 'true',
        events: 'div,split'
      }
    };

    const response = await this.makeRequest<YahooHistoricalResponse>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: this.transformHistoricalResponse(response.data),
      timestamp: new Date()
    };
  }

  async searchSymbols(query: string): Promise<ApiResult<AssetSearchResult[]>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/v1/finance/search',
      params: {
        q: query,
        quotesCount: 15,
        newsCount: 0,
        enableFuzzyQuery: false,
        quotesQueryId: 'tss_match_phrase_query',
        multiQuoteQueryId: 'multi_quote_single_token_query'
      }
    };

    const response = await this.makeRequest<YahooSearchResponse>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
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
      endpoint: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
      params: {
        modules: 'assetProfile,summaryProfile,price,summaryDetail,defaultKeyStatistics'
      }
    };

    const response = await this.makeRequest<any>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: this.transformProfileResponse(response.data),
      timestamp: new Date()
    };
  }

  async getFinancialData(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
      params: {
        modules: 'financialData,defaultKeyStatistics,summaryDetail,balanceSheetHistory,incomeStatementHistory,cashflowStatementHistory'
      }
    };

    const response = await this.makeRequest<any>(config);
    
    if (response.status === 'error') {
      return {
        status: 'error',
        error: response.error ?? new ApiError({
          provider: this.providerName,
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred'
        }),
        timestamp: new Date()
      };
    }

    if (!response.data) {
      return {
        status: 'error',
        error: new ApiError({
          provider: this.providerName,
          code: 'INVALID_RESPONSE',
          message: 'No data received from API'
        }),
        timestamp: new Date()
      };
    }

    return {
      status: 'success',
      data: this.transformFinancialResponse(response.data),
      timestamp: new Date()
    };
  }

  // ========================================
  // Response Transformation Methods
  // ========================================

  private transformQuoteResponse(data: YahooHistoricalResponse, symbol: string): MarketData {
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;

    if (!quote || !timestamps || timestamps.length === 0) {
      throw new Error('Invalid quote data from Yahoo Finance');
    }

    const latestIndex = timestamps.length - 1;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;

    return {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100,
      volume: quote.volume[latestIndex] || 0,
      timestamp: new Date(meta.regularMarketTime * 1000),
      high: quote.high[latestIndex] || currentPrice,
      low: quote.low[latestIndex] || currentPrice,
      open: quote.open[latestIndex] || currentPrice,
      previousClose: previousClose,
      currency: meta.currency || 'USD'
    };
  }

  private transformBatchQuoteResponse(data: YahooHistoricalResponse): MarketData[] {
    return data.chart.result.map(result => {
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;

      if (!quote || !timestamps || timestamps.length === 0) {
        return null;
      }

      const latestIndex = timestamps.length - 1;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose;

      return {
        symbol: meta.symbol,
        price: currentPrice,
        change: currentPrice - previousClose,
        changePercent: ((currentPrice - previousClose) / previousClose) * 100,
        volume: quote.volume[latestIndex] || 0,
        timestamp: new Date(meta.regularMarketTime * 1000),
        high: quote.high[latestIndex] || currentPrice,
        low: quote.low[latestIndex] || currentPrice,
        open: quote.open[latestIndex] || currentPrice,
        previousClose: previousClose,
        currency: meta.currency || 'USD'
      };
    }).filter(Boolean) as MarketData[];
  }

  private transformHistoricalResponse(data: YahooHistoricalResponse): HistoricalDataPoint[] {
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0];
    const timestamps = result.timestamp;

    if (!quote || !timestamps) {
      return [];
    }

    const dataPoints: HistoricalDataPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      const volume = quote.volume[i];

      // Skip invalid data points
      if (open === null || high === null || low === null || close === null) {
        continue;
      }

      dataPoints.push({
        date: new Date(timestamps[i] * 1000),
        open,
        high,
        low,
        close,
        volume: volume || 0,
        adjustedClose: adjClose?.adjclose[i] || close
      });
    }

    // Sort by date (most recent first)
    return dataPoints.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private transformSearchResponse(data: YahooSearchResponse): AssetSearchResult[] {
    return data.quotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      type: this.mapYahooQuoteType(quote.quoteType || ''),
      exchange: quote.exchDisp || quote.exchange || 'Unknown',
      currency: 'USD', // Yahoo doesn't provide currency in search
      country: 'US', // Default, could be enhanced
      sector: quote.sector,
      industry: quote.industry,
      source: this.providerName
    }));
  }

  private transformProfileResponse(data: any): any {
    const quoteSummary = data.quoteSummary?.result?.[0];
    if (!quoteSummary) return {};

    const assetProfile = quoteSummary.assetProfile || {};
    const summaryDetail = quoteSummary.summaryDetail || {};
    const price = quoteSummary.price || {};
    const keyStats = quoteSummary.defaultKeyStatistics || {};

    return {
      symbol: price.symbol,
      name: price.longName || price.shortName,
      sector: assetProfile.sector,
      industry: assetProfile.industry,
      country: assetProfile.country,
      website: assetProfile.website,
      description: assetProfile.longBusinessSummary,
      employees: assetProfile.fullTimeEmployees,
      marketCap: summaryDetail.marketCap?.raw,
      enterpriseValue: keyStats.enterpriseValue?.raw,
      peRatio: summaryDetail.trailingPE?.raw,
      forwardPE: summaryDetail.forwardPE?.raw,
      pegRatio: keyStats.pegRatio?.raw,
      priceToBook: keyStats.priceToBook?.raw,
      priceToSales: summaryDetail.priceToSalesTrailing12Months?.raw,
      beta: keyStats.beta?.raw,
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw,
      fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw,
      dividendYield: summaryDetail.dividendYield?.raw,
      payoutRatio: summaryDetail.payoutRatio?.raw
    };
  }

  private transformFinancialResponse(data: any): any {
    const quoteSummary = data.quoteSummary?.result?.[0];
    if (!quoteSummary) return {};

    const financialData = quoteSummary.financialData || {};
    const keyStats = quoteSummary.defaultKeyStatistics || {};

    return {
      totalRevenue: financialData.totalRevenue?.raw,
      grossProfit: financialData.grossProfit?.raw,
      ebitda: financialData.ebitda?.raw,
      netIncome: financialData.netIncomeToCommon?.raw,
      totalCash: financialData.totalCash?.raw,
      totalDebt: financialData.totalDebt?.raw,
      freeCashflow: financialData.freeCashflow?.raw,
      operatingCashflow: financialData.operatingCashflow?.raw,
      revenueGrowth: financialData.revenueGrowth?.raw,
      earningsGrowth: financialData.earningsGrowth?.raw,
      grossMargins: financialData.grossMargins?.raw,
      operatingMargins: financialData.operatingMargins?.raw,
      profitMargins: financialData.profitMargins?.raw,
      returnOnAssets: financialData.returnOnAssets?.raw,
      returnOnEquity: financialData.returnOnEquity?.raw,
      debtToEquity: financialData.debtToEquity?.raw
    };
  }

  // ========================================
  // Utility Methods
  // ========================================

  private mapTimeIntervalToYahoo(interval: TimeInterval): string {
    const intervalMap: Record<TimeInterval, string> = {
      '1min': '1m',
      '5min': '5m',
      '15min': '15m',
      '30min': '30m',
      '1hour': '1h',
      '4hour': '4h',
      '1day': '1d',
      '1week': '1wk',
      '1month': '1mo'
    };

    return intervalMap[interval] || '1d';
  }

  private mapRangeToYahoo(range: string): string {
    const rangeMap: Record<string, string> = {
      '1d': '1d',
      '5d': '5d',
      '1mo': '1mo',
      '3mo': '3mo',
      '6mo': '6mo',
      '1y': '1y',
      '2y': '2y',
      '5y': '5y',
      '10y': '10y',
      'max': 'max'
    };

    return rangeMap[range] || '1y';
  }

  private mapYahooQuoteType(quoteType: string): string {
    const typeMap: Record<string, string> = {
      'EQUITY': 'stock',
      'ETF': 'etf',
      'MUTUALFUND': 'mutual_fund',
      'INDEX': 'index',
      'CRYPTOCURRENCY': 'crypto',
      'CURRENCY': 'forex'
    };

    return typeMap[quoteType.toUpperCase()] || 'stock';
  }

  // ========================================
  // Advanced Features
  // ========================================

  async getNews(symbol?: string): Promise<ApiResult<any>> {
    const endpoint = symbol 
      ? `/v1/finance/search?q=${symbol.toUpperCase()}&newsCount=10&quotesCount=0`
      : '/v1/finance/trending/US?count=10';

    const config: RequestConfig = {
      method: 'GET',
      endpoint
    };

    return await this.makeRequest<any>(config);
  }

  async getRecommendations(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
      params: {
        modules: 'recommendationTrend,upgradeDowngradeHistory'
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getEarnings(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
      params: {
        modules: 'earnings,earningsHistory,earningsTrend'
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getDividends(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v8/finance/chart/${symbol.toUpperCase()}`,
      params: {
        range: '5y',
        interval: '1d',
        events: 'div'
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getSplits(symbol: string): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v8/finance/chart/${symbol.toUpperCase()}`,
      params: {
        range: '5y',
        interval: '1d',
        events: 'split'
      }
    };

    return await this.makeRequest<any>(config);
  }

  // ========================================
  // Market Indices & ETFs
  // ========================================

  async getMarketSummary(): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/v6/finance/quote/marketSummary',
      params: {
        region: 'US',
        lang: 'en'
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getTrendingStocks(region: string = 'US'): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: `/v1/finance/trending/${region}`,
      params: {
        count: 20
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getGainers(region: string = 'US'): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/v1/finance/screener/predefined/saved',
      params: {
        scrIds: 'day_gainers',
        count: 25,
        region
      }
    };

    return await this.makeRequest<any>(config);
  }

  async getLosers(region: string = 'US'): Promise<ApiResult<any>> {
    const config: RequestConfig = {
      method: 'GET',
      endpoint: '/v1/finance/screener/predefined/saved',
      params: {
        scrIds: 'day_losers',
        count: 25,
        region
      }
    };

    return await this.makeRequest<any>(config);
  }
}