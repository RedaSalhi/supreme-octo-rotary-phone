// ===========================================
// src/services/analytics/index.ts
// Analytics Services Main Export & Factory
// ===========================================

// Main service export
export { AnalyticsService, createAnalyticsService } from './index';

// Types
export type {
  AnalyticsEvent,
  PerformanceEvent,
  ErrorEvent,
  UserEvent,
  AnalyticsConfig,
  DeviceInfo,
  SessionInfo,
  EventType,
  EventCategory,
  PerformanceMetric,
  ErrorSeverity,
  UserAction
} from './index';

// Re-export the main analytics service for convenience
import { AnalyticsService } from './index';

// ===========================================
// Analytics Event Categories
// ===========================================

export const ANALYTICS_EVENTS = {
  // App Lifecycle
  APP_LAUNCH: 'app_launch',
  APP_BACKGROUND: 'app_background',
  APP_FOREGROUND: 'app_foreground',
  APP_CRASH: 'app_crash',

  // User Authentication
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',

  // Navigation
  SCREEN_VIEW: 'screen_view',
  TAB_CHANGE: 'tab_change',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',

  // Portfolio Management
  PORTFOLIO_CREATE: 'portfolio_create',
  PORTFOLIO_UPDATE: 'portfolio_update',
  PORTFOLIO_DELETE: 'portfolio_delete',
  PORTFOLIO_SHARE: 'portfolio_share',
  PORTFOLIO_EXPORT: 'portfolio_export',
  PORTFOLIO_IMPORT: 'portfolio_import',

  // Asset Management
  ASSET_ADD: 'asset_add',
  ASSET_REMOVE: 'asset_remove',
  ASSET_SEARCH: 'asset_search',
  ASSET_DETAILS_VIEW: 'asset_details_view',

  // Analysis & Optimization
  RISK_ANALYSIS_START: 'risk_analysis_start',
  RISK_ANALYSIS_COMPLETE: 'risk_analysis_complete',
  VAR_CALCULATION: 'var_calculation',
  OPTIMIZATION_START: 'optimization_start',
  OPTIMIZATION_COMPLETE: 'optimization_complete',
  BACKTEST_RUN: 'backtest_run',

  // API Usage
  API_REQUEST: 'api_request',
  API_ERROR: 'api_error',
  API_RATE_LIMIT: 'api_rate_limit',

  // Settings & Preferences
  SETTINGS_UPDATE: 'settings_update',
  THEME_CHANGE: 'theme_change',
  LANGUAGE_CHANGE: 'language_change',

  // Errors & Issues
  ERROR_BOUNDARY: 'error_boundary',
  NETWORK_ERROR: 'network_error',
  STORAGE_ERROR: 'storage_error',

  // Performance
  RENDER_TIME: 'render_time',
  LOAD_TIME: 'load_time',
  MEMORY_USAGE: 'memory_usage'
} as const;

export const PERFORMANCE_METRICS = {
  APP_START_TIME: 'app_start_time',
  SCREEN_LOAD_TIME: 'screen_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  ANALYSIS_DURATION: 'analysis_duration',
  OPTIMIZATION_DURATION: 'optimization_duration',
  RENDER_TIME: 'render_time',
  MEMORY_USAGE: 'memory_usage',
  CPU_USAGE: 'cpu_usage',
  BATTERY_DRAIN: 'battery_drain',
  NETWORK_LATENCY: 'network_latency'
} as const;

// ===========================================
// Performance Monitoring Service
// ===========================================

export class PerformanceMonitor {
  private analytics: AnalyticsService;
  private performanceObserver?: PerformanceObserver;
  private timers: Map<string, number> = new Map();

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'measure':
        this.analytics.trackPerformance(
          entry.name as any,
          entry.duration,
          'milliseconds',
          { type: 'measure' }
        );
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.analytics.trackPerformance(
          'page_load_time',
          navEntry.loadEventEnd - navEntry.navigationStart,
          'milliseconds',
          { type: 'navigation' }
        );
        break;

