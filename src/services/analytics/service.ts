// ===========================================
// src/services/analytics/service.ts
// Analytics Service Implementation
// ===========================================

import type {
  AnalyticsConfig,
  AnalyticsEvent,
  PerformanceEvent,
  ErrorEvent,
  UserEvent,
  EventCategory,
  PerformanceMetric,
  ErrorSeverity
} from './types';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private userId?: string;
  private userProperties: Record<string, any> = {};
  private isOnline: boolean = true;
  private queue: AnalyticsEvent[] = [];
  private isProcessing: boolean = false;

  private constructor(config?: Partial<AnalyticsConfig>) {
    this.config = {
      enabled: true,
      collectPersonalInfo: false,
      collectPerformanceMetrics: true,
      collectErrorReports: true,
      debugMode: false,
      ...config
    };
  }

  public static getInstance(config?: Partial<AnalyticsConfig>): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(config);
    }
    return AnalyticsService.instance;
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public setUserProperties(properties: Record<string, any>): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    if (isOnline) {
      this.processQueue();
    }
  }

  public track(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    this.trackEvent(category, action, label, value, properties);
  }

  public trackEvent(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      type: this.getEventType(category),
      category,
      action,
      label,
      value,
      properties: {
        ...properties,
        userId: this.userId,
        ...this.userProperties
      },
      timestamp: new Date()
    };

    this.queueEvent(event);
  }

  public trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.trackEvent('navigation', 'screen_view', screenName, undefined, properties);
  }

  public trackError(
    error: Error | string,
    severity: ErrorSeverity = 'error',
    context?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.collectErrorReports) return;

    const event: ErrorEvent = {
      type: 'error',
      category: 'error',
      action: 'error_occurred',
      error,
      severity,
      properties: {
        ...context,
        userId: this.userId,
        ...this.userProperties,
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date()
    };

    this.queueEvent(event);
  }

  public trackPerformance(
    metric: PerformanceMetric,
    value: number,
    unit: string,
    context?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.collectPerformanceMetrics) return;

    const event: PerformanceEvent = {
      type: 'performance',
      category: 'performance',
      action: 'metric_recorded',
      metric,
      value,
      unit,
      properties: {
        ...context,
        userId: this.userId,
        ...this.userProperties
      },
      timestamp: new Date()
    };

    this.queueEvent(event);
  }

  private getEventType(category: EventCategory): AnalyticsEvent['type'] {
    switch (category) {
      case 'lifecycle':
      case 'authentication':
      case 'network':
        return 'app';
      case 'navigation':
        return 'screen';
      case 'error':
        return 'error';
      case 'performance':
        return 'performance';
      case 'api':
        return 'api';
      case 'portfolio':
      case 'asset':
        return 'portfolio';
      case 'analysis':
      case 'optimization':
        return 'analysis';
      case 'search':
      case 'alert':
        return 'user';
      case 'notification':
        return 'app';
      default:
        return 'user';
    }
  }

  private queueEvent(event: AnalyticsEvent): void {
    this.queue.push(event);
    if (this.isOnline) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) return;

    this.isProcessing = true;
    try {
      while (this.queue.length > 0 && this.isOnline) {
        const event = this.queue.shift();
        if (event) {
          await this.sendEvent(event);
        }
      }
    } catch (error) {
      console.error('Failed to process analytics queue:', error);
      // Put failed events back in queue
      this.queue = [...this.queue];
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // In a real implementation, this would send the event to your analytics backend
      if (this.config.debugMode) {
        console.log('Analytics Event:', event);
      }

      // Example implementation - replace with your actual analytics provider
      const endpoint = this.getEndpointForEvent(event);
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
      // Put failed event back in queue
      this.queue.unshift(event);
    }
  }

  private getEndpointForEvent(event: AnalyticsEvent): string | undefined {
    if (!this.config.endpoints) return undefined;

    switch (event.type) {
      case 'error':
        return this.config.endpoints.errors;
      case 'performance':
        return this.config.endpoints.performance;
      default:
        return this.config.endpoints.events;
    }
  }

  public dispose(): void {
    this.queue = [];
    this.isProcessing = false;
  }
} 