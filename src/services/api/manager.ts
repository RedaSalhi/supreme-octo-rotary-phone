// ===========================================
// src/services/api/manager.ts
// API Manager - Coordinates Multiple Providers
// ===========================================

import {
  ApiProvider,
  ApiResult,
  MarketData,
  HistoricalDataPoint,
  AssetSearchResult,
  TimeInterval,
  ProviderFailover,
  ApiHealthCheck,
  PerformanceMetrics,
  BatchQuoteRequest,
  HistoricalRequest,
  SearchRequest
} from '@/types';

import { BaseApiService } from './base';
import { AlphaVantageService } from './providers/alphavantage';
// Import other providers as they're implemented
import { FinnhubService } from './providers/finnhub';
// import { PolygonService } from './providers/polygon';
import { YahooFinanceService } from './providers/yahoo';

// ========================================
// Configuration Interfaces
// ========================================

export interface ApiManagerConfig {
  primaryProvider: ApiProvider;
  fallbackProviders: ApiProvider[];
  providerConfigs: {
    alphavantage?: { apiKey: string };
    finnhub?: { apiKey: string };
    polygon?: { apiKey: string };
    yahoo?: { enabled: boolean };
    twelvedata?: { apiKey: string };
    iex?: { apiKey: string };
  };
  failover: FailoverConfig;
  caching: CachingConfig;
  monitoring: MonitoringConfig;
}

interface FailoverConfig {
  strategy: 'round_robin' | 'priority' | 'fastest' | 'cheapest' | 'most_reliable';
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  enableAutoFailover: boolean;
}

interface CachingConfig {
  enabled: boolean;
  quoteTTL: number;
  historicalTTL: number;
  searchTTL: number;
  maxCacheSize: number;
}

interface MonitoringConfig {
  trackPerformance: boolean;
  trackCosts: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    downtime: number;
  };
}

// ========================================
// API Manager Class
// ========================================

export class ApiManager {
  private providers: Map<ApiProvider, BaseApiService> = new Map();
  private config: ApiManagerConfig;
  private healthStatus: Map<ApiProvider, ApiHealthCheck> = new Map();
  private performanceMetrics: Map<ApiProvider, PerformanceMetrics> = new Map();
  private failoverState: FailoverState;
  private monitoringInterval?: NodeJS.Timer;

  constructor(config: ApiManagerConfig) {
    this.config = config;
    this.failoverState = {
      currentProvider: config.primaryProvider,
      failedProviders: new Set(),
      lastFailoverTime: null,
      consecutiveFailures: 0
    };

    this.initializeProviders();
    this.startMonitoring();
  }

  // ========================================
  // Initialization
  // ========================================

  private initializeProviders(): void {
    const { providerConfigs } = this.config;

    // Initialize AlphaVantage
    if (providerConfigs.alphavantage?.apiKey) {
      this.providers.set('alphavantage', new AlphaVantageService(providerConfigs.alphavantage.apiKey));
    }

    // Initialize other providers (when implemented)
    // if (providerConfigs.finnhub?.apiKey) {
    //   this.providers.set('finnhub', new FinnhubService(providerConfigs.finnhub.apiKey));
    // }

    // Initialize health status for all providers
    this.providers.forEach((service, provider) => {
      this.healthStatus.set(provider, {
        provider,
        status: 'online',
        lastCheck: new Date(),
        responseTime: 0,
        uptime: 100
      });

      this.performanceMetrics.set(provider, {
        provider,
        responseTime: {
          min: 0,
          max: 0,
          avg: 0,
          p95: 0,
          p99: 0
        },
        throughput: 0,
        errorRate: 0,
        availability: 100
      });
    });
  }

  private startMonitoring(): void {
    if (this.config.monitoring.trackPerformance) {
      this.monitoringInterval = setInterval(() => {
        this.performHealthChecks();
        this.updatePerformanceMetrics();
      }, this.config.failover.healthCheckInterval);
    }
  }

  // ========================================
  // Public API Methods
  // ========================================

