// ===========================================
// src/services/analytics/types.ts
// Analytics Types & Interfaces
// ===========================================

export interface AnalyticsConfig {
  enabled?: boolean;
  collectPersonalInfo?: boolean;
  collectPerformanceMetrics?: boolean;
  collectErrorReports?: boolean;
  debugMode?: boolean;
  endpoints?: {
    events?: string;
    errors?: string;
    performance?: string;
  };
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model?: string;
  manufacturer?: string;
  isTablet?: boolean;
  isEmulator?: boolean;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  lastActivity: Date;
  duration: number;
  isActive: boolean;
}

export type EventType = 
  | 'app'
  | 'user'
  | 'screen'
  | 'error'
  | 'performance'
  | 'api'
  | 'portfolio'
  | 'analysis';

export type EventCategory = 
  | 'lifecycle'
  | 'authentication'
  | 'navigation'
  | 'error'
  | 'performance'
  | 'api'
  | 'portfolio'
  | 'asset'
  | 'analysis'
  | 'optimization'
  | 'search'
  | 'notification'
  | 'alert'
  | 'network';

export type PerformanceMetric = 
  | 'app_start_time'
  | 'screen_load_time'
  | 'page_load_time'
  | 'api_response_time'
  | 'analysis_duration'
  | 'optimization_duration'
  | 'render_time'
  | 'memory_usage'
  | 'cpu_usage'
  | 'battery_drain'
  | 'network_latency';

export type ErrorSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export type UserAction = 
  | 'view'
  | 'click'
  | 'input'
  | 'submit'
  | 'scroll'
  | 'search'
  | 'filter'
  | 'sort'
  | 'export'
  | 'import';

export interface AnalyticsEvent {
  type: EventType;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface PerformanceEvent extends AnalyticsEvent {
  metric: PerformanceMetric;
  value: number;
  unit: string;
}

export interface ErrorEvent extends AnalyticsEvent {
  error: Error | string;
  severity: ErrorSeverity;
  stack?: string;
}

export interface UserEvent extends AnalyticsEvent {
  userId?: string;
  action: UserAction;
  context?: Record<string, any>;
} 