      case 'resource':
        if (entry.name.includes('api') || entry.name.includes('finance')) {
          this.analytics.trackPerformance(
            'api_response_time',
            entry.duration,
            'milliseconds',
            { 
              type: 'resource',
              url: entry.name,
              size: (entry as PerformanceResourceTiming).transferSize
            }
          );
        }
        break;
    }
  }

  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.analytics.trackPerformance(
      name as any,
      duration,
      'milliseconds',
      context
    );

    return duration;
  }

  measureAsync<T>(name: string, operation: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    const startTime = performance.now();
    
    return operation().finally(() => {
      const duration = performance.now() - startTime;
      this.analytics.trackPerformance(
        name as any,
        duration,
        'milliseconds',
        context
      );
    });
  }

  measureSync<T>(name: string, operation: () => T, context?: Record<string, any>): T {
    const startTime = performance.now();
    
    try {
      return operation();
    } finally {
      const duration = performance.now() - startTime;
      this.analytics.trackPerformance(
        name as any,
        duration,
        'milliseconds',
        context
      );
    }
  }

  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.analytics.trackPerformance(
        'memory_usage',
        memory.usedJSHeapSize,
        'bytes',
        {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
      );
    }
  }

  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.timers.clear();
  }
}

// ===========================================
// Error Tracking Service
// ===========================================

export class ErrorTracker {
  private analytics: AnalyticsService;
  private originalConsoleError: typeof console.error;
  private originalWindowErrorHandler?: OnErrorEventHandler;
  private originalUnhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.originalConsoleError = console.error;
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    // Capture console errors
    console.error = (...args: any[]) => {
      this.originalConsoleError(...args);
      this.trackConsoleError(args);
    };

    // Capture unhandled JavaScript errors
    if (typeof window !== 'undefined') {
      this.originalWindowErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        this.trackJavaScriptError(message, source, lineno, colno, error);
        return this.originalWindowErrorHandler?.(message, source, lineno, colno, error) || false;
      };

      // Capture unhandled promise rejections
      this.originalUnhandledRejectionHandler = window.onunhandledrejection;
      window.onunhandledrejection = (event) => {
        this.trackPromiseRejection(event);
        this.originalUnhandledRejectionHandler?.(event);
      };
    }
  }

  private trackConsoleError(args: any[]): void {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    this.analytics.trackError(message, 'warning', {
      source: 'console',
      arguments: args.length
    });
  }

  private trackJavaScriptError(
    message: string | Event, 
    source?: string, 
    lineno?: number, 
    colno?: number, 
    error?: Error
  ): void {
    this.analytics.trackError(
      error || String(message),
      'error',
      {
        source: 'javascript',
        file: source,
        line: lineno,
        column: colno
      }
    );
  }

  private trackPromiseRejection(event: PromiseRejectionEvent): void {
    this.analytics.trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'error',
      {
        source: 'promise_rejection',
        type: 'unhandled'
      }
    );
  }

  trackApiError(endpoint: string, error: any, context?: Record<string, any>): void {
    this.analytics.trackError(error, 'warning', {
      source: 'api',
      endpoint,
      ...context
    });
  }

  trackValidationError(field: string, error: string, context?: Record<string, any>): void {
    this.analytics.trackError(new Error(error), 'info', {
      source: 'validation',
      field,
      ...context
    });
  }

  trackNetworkError(error: any, context?: Record<string, any>): void {
    this.analytics.trackError(error, 'warning', {
      source: 'network',
      ...context
    });
  }

  dispose(): void {
    // Restore original handlers
    console.error = this.originalConsoleError;
    
    if (typeof window !== 'undefined') {
      window.onerror = this.originalWindowErrorHandler || null;
      window.onunhandledrejection = this.originalUnhandledRejectionHandler || null;
    }
  }
}

