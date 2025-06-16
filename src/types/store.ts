// ===========================================
// src/types/store.ts
// Redux Store and State Management Types
// ===========================================

import { 
  Portfolio, 
  Asset, 
  MarketData, 
  HistoricalDataPoint,
  UserProfile, 
  UserPreferences, 
  AppSettings,
  RiskMetrics,
  VaRResult,
  CAPMResult,
  OptimizationResult,
  ApiError,
  ApiProvider,
  RateLimitInfo,
  ToastMessage,
  ModalInfo
} from './index';
import { ApiMetrics, ApiProviderStatus } from './api';

// ========================================
// Root State Interface
// ========================================

export interface RootState {
  portfolio: PortfolioState;
  market: MarketState;
  analysis: AnalysisState;
  optimization: OptimizationState;
  user: UserState;
  api: ApiState;
  ui: UIState;
  settings: SettingsState;
  notifications: NotificationState;
}

// ========================================
// Portfolio State
// ========================================

export interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolioId?: string;
  selectedAssets: string[];
  watchlist: string[];
  recentlyViewed: string[];
  loading: LoadingState;
  error?: ErrorState;
  lastUpdated?: Date;
  operations: PortfolioOperations;
}

export interface PortfolioOperations {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  importing: boolean;
  exporting: boolean;
  rebalancing: boolean;
}

export interface LoadingState {
  fetching: boolean;
  saving: boolean;
  deleting: boolean;
  analyzing: boolean;
}

export interface ErrorState {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  dismissible: boolean;
}

// ========================================
// Market Data State
// ========================================

export interface MarketState {
  quotes: { [symbol: string]: MarketData };
  historical: { [symbol: string]: HistoricalDataPoint[] };
  search: MarketSearchState;
  subscriptions: MarketSubscription[];
  loading: MarketLoadingState;
  errors: { [symbol: string]: ErrorState };
  lastUpdated: { [symbol: string]: Date };
  cache: MarketCacheState;
}

export interface MarketSearchState {
  query: string;
  results: AssetSearchResult[];
  loading: boolean;
  error?: ErrorState;
  filters: SearchFilters;
}

export interface SearchFilters {
  assetType?: string;
  exchange?: string;
  sector?: string;
  marketCap?: MarketCapFilter;
  currency?: string;
}

export interface MarketCapFilter {
  min?: number;
  max?: number;
}

export interface MarketSubscription {
  symbol: string;
  fields: string[];
  frequency: number;
  active: boolean;
  lastUpdate: Date;
}

export interface MarketLoadingState {
  quotes: { [symbol: string]: boolean };
  historical: { [symbol: string]: boolean };
  search: boolean;
  bulk: boolean;
}

export interface MarketCacheState {
  size: number;
  hitRate: number;
  lastCleanup: Date;
  entries: { [key: string]: CacheEntryInfo };
}

export interface CacheEntryInfo {
  key: string;
  size: number;
  timestamp: Date;
  hits: number;
  ttl: number;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
  sector?: string;
  marketCap?: number;
}

// ========================================
// Analysis State
// ========================================

export interface AnalysisState {
  risk: RiskAnalysisState;
  var: VaRAnalysisState;
  capm: CAPMAnalysisState;
  correlations: CorrelationState;
  loading: AnalysisLoadingState;
  errors: AnalysisErrorState;
  history: AnalysisHistory;
}

export interface RiskAnalysisState {
  current?: RiskMetrics;
  historical: { [date: string]: RiskMetrics };
  comparison?: RiskComparison;
  alerts: RiskAlert[];
}

export interface RiskComparison {
  benchmark: string;
  portfolioMetrics: RiskMetrics;
  benchmarkMetrics: RiskMetrics;
  relativeMetrics: RelativeRiskMetrics;
}

export interface RelativeRiskMetrics {
  trackingError: number;
  informationRatio: number;
  activeReturn: number;
  activeRisk: number;
  betaAdjustedReturn: number;
}

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: AlertSeverity;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface VaRAnalysisState {
  current?: VaRResult;
  historical: { [date: string]: VaRResult };
  backtests: VaRBacktest[];
  scenarios: StressTestScenario[];
}

export interface VaRBacktest {
  id: string;
  period: { start: Date; end: Date };
  method: VaRMethod;
  confidenceLevel: number;
  violations: number;
  expectedViolations: number;
  kupiecTest: TestResult;
  christoffersenTest?: TestResult;
}

export interface TestResult {
  statistic: number;
  pValue: number;
  criticalValue: number;
  rejected: boolean;
}

export interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  shocks: MarketShock[];
  results?: StressTestResult;
}

export interface MarketShock {
  asset: string;
  type: ShockType;
  magnitude: number;
  duration?: number;
}

