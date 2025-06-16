// ===========================================
// src/types/api.ts
// API and Market Data Specific Types
// ===========================================

// ========================================
// API Provider Configurations
// ========================================

export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  supportedSymbols: string[];
  supportedIntervals: TimeInterval[];
}

export interface FinnhubConfig {
  apiKey: string;
  baseUrl: string;
  websocketUrl: string;
  rateLimit: number;
  supportedExchanges: string[];
}

export interface PolygonConfig {
  apiKey: string;
  baseUrl: string;
  tier: 'basic' | 'starter' | 'developer' | 'advanced';
  rateLimit: number;
  supportedAssetTypes: AssetType[];
}

export interface YahooFinanceConfig {
  baseUrl: string;
  rateLimit: number;
  requiresCookie: boolean;
  supportedRegions: string[];
}

export interface TwelveDataConfig {
  apiKey: string;
  baseUrl: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  rateLimit: number;
  supportedMarkets: string[];
}

// ========================================
// API Request/Response Types
// ========================================

export interface QuoteRequest {
  symbol: string;
  provider?: ApiProvider;
  fields?: QuoteField[];
}

export interface HistoricalRequest {
  symbol: string;
  interval: TimeInterval;
  range: TimeRange;
  provider?: ApiProvider;
  adjustedClose?: boolean;
  includeDividends?: boolean;
}

export interface SearchRequest {
  query: string;
  type?: AssetType;
  exchange?: string;
  limit?: number;
  provider?: ApiProvider;
}

export interface BatchQuoteRequest {
  symbols: string[];
  provider?: ApiProvider;
  fields?: QuoteField[];
  priority?: RequestPriority;
}

// ========================================
// API Response Structures
// ========================================

export interface AlphaVantageQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export interface FinnhubQuoteResponse {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

export interface PolygonQuoteResponse {
  status: string;
  request_id: string;
  results: {
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
    vw: number; // volume weighted average price
    t: number; // timestamp
  }[];
}

export interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketVolume: number;
      regularMarketOpen: number;
      regularMarketDayHigh: number;
      regularMarketDayLow: number;
      regularMarketPreviousClose: number;
      marketCap?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      currency: string;
      exchangeName: string;
    }>;
    error: null | string;
  };
}

// ========================================
// WebSocket Types
// ========================================

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  subscriptions: WebSocketSubscription[];
}

export interface WebSocketSubscription {
  type: 'quote' | 'trade' | 'news' | 'analysis';
  symbols: string[];
  fields?: string[];
  throttle?: number;
}

export interface WebSocketMessage {
  type: 'data' | 'error' | 'heartbeat' | 'subscription';
  timestamp: number;
  payload: any;
}

export interface RealTimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

// ========================================
// Market Data Normalization
// ========================================

export interface NormalizedQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  currency: string;
  exchange: string;
  marketCap?: number;
  source: ApiProvider;
  lastUpdated: Date;
}

export interface NormalizedHistoricalData {
  symbol: string;
  data: HistoricalDataPoint[];
  interval: TimeInterval;
  source: ApiProvider;
  lastUpdated: Date;
  adjustedForSplits: boolean;
  adjustedForDividends: boolean;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
  currency: string;
  country: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  source: ApiProvider;
}

// ========================================
// Cache Management
// ========================================

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  source: ApiProvider;
  hits: number;
}

export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  strategies: CacheStrategy[];
}

export interface CacheStrategy {
  pattern: string;
  ttl: number;
  maxAge: number;
  priority: CachePriority;
}

// ========================================
// Error Handling
// ========================================

export interface ApiErrorDetails {
  provider: ApiProvider;
  endpoint: string;
  statusCode?: number;
  rateLimited?: boolean;
  retryAfter?: number;
  quotaExceeded?: boolean;
  invalidSymbol?: boolean;
  networkError?: boolean;
  parseError?: boolean;
}

export interface ProviderFailover {
  primary: ApiProvider;
  fallbacks: ApiProvider[];
  strategy: FailoverStrategy;
  maxRetries: number;
  retryDelay: number;
}

export interface RateLimitTracker {
  provider: ApiProvider;
  requestsRemaining: number;
  requestsLimit: number;
  resetTime: Date;
  window: number; // seconds
  violated: boolean;
}

// ========================================
// Analytics & Monitoring
// ========================================

export interface ApiMetrics {
  provider: ApiProvider;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastErrorTime?: Date;
  costTracking?: CostInfo;
}

export interface CostInfo {
  requestCost: number;
  monthlyCost: number;
  dailyUsage: number;
  monthlyQuota: number;
  overage: boolean;
}

export interface PerformanceMetrics {
  provider: ApiProvider;
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: number; // requests per second
  errorRate: number; // percentage
  availability: number; // percentage
}

// ========================================
// Type Enums
// ========================================

export type ApiProvider = 
  | 'alphavantage' 
  | 'finnhub' 
  | 'polygon' 
  | 'yahoo' 
  | 'twelvedata' 
  | 'iex'
  | 'quandl'
  | 'marketstack';

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

export type TimeRange = 
  | '1d' 
  | '5d' 
  | '1mo' 
  | '3mo' 
  | '6mo' 
  | '1y' 
  | '2y' 
  | '5y' 
  | '10y' 
  | 'max';

export type AssetType = 
  | 'stock' 
  | 'etf' 
  | 'mutual_fund' 
  | 'bond' 
  | 'commodity' 
  | 'crypto' 
  | 'forex' 
  | 'index' 
  | 'option' 
  | 'future';

export type QuoteField = 
  | 'price' 
  | 'change' 
  | 'volume' 
  | 'high' 
  | 'low' 
  | 'open' 
  | 'previous_close' 
  | 'market_cap' 
  | 'pe_ratio' 
  | 'dividend_yield';

export type RequestPriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'critical';

export type CachePriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'persistent';

export type FailoverStrategy = 
  | 'round_robin' 
  | 'priority' 
  | 'fastest' 
  | 'cheapest' 
  | 'most_reliable';

// ========================================
// Utility API Types
// ========================================

export type ApiProviderStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface DataQualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  timeliness: number; // 0-1
  consistency: number; // 0-1
  overall: DataQuality;
}

export interface ApiHealthCheck {
  provider: ApiProvider;
  status: ApiProviderStatus;
  responseTime: number;
  lastCheck: Date;
  uptime: number; // percentage
  issues?: string[];
}