// ===========================================
// Financial Analytics Service
// ===========================================

export class FinancialAnalytics {
  private analytics: AnalyticsService;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
  }

  trackPortfolioCreation(portfolioData: any): void {
    this.analytics.trackEvent('portfolio', 'create', 'portfolio_created', undefined, {
      asset_count: portfolioData.assets?.length || 0,
      total_value: this.roundValue(portfolioData.totalValue),
      risk_profile: portfolioData.riskProfile,
      diversification_score: this.calculateDiversificationScore(portfolioData)
    });
  }

  trackPortfolioOptimization(optimizationType: string, beforeAfterMetrics: any, duration: number): void {
    this.analytics.trackEvent('optimization', 'complete', optimizationType, duration, {
      optimization_type: optimizationType,
      duration_ms: duration,
      before_sharpe: this.roundValue(beforeAfterMetrics.before?.sharpeRatio),
      after_sharpe: this.roundValue(beforeAfterMetrics.after?.sharpeRatio),
      improvement: this.roundValue(beforeAfterMetrics.improvement),
      asset_count: beforeAfterMetrics.assetCount
    });

    this.analytics.trackPerformance('optimization_duration', duration, 'milliseconds', {
      optimization_type: optimizationType,
      asset_count: beforeAfterMetrics.assetCount
    });
  }

  trackRiskAnalysis(analysisType: string, results: any, duration: number): void {
    this.analytics.trackEvent('analysis', 'complete', analysisType, duration, {
      analysis_type: analysisType,
      duration_ms: duration,
      var_95: this.roundValue(results.var95),
      var_99: this.roundValue(results.var99),
      sharpe_ratio: this.roundValue(results.sharpeRatio),
      max_drawdown: this.roundValue(results.maxDrawdown)
    });
  }

  trackBacktest(strategy: string, results: any, duration: number): void {
    this.analytics.trackEvent('analysis', 'backtest', strategy, duration, {
      strategy,
      duration_ms: duration,
      total_return: this.roundValue(results.totalReturn),
      annual_return: this.roundValue(results.annualReturn),
      max_drawdown: this.roundValue(results.maxDrawdown),
      sharpe_ratio: this.roundValue(results.sharpeRatio),
      win_rate: this.roundValue(results.winRate),
      trades_count: results.tradesCount
    });
  }

  trackAssetSearch(query: string, resultCount: number, responseTime: number): void {
    this.analytics.trackEvent('search', 'asset_search', query, responseTime, {
      query_length: query.length,
      result_count: resultCount,
      response_time_ms: responseTime
    });
  }

  trackMarketDataUsage(provider: string, endpoint: string, responseTime: number, cacheHit: boolean): void {
    this.analytics.trackEvent('api', 'market_data', provider, responseTime, {
      provider,
      endpoint,
      response_time_ms: responseTime,
      cache_hit: cacheHit
    });

    if (!cacheHit) {
      this.analytics.trackPerformance('api_response_time', responseTime, 'milliseconds', {
        provider,
        endpoint
      });
    }
  }

  private calculateDiversificationScore(portfolioData: any): number {
    if (!portfolioData.assets || portfolioData.assets.length === 0) return 0;
    
    // Simple diversification score based on number of assets and weight distribution
    const assetCount = portfolioData.assets.length;
    const weights = portfolioData.weights || portfolioData.assets.map(() => 1 / assetCount);
    
    // Calculate Herfindahl-Hirschman Index (lower is more diversified)
    const hhi = weights.reduce((sum: number, weight: number) => sum + weight * weight, 0);
    
    // Convert to 0-100 scale (100 = most diversified)
    return Math.round((1 - hhi) * 100);
  }

  private roundValue(value: any): number | undefined {
    if (typeof value !== 'number' || isNaN(value)) return undefined;
    return Math.round(value * 10000) / 10000; // 4 decimal places
  }
}