export interface StressTestResult {
  portfolioLoss: number;
  worstAsset: string;
  recoveryTime?: number;
  correlation: number;
}

export interface CAPMAnalysisState {
  current?: CAPMResult;
  historical: { [asset: string]: CAPMResult[] };
  benchmark: string;
  riskFreeRate: number;
}

export interface CorrelationState {
  matrix: { [key: string]: { [key: string]: number } };
  rolling: RollingCorrelation[];
  alerts: CorrelationAlert[];
}

export interface RollingCorrelation {
  date: Date;
  correlations: { [pair: string]: number };
}

export interface CorrelationAlert {
  id: string;
  assetPair: [string, string];
  correlation: number;
  threshold: number;
  type: 'high' | 'low' | 'sudden_change';
  timestamp: Date;
}

export interface AnalysisLoadingState {
  risk: boolean;
  var: boolean;
  capm: boolean;
  correlation: boolean;
  backtest: boolean;
  stressTest: boolean;
}

export interface AnalysisErrorState {
  risk?: ErrorState;
  var?: ErrorState;
  capm?: ErrorState;
  correlation?: ErrorState;
  backtest?: ErrorState;
  stressTest?: ErrorState;
}

export interface AnalysisHistory {
  entries: AnalysisHistoryEntry[];
  maxEntries: number;
  autoSave: boolean;
}

export interface AnalysisHistoryEntry {
  id: string;
  type: AnalysisType;
  portfolioId: string;
  timestamp: Date;
  parameters: any;
  results: any;
  notes?: string;
}

// ========================================
// Optimization State
// ========================================

export interface OptimizationState {
  current?: OptimizationResult;
  history: OptimizationHistory[];
  constraints: OptimizationConstraints;
  objectives: OptimizationObjective[];
  scenarios: OptimizationScenario[];
  loading: OptimizationLoadingState;
  error?: ErrorState;
}

export interface OptimizationHistory {
  id: string;
  timestamp: Date;
  type: string;
  parameters: OptimizationParameters;
  result: OptimizationResult;
  portfolioSnapshot: Portfolio;
}

export interface OptimizationConstraints {
  minWeight: number;
  maxWeight: number;
  maxAssets?: number;
  sectorLimits: { [sector: string]: number };
  allowShortSelling: boolean;
  turnoverLimit?: number;
  liquidityConstraints?: LiquidityConstraint[];
}

export interface LiquidityConstraint {
  asset: string;
  minVolume: number;
  avgDailyVolume: number;
  constraint: number;
}

export interface OptimizationObjective {
  type: ObjectiveType;
  weight: number;
  target?: number;
  enabled: boolean;
}

export interface OptimizationScenario {
  id: string;
  name: string;
  description: string;
  constraints: OptimizationConstraints;
  objectives: OptimizationObjective[];
  result?: OptimizationResult;
}

export interface OptimizationParameters {
  method: string;
  constraints: OptimizationConstraints;
  objectives: OptimizationObjective[];
  lookbackPeriod: number;
  rebalanceFrequency: string;
  transactionCosts: number;
}

export interface OptimizationLoadingState {
  running: boolean;
  calculating: boolean;
  backtesting: boolean;
  progress: number;
}

// ========================================
// User State
// ========================================

export interface UserState {
  profile?: UserProfile;
  preferences: UserPreferences;
  authentication: AuthenticationState;
  permissions: UserPermissions;
  activity: UserActivity;
  loading: UserLoadingState;
  error?: ErrorState;
}

export interface AuthenticationState {
  isAuthenticated: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  locked: boolean;
  lockExpiry?: Date;
}

export interface UserPermissions {
  portfolios: PermissionLevel;
  analytics: PermissionLevel;
  settings: PermissionLevel;
  data: PermissionLevel;
  export: PermissionLevel;
  api: PermissionLevel;
}

export interface UserActivity {
  sessions: UserSession[];
  actions: UserAction[];
  preferences: ActivityPreferences;
}

export interface UserSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  device: DeviceInfo;
  ipAddress: string;
  active: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  version: string;
}

export interface UserAction {
  id: string;
  type: ActionType;
  timestamp: Date;
  details: any;
  sessionId: string;
}

export interface ActivityPreferences {
  trackAnalytics: boolean;
  trackPerformance: boolean;
  retentionDays: number;
}

export interface UserLoadingState {
  profile: boolean;
  preferences: boolean;
  authentication: boolean;
  permissions: boolean;
}

// ========================================
// API State
// ========================================

