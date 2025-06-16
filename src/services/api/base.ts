// ===========================================
// src/services/api/base.ts
// Base API Service with Common Functionality
// ===========================================

import {
  ApiProvider,
  ApiResult,
  ApiError,
  RateLimitInfo,
  ApiResponse,
  ApiErrorDetails,
  ProviderFailover,
  ApiConfiguration
} from '@/types';

// ========================================
// Base Configuration
// ========================================

export interface BaseApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// ========================================
// Base API Service Class
// ========================================

export abstract class BaseApiService {
  protected config: BaseApiConfig;
  protected rateLimit: RateLimitInfo;
  protected requestQueue: RequestQueue;
  protected cache: Map<string, CacheEntry>;

  constructor(config: BaseApiConfig) {
    this.config = config;
    this.rateLimit = {
      remaining: config.rateLimit.requestsPerMinute,
      limit: config.rateLimit.requestsPerMinute,
      resetTime: new Date(Date.now() + 60000) // 1 minute from now
    };
    this.requestQueue = new RequestQueue();
    this.cache = new Map();
  }

  // ========================================
  // Abstract Methods (Provider-specific)
  // ========================================

  abstract get providerName(): ApiProvider;
  abstract normalizeError(error: any): ApiError;
  abstract checkRateLimit(): boolean;
  abstract getHealthStatus(): Promise<boolean>;

  // ========================================
  // HTTP Request Methods
  // ========================================

  protected async makeRequest<T>(config: RequestConfig): Promise<ApiResult<T>> {
    const startTime = Date.now();
    
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        throw new ApiError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          provider: this.providerName,
          endpoint: config.endpoint,
          rateLimited: true,
          retryAfter: this.getRateLimitResetTime()
        });
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(config);
      const cachedResponse = this.getFromCache<T>(cacheKey);
      if (cachedResponse) {
        return {
          status: 'success',
          data: cachedResponse,
          timestamp: new Date()
        };
      }

      // Add to request queue if rate limited
      if (this.shouldQueue(config)) {
        return await this.queueRequest<T>(config);
      }

      // Make the actual request
      const response = await this.executeRequest<T>(config);
      
      // Update rate limit info
      this.updateRateLimit(response);

      // Cache successful responses
      if (response.status === 'success') {
        this.addToCache(cacheKey, response.data);
      }

      // Track metrics
      this.trackRequestMetrics(config.endpoint, Date.now() - startTime, true);

      return response;

    } catch (error) {
      this.trackRequestMetrics(config.endpoint, Date.now() - startTime, false);
      
      // Handle retries
      if (this.shouldRetry(error, config)) {
        return await this.retryRequest<T>(config, error);
      }

      return {
        status: 'error',
        error: this.normalizeError(error),
        timestamp: new Date()
      };
    }
  }

  private async executeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(config.endpoint, config.params);
    const headers = { ...this.getDefaultHeaders(), ...config.headers };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: 'success',
        data: this.transformResponse<T>(data),
        timestamp: new Date(),
        rateLimit: this.extractRateLimitFromHeaders(response.headers)
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'FinancialRiskAnalyzer/1.0'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }

    return headers;
  }

  protected transformResponse<T>(data: any): T {
    // Default implementation - providers can override
    return data as T;
  }

  private extractRateLimitFromHeaders(headers: Headers): RateLimitInfo | undefined {
    const remaining = headers.get('X-RateLimit-Remaining');
    const limit = headers.get('X-RateLimit-Limit');
    const reset = headers.get('X-RateLimit-Reset');

    if (remaining && limit && reset) {
      return {
        remaining: parseInt(remaining),
        limit: parseInt(limit),
        resetTime: new Date(parseInt(reset) * 1000)
      };
    }

    return undefined;
  }

  private updateRateLimit(response: ApiResponse<any>): void {
    if (response.rateLimit) {
      this.rateLimit = response.rateLimit;
    } else {
      // Estimate rate limit usage
      this.rateLimit.remaining = Math.max(0, this.rateLimit.remaining - 1);
      
      if (this.rateLimit.remaining === 0) {
        this.rateLimit.resetTime = new Date(Date.now() + 60000); // Reset in 1 minute
      }
    }
  }

  // ========================================
  // Caching
  // ========================================

  private generateCacheKey(config: RequestConfig): string {
    const { endpoint, params } = config;
    const sortedParams = params ? 
      Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') : '';
    return `${this.providerName}:${endpoint}:${sortedParams}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data as T;
  }

  private addToCache<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      hits: 0,
      createdAt: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });

    // If still too many, remove least recently used
    if (this.cache.size > 1000) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, this.cache.size - 800);

      sortedEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  // ========================================
  // Request Queuing & Rate Limiting
  // ========================================

  private shouldQueue(config: RequestConfig): boolean {
    return this.rateLimit.remaining <= 1 && this.getRateLimitResetTime() > 1000;
  }

  private getRateLimitResetTime(): number {
    return Math.max(0, this.rateLimit.resetTime.getTime() - Date.now());
  }

  private async queueRequest<T>(config: RequestConfig): Promise<ApiResult<T>> {
    return new Promise((resolve, reject) => {
      this.requestQueue.add({
        config,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  // ========================================
  // Retry Logic
  // ========================================

  private shouldRetry(error: any, config: RequestConfig): boolean {
    const retryCount = (config as any).__retryCount || 0;
    
    if (retryCount >= (config.retries || this.config.retryAttempts)) {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx status codes
    return (
      error.name === 'AbortError' ||
      error.code === 'NETWORK_ERROR' ||
      (error.status >= 500 && error.status < 600) ||
      error.code === 'TIMEOUT'
    );
  }

  private async retryRequest<T>(config: RequestConfig, lastError: any): Promise<ApiResult<T>> {
    const retryCount = ((config as any).__retryCount || 0) + 1;
    const delay = this.calculateRetryDelay(retryCount);

    await this.sleep(delay);

    return this.makeRequest<T>({
      ...config,
      __retryCount: retryCount
    } as any);
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // 0-1 second jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // Metrics & Monitoring
  // ========================================

  private trackRequestMetrics(endpoint: string, responseTime: number, success: boolean): void {
    // This would integrate with your analytics service
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.providerName}] ${endpoint}: ${responseTime}ms (${success ? 'success' : 'error'})`);
    }
  }

  // ========================================
  // Public Utility Methods
  // ========================================

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.length > 0 ? 
        entries.reduce((sum, entry) => sum + (Date.now() - entry.createdAt), 0) / entries.length : 0
    };
  }

  public getRateLimitStatus(): RateLimitInfo {
    return { ...this.rateLimit };
  }

  public isHealthy(): Promise<boolean> {
    return this.getHealthStatus();
  }
}

