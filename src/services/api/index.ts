// ===========================================
// src/services/api/index.ts
// API Services Main Export & Factory
// ===========================================

// Base exports
export { BaseApiService, ApiError } from './base';
export { ApiManager, createApiManager } from './manager';

// Provider exports
export { AlphaVantageService } from './providers/alphavantage';
export { FinnhubService } from './providers/finnhub';
export { YahooFinanceService } from './providers/yahoo';

// Types
export type {
  BaseApiConfig,
  RequestConfig
} from './base';

export type {
  ApiManagerConfig
} from './manager';

export type {
  AlphaVantageConfig
} from './providers/alphavantage';

export type {
  FinnhubConfig
} from './providers/finnhub';

export type {
  YahooConfig
} from './providers/yahoo';

// ===========================================
// Main API Service Factory
// ===========================================

import { ApiManager, createApiManager } from './manager';
import { ApiProvider } from '@/types';

export interface ApiServiceConfig {
  primaryProvider?: ApiProvider;
  apiKeys: {
    alphavantage?: string;
    finnhub?: string;
    polygon?: string;
    twelvedata?: string;
  };
  enabledProviders?: ApiProvider[];
  fallbackEnabled?: boolean;
  cachingEnabled?: boolean;
  offlineMode?: boolean;
}

/**
 * Creates and configures the main API service manager
 */
export function createApiService(config?: ApiServiceConfig): ApiManager {
  // Get API keys from environment variables
  const envApiKeys = {
    alphavantage: process.env.ALPHAVANTAGE_API_KEY,
    finnhub: process.env.FINNHUB_API_KEY,
    polygon: process.env.POLYGON_API_KEY,
    twelvedata: process.env.TWELVE_DATA_API_KEY
  };

  // Merge provided config with environment variables
  const apiKeys = { ...envApiKeys, ...config?.apiKeys };

  // Determine enabled providers based on available API keys
  const enabledProviders: ApiProvider[] = [];
  if (apiKeys.alphavantage) enabledProviders.push('alphavantage');
  if (apiKeys.finnhub) enabledProviders.push('finnhub');
  if (apiKeys.polygon) enabledProviders.push('polygon');
  if (apiKeys.twelvedata) enabledProviders.push('twelvedata');
  
  // Always include Yahoo Finance as it doesn't require an API key
  if (process.env.YAHOO_FINANCE_ENABLED === 'true') {
    enabledProviders.push('yahoo');
  }

  // Select primary provider
  const primaryProvider = config?.primaryProvider || 
                         (enabledProviders.includes('alphavantage') ? 'alphavantage' : enabledProviders[0]);

  // Create fallback list (exclude primary)
  const fallbackProviders = enabledProviders.filter(p => p !== primaryProvider);

  const managerConfig = {
    primaryProvider,
    fallbackProviders,
    providerConfigs: {
      alphavantage: apiKeys.alphavantage ? { apiKey: apiKeys.alphavantage } : undefined,
      finnhub: apiKeys.finnhub ? { apiKey: apiKeys.finnhub } : undefined,
      polygon: apiKeys.polygon ? { apiKey: apiKeys.polygon } : undefined,
      twelvedata: apiKeys.twelvedata ? { apiKey: apiKeys.twelvedata } : undefined,
      yahoo: process.env.YAHOO_FINANCE_ENABLED === 'true' ? { enabled: true } : undefined
    },
    failover: {
      strategy: 'priority' as const,
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000,
      enableAutoFailover: config?.fallbackEnabled ?? true
    },
    caching: {
      enabled: config?.cachingEnabled ?? true,
      quoteTTL: 60000, // 1 minute
      historicalTTL: 3600000, // 1 hour
      searchTTL: 1800000, // 30 minutes
      maxCacheSize: 1000
    },
    monitoring: {
      trackPerformance: true,
      trackCosts: false,
      alertThresholds: {
        errorRate: 0.1,
        responseTime: 5000,
        downtime: 0.05
      }
    }
  };

  return createApiManager(managerConfig);
}

// ===========================================
// Singleton Instance
// ===========================================

let apiServiceInstance: ApiManager | null = null;

/**
 * Gets the singleton instance of the API service
 */
export function getApiService(): ApiManager {
  if (!apiServiceInstance) {
    apiServiceInstance = createApiService();
  }
  return apiServiceInstance;
}

/**
 * Reinitializes the API service with new configuration
 */
export function reinitializeApiService(config: ApiServiceConfig): ApiManager {
  if (apiServiceInstance) {
    apiServiceInstance.dispose();
  }
  apiServiceInstance = createApiService(config);
  return apiServiceInstance;
}

// ===========================================
// Convenience Functions
// ===========================================

/**
 * Quick quote lookup using the default API service
 */
export async function getQuote(symbol: string, provider?: ApiProvider) {
  const apiService = getApiService();
  return apiService.getQuote(symbol, provider);
}