export interface ApiState {
  providers: { [provider in ApiProvider]: ApiProviderState };
  rateLimit: { [provider in ApiProvider]: RateLimitInfo };
  metrics: { [provider in ApiProvider]: ApiMetrics };
  errors: ApiErrorLog[];
  configuration: ApiConfiguration;
  monitoring: ApiMonitoring;
}

export interface ApiProviderState {
  status: ApiProviderStatus;
  available: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  successRate: number;
  priority: number;
  enabled: boolean;
}

export interface ApiErrorLog {
  id: string;
  provider: ApiProvider;
  error: ApiError;
  endpoint: string;
  retryCount: number;
  resolved: boolean;
  timestamp: Date;
}

export interface ApiConfiguration {
  primaryProvider: ApiProvider;
  fallbackProviders: ApiProvider[];
  timeout: number;
  retryAttempts: number;
  rateLimitBuffer: number;
  healthCheckInterval: number;
}

export interface ApiMonitoring {
  healthChecks: HealthCheck[];
  alerts: ApiAlert[];
  uptime: UptimeMetrics;
  performance: PerformanceMetrics;
}

export interface HealthCheck {
  provider: ApiProvider;
  timestamp: Date;
  status: ApiProviderStatus;
  responseTime: number;
  errorMessage?: string;
}

export interface ApiAlert {
  id: string;
  provider: ApiProvider;
  type: ApiAlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  autoResolve: boolean;
}

export interface UptimeMetrics {
  provider: ApiProvider;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  lastOutage?: Date;
  outageCount: number;
}

export interface PerformanceMetrics {
  provider: ApiProvider;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
}

// ========================================
// UI State
// ========================================

export interface UIState {
  navigation: NavigationState;
  modals: ModalState;
  toasts: ToastState;
  loading: UILoadingState;
  offline: OfflineState;
  theme: ThemeState;
  layout: LayoutState;
}