  async getQuote(symbol: string, preferredProvider?: ApiProvider): Promise<ApiResult<MarketData>> {
    const provider = preferredProvider || this.getCurrentProvider();
    
    return await this.executeWithFailover(
      async (service: BaseApiService) => {
        if ('getQuote' in service) {
          return await (service as any).getQuote(symbol);
        }
        throw new Error('Provider does not support getQuote');
      },
      provider
    );
  }

  async getHistoricalData(
    request: HistoricalRequest
  ): Promise<ApiResult<HistoricalDataPoint[]>> {
    const provider = request.provider || this.getCurrentProvider();
    
    return await this.executeWithFailover(
      async (service: BaseApiService) => {
        if ('getHistoricalData' in service) {
          return await (service as any).getHistoricalData(
            request.symbol,
            request.interval,
            request.range === '1y' ? 'full' : 'compact'
          );
        }
        throw new Error('Provider does not support getHistoricalData');
      },
      provider
    );
  }

  async searchSymbols(request: SearchRequest): Promise<ApiResult<AssetSearchResult[]>> {
    const provider = request.provider || this.getCurrentProvider();
    
    return await this.executeWithFailover(
      async (service: BaseApiService) => {
        if ('searchSymbols' in service) {
          return await (service as any).searchSymbols(request.query);
        }
        throw new Error('Provider does not support searchSymbols');
      },
      provider
    );
  }

  async getBatchQuotes(request: BatchQuoteRequest): Promise<ApiResult<MarketData[]>> {
    const provider = request.provider || this.getCurrentProvider();
    
    return await this.executeWithFailover(
      async (service: BaseApiService) => {
        if ('getBatchQuotes' in service) {
          return await (service as any).getBatchQuotes(request.symbols);
        }
        
        // Fallback to individual quotes if batch not supported
        const quotes: MarketData[] = [];
        for (const symbol of request.symbols) {
          const result = await (service as any).getQuote(symbol);
          if (result.status === 'success') {
            quotes.push(result.data);
          }
        }
        
        return {
          status: 'success' as const,
          data: quotes,
          timestamp: new Date()
        };
      },
      provider
    );
  }

  async getCompanyOverview(symbol: string, provider?: ApiProvider): Promise<ApiResult<any>> {
    const targetProvider = provider || this.getCurrentProvider();
    
    return await this.executeWithFailover(
      async (service: BaseApiService) => {
        if ('getCompanyOverview' in service) {
          return await (service as any).getCompanyOverview(symbol);
        }
        throw new Error('Provider does not support getCompanyOverview');
      },
      targetProvider
    );
  }

  // ========================================
  // Failover Logic
  // ========================================