/**
 * Quick historical data lookup using the default API service
 */
export async function getHistoricalData(symbol: string, interval?: string, range?: string) {
  const apiService = getApiService();
  return apiService.getHistoricalData({
    symbol,
    interval: interval as any || '1day',
    range: range as any || '1y'
  });
}

/**
 * Quick symbol search using the default API service
 */
export async function searchSymbols(query: string) {
  const apiService = getApiService();
  return apiService.searchSymbols({ query });
}

/**
 * Quick batch quotes using the default API service
 */
export async function getBatchQuotes(symbols: string[], provider?: ApiProvider) {
  const apiService = getApiService();
  return apiService.getBatchQuotes({ symbols, provider });
}

// ===========================================
// Provider Health Monitoring
// ===========================================

/**
 * Gets the status of all API providers
 */
export async function getProviderStatus() {
  const apiService = getApiService();
  return apiService.getProviderStatus();
}

/**
 * Gets performance metrics for all providers
 */
export async function getProviderMetrics() {
  const apiService = getApiService();
  return apiService.getPerformanceMetrics();
}

/**
 * Manually switches to a different provider
 */
export function switchProvider(provider: ApiProvider): boolean {
  const apiService = getApiService();
  return apiService.switchProvider(provider);
}

/**
 * Clears cache for all or specific provider
 */
export function clearCache(provider?: ApiProvider): void {
  const apiService = getApiService();
  apiService.clearCache(provider);
}

// ===========================================
// Development & Debugging
// ===========================================

/**
 * Gets detailed debugging information about the API service
 */
export async function getDebugInfo() {
  const apiService = getApiService();
  
  return {
    currentProvider: apiService.getCurrentProvider(),
    providerStatus: apiService.getProviderStatus(),
    performanceMetrics: apiService.getPerformanceMetrics(),
    cacheStats: apiService.getCacheStats(),
    configuration: {
      // Add non-sensitive config info
      providers: Array.from(apiService.getProviderStatus().keys()),
      cachingEnabled: true, // This would come from actual config
      monitoringEnabled: true
    }
  };
}

/**
 * Validates API service configuration and connectivity
 */
export async function validateConfiguration(): Promise<{
  valid: boolean;
  providers: Array<{
    name: ApiProvider;
    configured: boolean;
    healthy: boolean;
    error?: string;
  }>;
  recommendations: string[];
}> {
  const apiService = getApiService();
  const providerStatus = apiService.getProviderStatus();
  const recommendations: string[] = [];
  
  const providers = Array.from(providerStatus.entries()).map(([provider, status]) => ({
    name: provider,
    configured: true, // Would check actual config
    healthy: status.status === 'online',
    error: status.status !== 'online' ? 'Provider unavailable' : undefined
  }));

  const healthyProviders = providers.filter(p => p.healthy);
  
  if (healthyProviders.length === 0) {
    recommendations.push('No API providers are currently healthy. Check your API keys and network connection.');
  } else if (healthyProviders.length === 1) {
    recommendations.push('Consider configuring additional API providers for redundancy.');
  }

  if (!providers.some(p => p.name === 'yahoo' && p.healthy)) {
    recommendations.push('Enable Yahoo Finance as a free backup provider.');
  }

  return {
    valid: healthyProviders.length > 0,
    providers,
    recommendations
  };
}

// ===========================================
// Error Handling Utilities
// ===========================================

/**
 * Checks if an error is related to API limits
 */
export function isRateLimitError(error: any): boolean {
  return error?.code === 'RATE_LIMIT_EXCEEDED' || error?.rateLimited === true;
}

/**
 * Checks if an error is related to API authentication
 */
export function isAuthError(error: any): boolean {
  return error?.code === 'INVALID_API_KEY' || error?.status === 401;
}

/**
 * Checks if an error is a network/connectivity issue
 */
export function isNetworkError(error: any): boolean {
  return error?.code === 'NETWORK_ERROR' || 
         error?.code === 'TIMEOUT' || 
         error?.code === 'CORS_ERROR';
}

/**
 * Gets a user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isRateLimitError(error)) {
    return 'API rate limit exceeded. Please try again later.';
  }
  
  if (isAuthError(error)) {
    return 'API authentication failed. Please check your API keys.';
  }
  
  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection.';
  }
  
  return error?.message || 'An unexpected error occurred.';
}

// ===========================================
// Default Export
// ===========================================

export default {
  createApiService,
  getApiService,
  reinitializeApiService,
  getQuote,
  getHistoricalData,
  searchSymbols,
  getBatchQuotes,
  getProviderStatus,
  getProviderMetrics,
  switchProvider,
  clearCache,
  getDebugInfo,
  validateConfiguration,
  isRateLimitError,
  isAuthError,
  isNetworkError,
  getErrorMessage
};