export interface NavigationState {
  currentTab: string;
  history: NavigationEntry[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface NavigationEntry {
  screen: string;
  params?: any;
  timestamp: Date;
}

export interface ModalState {
  stack: ModalInfo[];
  blocking: boolean;
}

export interface ToastState {
  messages: ToastMessage[];
  maxMessages: number;
  position: ToastPosition;
}

export interface UILoadingState {
  global: boolean;
  screens: { [screen: string]: boolean };
  components: { [component: string]: boolean };
}

export interface OfflineState {
  isOffline: boolean;
  lastOnline?: Date;
  queuedActions: QueuedAction[];
  syncInProgress: boolean;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

export interface ThemeState {
  current: string;
  available: string[];
  systemTheme: string;
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface LayoutState {
  orientation: 'portrait' | 'landscape';
  screenSize: ScreenSize;
  safeAreaInsets: SafeAreaInsets;
  keyboardVisible: boolean;
  keyboardHeight: number;
}

export interface ScreenSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ========================================
// Settings State
// ========================================

export interface SettingsState {
  app: AppSettings;
  user: UserPreferences;
  sync: SyncState;
  backup: BackupState;
  loading: SettingsLoadingState;
  error?: ErrorState;
}

export interface SyncState {
  enabled: boolean;
  lastSync?: Date;
  inProgress: boolean;
  conflicts: SyncConflict[];
  strategy: SyncStrategy;
}

export interface SyncConflict {
  id: string;
  type: string;
  localValue: any;
  remoteValue: any;
  timestamp: Date;
  resolved: boolean;
}

export interface BackupState {
  enabled: boolean;
  lastBackup?: Date;
  inProgress: boolean;
  schedule: BackupSchedule;
  retention: BackupRetention;
}

export interface BackupSchedule {
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  weekday?: number;
  dayOfMonth?: number;
}

export interface BackupRetention {
  keepDaily: number;
  keepWeekly: number;
  keepMonthly: number;
  keepYearly: number;
}

export interface SettingsLoadingState {
  app: boolean;
  user: boolean;
  sync: boolean;
  backup: boolean;
}

// ========================================
// Notification State
// ========================================

export interface NotificationState {
  push: PushNotificationState;
  email: EmailNotificationState;
  alerts: AlertState;
  preferences: NotificationPreferences;
}

export interface PushNotificationState {
  enabled: boolean;
  token?: string;
  permissions: NotificationPermissions;
  pending: PendingNotification[];
  delivered: DeliveredNotification[];
}

export interface EmailNotificationState {
  enabled: boolean;
  verified: boolean;
  pending: EmailNotification[];
  sent: EmailNotification[];
}

export interface AlertState {
  active: Alert[];
  history: Alert[];
  rules: AlertRule[];
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  expiresAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  cooldown: number;
  lastTriggered?: Date;
}

export interface AlertCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  aggregation?: AggregationFunction;
  timeWindow?: number;
}

export interface AlertAction {
  type: 'push' | 'email' | 'toast' | 'log';
  template: string;
  immediate: boolean;
  cooldown: number;
}

export interface NotificationPermissions {
  alert: boolean;
  badge: boolean;
  sound: boolean;
  criticalAlert: boolean;
  providesAppNotificationSettings: boolean;
}

export interface PendingNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledFor: Date;
  retryCount: number;
}

export interface DeliveredNotification {
  id: string;
  title: string;
  body: string;
  deliveredAt: Date;
  opened: boolean;
  openedAt?: Date;
}

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  template: string;
  data: any;
  sentAt?: Date;
  opened?: boolean;
  openedAt?: Date;
  failed?: boolean;
  error?: string;
}

export interface NotificationPreferences {
  push: PushPreferences;
  email: EmailPreferences;
  doNotDisturb: DoNotDisturbSettings;
}

export interface PushPreferences {
  enabled: boolean;
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  riskWarnings: boolean;
  marketNews: boolean;
  systemNotifications: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface EmailPreferences {
  enabled: boolean;
  frequency: EmailFrequency;
  digest: boolean;
  marketing: boolean;
  reports: boolean;
  alerts: boolean;
}

export interface DoNotDisturbSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
  weekends: boolean;
  allowCritical: boolean;
}

// ========================================
// Type Enums & Unions
// ========================================

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export type ActionType = 
  | 'portfolio_create' 
  | 'portfolio_update' 
  | 'portfolio_delete' 
  | 'analysis_run' 
  | 'optimization_run' 
  | 'settings_update' 
  | 'login' 
  | 'logout';

export type VaRMethod = 'parametric' | 'historical' | 'monteCarlo';

export type ShockType = 'absolute' | 'relative' | 'volatility';

export type RiskAlertType = 
  | 'var_breach' 
  | 'drawdown_limit' 
  | 'volatility_spike' 
  | 'correlation_break' 
  | 'concentration_risk';

export type AnalysisType = 
  | 'risk' 
  | 'var' 
  | 'capm' 
  | 'correlation' 
  | 'optimization' 
  | 'backtest';

export type ObjectiveType = 
  | 'maximize_return' 
  | 'minimize_risk' 
  | 'maximize_sharpe' 
  | 'target_return' 
  | 'risk_parity';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ApiAlertType = 
  | 'rate_limit' 
  | 'outage' 
  | 'slow_response' 
  | 'high_error_rate' 
  | 'quota_exceeded';

export type ToastPosition = 'top' | 'bottom' | 'center';

export type SyncStrategy = 
  | 'last_write_wins' 
  | 'manual_resolve' 
  | 'merge' 
  | 'prefer_local' 
  | 'prefer_remote';

export type AlertType = 
  | 'price' 
  | 'portfolio' 
  | 'risk' 
  | 'market' 
  | 'system' 
  | 'security';

export type ComparisonOperator = 
  | 'eq' 
  | 'ne' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'in' 
  | 'contains';

export type AggregationFunction = 
  | 'avg' 
  | 'sum' 
  | 'min' 
  | 'max' 
  | 'count' 
  | 'change' 
  | 'percent_change';

export type EmailFrequency = 
  | 'instant' 
  | 'hourly' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'never';

// ========================================
// Redux Action Types
// ========================================

export interface BaseAction {
  type: string;
  payload?: any;
  meta?: ActionMeta;
  error?: boolean;
}

export interface ActionMeta {
  timestamp?: Date;
  source?: string;
  requestId?: string;
  optimistic?: boolean;
}

export interface PayloadAction<T = any> extends BaseAction {
  payload: T;
}

export interface AsyncAction<T = any> {
  pending: () => BaseAction;
  fulfilled: (payload: T) => PayloadAction<T>;
  rejected: (error: SerializedError) => PayloadAction<SerializedError>;
}

export interface SerializedError {
  name?: string;
  message?: string;
  code?: string;
  stack?: string;
}

// ========================================
// Middleware Types
// ========================================

export interface AsyncThunkConfig {
  state: RootState;
  dispatch: any;
  extra?: any;
  rejectValue: SerializedError;
  serializedErrorType?: any;
  pendingMeta?: any;
  fulfilledMeta?: any;
  rejectedMeta?: any;
}

export interface MiddlewareAPI {
  dispatch: any;
  getState: () => RootState;
}

// ========================================
// Selectors Types
// ========================================

export type StateSelector<T> = (state: RootState) => T;

export type ParametricSelector<P, R> = (state: RootState, params: P) => R;

export type MemoizedSelector<Args extends readonly any[], Return> = 
  ((state: RootState, ...args: Args) => Return) & {
    clearCache: () => void;
  };