  private async executeWithFailover<T>(
    operation: (service: BaseApiService) => Promise<ApiResult<T>>,
    preferredProvider: ApiProvider
  ): Promise<ApiResult<T>> {
    const startTime = Date.now();
    let lastError: any;
    
    // Try preferred provider first
    const providers = this.getProviderOrder(preferredProvider);
    
    for (const provider of providers) {
      const service = this.providers.get(provider);
      if (!service) continue;

      // Skip if provider is marked as failed and not enough time has passed
      if (this.isProviderTemporarilyFailed(provider)) {
        continue;
      }

      try {
        const result = await operation(service);
        
        // Record success metrics
        this.recordMetrics(provider, Date.now() - startTime, true);
        
        // Clear failure state on success
        this.clearProviderFailure(provider);
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Record failure metrics
        this.recordMetrics(provider, Date.now() - startTime, false);
        
        // Mark provider as failed if appropriate
        if (this.shouldMarkProviderAsFailed(error)) {
          this.markProviderAsFailed(provider);
        }

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    return {
      status: 'error',
      error: lastError || new Error('All providers failed'),
      timestamp: new Date()
    };
  }

  private getProviderOrder(preferredProvider: ApiProvider): ApiProvider[] {
    const { strategy } = this.config.failover;
    const availableProviders = Array.from(this.providers.keys());
    
    switch (strategy) {
      case 'priority':
        return [preferredProvider, ...this.config.fallbackProviders]
          .filter(p => availableProviders.includes(p));
          
      case 'fastest':
        return availableProviders.sort((a, b) => {
          const aMetrics = this.performanceMetrics.get(a)!;
          const bMetrics = this.performanceMetrics.get(b)!;
          return aMetrics.responseTime.avg - bMetrics.responseTime.avg;
        });
        
      case 'most_reliable':
        return availableProviders.sort((a, b) => {
          const aMetrics = this.performanceMetrics.get(a)!;
          const bMetrics = this.performanceMetrics.get(b)!;
          return aMetrics.errorRate - bMetrics.errorRate;
        });
        
      case 'round_robin':
        // Simple round-robin implementation
        const currentIndex = availableProviders.indexOf(this.failoverState.currentProvider);
        const nextIndex = (currentIndex + 1) % availableProviders.length;
        this.failoverState.currentProvider = availableProviders[nextIndex];
        return [this.failoverState.currentProvider, ...availableProviders.filter(p => p !== this.failoverState.currentProvider)];
        
      default:
        return [preferredProvider, ...availableProviders.filter(p => p !== preferredProvider)];
    }
  }

  private isProviderTemporarilyFailed(provider: ApiProvider): boolean {
    if (!this.failoverState.failedProviders.has(provider)) {
      return false;
    }

    const healthCheck = this.healthStatus.get(provider);
    if (!healthCheck) return true;

    // Re-try failed providers after a certain time
    const retryAfter = 5 * 60 * 1000; // 5 minutes
    return Date.now() - healthCheck.lastCheck.getTime() < retryAfter;
  }

  private shouldMarkProviderAsFailed(error: any): boolean {
    // Mark as failed for certain types of errors
    return (
      error?.code === 'RATE_LIMIT_EXCEEDED' ||
      error?.code === 'API_KEY_INVALID' ||
      error?.code === 'SERVICE_UNAVAILABLE' ||
      error?.statusCode >= 500
    );
  }

  private markProviderAsFailed(provider: ApiProvider): void {
    this.failoverState.failedProviders.add(provider);
    this.failoverState.consecutiveFailures++;
    
    const healthCheck = this.healthStatus.get(provider);
    if (healthCheck) {
      healthCheck.status = 'offline';
      healthCheck.lastCheck = new Date();
    }

    // Auto-failover to next provider
    if (this.config.failover.enableAutoFailover && provider === this.failoverState.currentProvider) {
      this.performFailover();
    }
  }

  private clearProviderFailure(provider: ApiProvider): void {
    this.failoverState.failedProviders.delete(provider);
    this.failoverState.consecutiveFailures = 0;
    
    const healthCheck = this.healthStatus.get(provider);
    if (healthCheck) {
      healthCheck.status = 'online';
      healthCheck.lastCheck = new Date();
    }
  }

  private performFailover(): void {
    const availableProviders = Array.from(this.providers.keys())
      .filter(p => !this.failoverState.failedProviders.has(p));
      
    if (availableProviders.length > 0) {
      this.failoverState.currentProvider = availableProviders[0];
      this.failoverState.lastFailoverTime = new Date();
    }
  }

  // ========================================
  // Monitoring & Health Checks
  // ========================================

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.entries()).map(
      async ([provider, service]) => {
        const startTime = Date.now();
        
        try {
          const isHealthy = await service.isHealthy();
          const responseTime = Date.now() - startTime;
          
          this.healthStatus.set(provider, {
            provider,
            status: isHealthy ? 'online' : 'degraded',
            lastCheck: new Date(),
            responseTime,
            uptime: this.calculateUptime(provider)
          });
          
        } catch (error) {
          this.healthStatus.set(provider, {
            provider,
            status: 'offline',
            lastCheck: new Date(),
            responseTime: Date.now() - startTime,
            uptime: this.calculateUptime(provider),
            issues: [error instanceof Error ? error.message : 'Health check failed']
          });
        }
      }
    );

    await Promise.all(healthCheckPromises);
  }

  private updatePerformanceMetrics(): void {
    // This would be implemented to calculate rolling averages
    // of response times, error rates, etc. from stored metrics
  }