// ===========================================
// Analytics Manager
// ===========================================

export class AnalyticsManager {
  public readonly analytics: AnalyticsService;
  public readonly performance: PerformanceMonitor;
  public readonly errorTracker: ErrorTracker;
  public readonly financial: FinancialAnalytics;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.analytics = AnalyticsService.getInstance(config);
    this.performance = new PerformanceMonitor(this.analytics);
    this.errorTracker = new ErrorTracker(this.analytics);
    this.financial = new FinancialAnalytics(this.analytics);
  }

  // Convenience methods that delegate to appropriate services
  track(category: string, action: string, label?: string, value?: number, properties?: Record<string, any>): void {
    this.analytics.trackEvent(category as any, action, label, value, properties);
  }

  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.analytics.trackScreenView(screenName, properties);
  }

  trackError(error: Error | string, severity?: ErrorSeverity, context?: Record<string, any>): void {
    this.analytics.trackError(error, severity, context);
  }

  startPerformanceTimer(name: string): void {
    this.performance.startTimer(name);
  }

  endPerformanceTimer(name: string, context?: Record<string, any>): number {
    return this.performance.endTimer(name, context);
  }

  async measureAsync<T>(name: string, operation: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    return this.performance.measureAsync(name, operation, context);
  }

  measureSync<T>(name: string, operation: () => T, context?: Record<string, any>): T {
    return this.performance.measureSync(name, operation, context);
  }

  setUserId(userId: string): void {
    this.analytics.setUserId(userId);
  }

  setUserProperties(properties: Record<string, any>): void {
    this.analytics.setUserProperties(properties);
  }

  setOnlineStatus(isOnline: boolean): void {
    this.analytics.setOnlineStatus(isOnline);
  }

  dispose(): void {
    this.performance.dispose();
    this.errorTracker.dispose();
    this.analytics.dispose();
  }
}

// ===========================================
// Singleton Instance
// ===========================================

let analyticsManagerInstance: AnalyticsManager | null = null;

/**
 * Gets the singleton instance of the analytics manager
 */
export function getAnalyticsManager(): AnalyticsManager {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager();
  }
  return analyticsManagerInstance;
}

/**
 * Reinitializes the analytics manager with new configuration
 */
export function reinitializeAnalyticsManager(config: Partial<AnalyticsConfig>): AnalyticsManager {
  if (analyticsManagerInstance) {
    analyticsManagerInstance.dispose();
  }
  analyticsManagerInstance = new AnalyticsManager(config);
  return analyticsManagerInstance;
}

// ===========================================
// Convenience Functions
// ===========================================

export function track(category: string, action: string, label?: string, value?: number, properties?: Record<string, any>): void {
  getAnalyticsManager().track(category, action, label, value, properties);
}

export function trackScreen(screenName: string, properties?: Record<string, any>): void {
  getAnalyticsManager().trackScreen(screenName, properties);
}

export function trackError(error: Error | string, severity?: ErrorSeverity, context?: Record<string, any>): void {
  getAnalyticsManager().trackError(error, severity, context);
}

export function startTimer(name: string): void {
  getAnalyticsManager().startPerformanceTimer(name);
}

export function endTimer(name: string, context?: Record<string, any>): number {
  return getAnalyticsManager().endPerformanceTimer(name, context);
}

export function setUserId(userId: string): void {
  getAnalyticsManager().setUserId(userId);
}

export function setUserProperties(properties: Record<string, any>): void {
  getAnalyticsManager().setUserProperties(properties);
}

// ===========================================
// Default Export
// ===========================================

export default {
  AnalyticsManager,
  getAnalyticsManager,
  reinitializeAnalyticsManager,
  track,
  trackScreen,
  trackError,
  startTimer,
  endTimer,
  setUserId,
  setUserProperties,
  ANALYTICS_EVENTS,
  PERFORMANCE_METRICS
};