// ========================================
// Supporting Classes & Interfaces
// ========================================

interface CacheEntry {
  data: any;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

interface CacheStats {
  size: number;
  totalHits: number;
  averageAge: number;
}

interface QueuedRequest {
  config: RequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;

  add(request: QueuedRequest): void {
    this.queue.push(request);
    if (!this.processing) {
      this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      // Check if request is too old (timeout)
      if (Date.now() - request.timestamp > 30000) {
        request.reject(new Error('Request timeout in queue'));
        continue;
      }

      try {
        // Wait for rate limit to reset if needed
        await this.waitForRateLimit();
        
        // Process the request
        // Note: This would need to be implemented by the concrete service
        request.resolve(await this.executeQueuedRequest(request));
        
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  private async waitForRateLimit(): Promise<void> {
    // This would check the rate limit and wait if necessary
    // Implementation depends on the specific service
  }

  private async executeQueuedRequest(request: QueuedRequest): Promise<any> {
    // This would be implemented by the concrete service
    throw new Error('executeQueuedRequest must be implemented by concrete service');
  }
}

// ========================================
// Error Classes
// ========================================

export class ApiError extends Error {
  public readonly code: string;
  public readonly provider: ApiProvider;
  public readonly endpoint?: string;
  public readonly statusCode?: number;
  public readonly rateLimited?: boolean;
  public readonly retryAfter?: number;
  public readonly details?: any;

  constructor(details: ApiErrorDetails & { message: string }) {
    super(details.message);
    this.name = 'ApiError';
    this.code = details.code || 'UNKNOWN_ERROR';
    this.provider = details.provider;
    this.endpoint = details.endpoint;
    this.statusCode = details.statusCode;
    this.rateLimited = details.rateLimited;
    this.retryAfter = details.retryAfter;
    this.details = details.details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      rateLimited: this.rateLimited,
      retryAfter: this.retryAfter,
      details: this.details
    };
  }
}