  private recordMetrics(provider: ApiProvider, responseTime: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(provider);
    if (!metrics) return;

    // Update response time (rolling average)
    metrics.responseTime.avg = (metrics.responseTime.avg * 0.9) + (responseTime * 0.1);
    metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
    
    // Update error rate (rolling average)
    const errorOccurred = success ? 0 : 1;
    metrics.errorRate = (metrics.errorRate * 0.9) + (errorOccurred * 0.1);
    
    // Update throughput (requests per second)
    metrics.throughput = metrics.throughput * 0.95 + 0.05; // Simplified calculation
  }

  private calculateUptime(provider: ApiProvider): number {
    // Simplified uptime calculation
    const healthCheck = this.healthStatus.get(provider);
    return healthCheck?.status === 'online' ? 100 : 0;
  }

  // ========================================
  // Configuration & Management
  // ========================================

  public getCurrentProvider(): ApiProvider {
    return this.failoverState.currentProvider;
  }

  public getProviderStatus(): Map<ApiProvider, ApiHealthCheck> {
    return new Map(this.healthStatus);
  }

  public getPerformanceMetrics(): Map<ApiProvider, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  public switchProvider(provider: ApiProvider): boolean {
    if (this.providers.has(provider) && !this.failoverState.failedProviders.has(provider)) {
      this.failoverState.currentProvider = provider;
      return true;
    }
    return false;
  }

  public clearCache(provider?: ApiProvider): void {
    if (provider) {
      const service = this.providers.get(provider);
      if (service) {
        service.clearCache();
      }
    } else {
      this.providers.forEach(service => service.clearCache());
    }
  }

  public getCacheStats(): Map<ApiProvider, any> {
    const stats = new Map();
    this.providers.forEach((service, provider) => {
      stats.set(provider, service.getCacheStats());
    });
    return stats;
  }

  public updateConfiguration(config: Partial<ApiManagerConfig>): void {
    // Update configuration
    this.config = { ...this.config, ...config };

    // Restart monitoring if interval changed
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval as unknown as number);
      this.startMonitoring();
    }
  }

  // ========================================
  // Cleanup
  // ========================================

  public dispose(): void {
    // Clean up resources
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval as unknown as number);
    }

    // Clear all caches
    this.clearCache();

    // Reset state
    this.healthStatus.clear();
    this.performanceMetrics.clear();
    this.failoverState = {
      currentProvider: this.config.primaryProvider,
      failedProviders: new Set(),
      lastFailoverTime: null,
      consecutiveFailures: 0
    };
  }
}

// ========================================
// Supporting Types
// ========================================

interface FailoverState {
  currentProvider: ApiProvider;
  failedProviders: Set<ApiProvider>;
  lastFailoverTime: Date | null;
  consecutiveFailures: number;
}

// ========================================
// Factory Function
// ========================================

export function createApiManager(config?: Partial<ApiManagerConfig>): ApiManager {
  const defaultConfig: ApiManagerConfig = {
    primaryProvider: 'alphavantage',
    fallbackProviders: ['finnhub'],
    providerConfigs: {
      alphavantage: { apiKey: process.env.ALPHAVANTAGE_API_KEY || '' },
      finnhub: { apiKey: process.env.FINNHUB_API_KEY || '' },
      polygon: { apiKey: process.env.POLYGON_API_KEY || '' },
      yahoo: { enabled: process.env.YAHOO_FINANCE_ENABLED === 'true' },
      twelvedata: { apiKey: process.env.TWELVE_DATA_API_KEY || '' }
    },
    failover: {
      strategy: 'priority',
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000, // 1 minute
      enableAutoFailover: true
    },
    caching: {
      enabled: true,
      quoteTTL: 60000, // 1 minute
      historicalTTL: 3600000, // 1 hour
      searchTTL: 1800000, // 30 minutes
      maxCacheSize: 1000
    },
    monitoring: {
      trackPerformance: true,
      trackCosts: false,
      alertThresholds: {
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 seconds
        downtime: 0.05 // 5%
      }
    }
  };

  return new ApiManager({ ...defaultConfig, ...config });
}