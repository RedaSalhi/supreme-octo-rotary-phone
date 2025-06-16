// ===========================================
// src/types/index.ts
// ===========================================

// ========================================
// Core Financial Entities
// ========================================

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  returns: number[];
  weight?: number;
  sector?: string;
  marketCap?: number;
  currency?: string;
  exchange?: string;
  lastUpdated?: Date;
  volume?: number;
  dividendYield?: number;
  peRatio?: number;
  beta?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  assets: Asset[];
  weights: number[];
  totalValue: number;
  returns: number[];
  createdAt: Date;
  updatedAt: Date;
  riskProfile?: RiskProfile;
  benchmark?: string;
  rebalanceFrequency?: RebalanceFrequency;
  constraints?: PortfolioConstraints;
}

export interface PortfolioConstraints {
  minWeight?: number;
  maxWeight?: number;
  maxAssets?: number;
  sectorLimits?: { [sector: string]: number };
  allowShortSelling?: boolean;
  targetReturn?: number;
  maxRisk?: number;
}

// ========================================
// Risk and Analysis Results
// ========================================

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  trackingError?: number;
  informationRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  skewness?: number;
  kurtosis?: number;
}

export interface VaRResult {
  parametric: VaRMethodResult;
  historical: VaRMethodResult;
  monteCarlo?: VaRMethodResult & {
    simulations: number;
    convergence: boolean;
  };
  backtest?: VaRBacktestResult;
}

export interface VaRMethodResult {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  confidence?: number;
}

export interface VaRBacktestResult {
  violations95: number;
  violations99: number;
  kupiecTest95: KupiecTestResult;
  kupiecTest99: KupiecTestResult;
  christoffersenTest?: ChristoffersenTestResult;
}

export interface KupiecTestResult {
  statistic: number;
  pValue: number;
  rejected: boolean;
}

export interface ChristoffersenTestResult {
  statistic: number;
  pValue: number;
  rejected: boolean;
}

export interface CAPMResult {
  alpha: number;
  beta: number;
  rSquared: number;
  sharpeRatio: number;
  treynorRatio: number;
  informationRatio: number;
  marketReturn: number;
  riskFreeRate: number;
  trackingError: number;
  residualVolatility: number;
}

// ========================================
// Portfolio Optimization
// ========================================

export interface OptimizationResult {
  type: OptimizationType;
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  metrics: RiskMetrics;
  efficientFrontier?: EfficientFrontierPoint[];
  convergence: ConvergenceInfo;
}

export interface EfficientFrontierPoint {
  risk: number;
  return: number;
  weights: number[];
  sharpeRatio: number;
}

export interface ConvergenceInfo {
  iterations: number;
  converged: boolean;
  objectiveValue: number;
  gradientNorm?: number;
  constraints?: ConstraintViolation[];
}

export interface ConstraintViolation {
  type: string;
  value: number;
  limit: number;
  severity: 'warning' | 'error';
}

// ========================================
// Market Data & API
// ========================================

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  currency: string;
}

export interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
  dividends?: number;
  splits?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: Date;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  endpoint?: string;
}

// ========================================
// User Interface & App State
// ========================================

export interface AppState {
  portfolios: Portfolio[];
  currentPortfolio?: Portfolio;
  marketData: { [symbol: string]: MarketData };
  user: UserProfile;
  settings: AppSettings;
  ui: UIState;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  riskTolerance: RiskTolerance;
  investmentExperience: InvestmentExperience;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  currency: Currency;
  language: Language;
  theme: Theme;
  notifications: NotificationSettings;
  defaultRiskLevel: RiskLevel;
  chartPreferences: ChartPreferences;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  riskWarnings: boolean;
  marketNews: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ChartPreferences {
  defaultTimeframe: Timeframe;
  chartType: ChartType;
  showVolume: boolean;
  showMovingAverages: boolean;
  colorScheme: 'default' | 'colorblind' | 'dark' | 'light';
}

export interface UIState {
  loading: boolean;
  selectedTab: TabName;
  modalStack: ModalInfo[];
  toasts: ToastMessage[];
  selectedAssets: string[];
  chartTimeframe: Timeframe;
  isOffline: boolean;
}

export interface ModalInfo {
  id: string;
  type: ModalType;
  props?: any;
  dismissible?: boolean;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onPress: () => void;
}

// ========================================
// Settings & Configuration
// ========================================

export interface AppSettings {
  apiSettings: ApiSettings;
  calculationSettings: CalculationSettings;
  displaySettings: DisplaySettings;
  securitySettings: SecuritySettings;
}

export interface ApiSettings {
  primaryProvider: ApiProvider;
  fallbackProviders: ApiProvider[];
  refreshInterval: number;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  cacheDuration: number;
}

export interface CalculationSettings {
  historicalPeriod: number; // days
  confidenceLevels: number[];
  riskFreeRate: number;
  tradingDaysPerYear: number;
  optimizationMethod: OptimizationType;
  monteCarloSimulations: number;
  convergenceTolerance: number;
  maxIterations: number;
}

export interface DisplaySettings {
  currency: Currency;
  decimalPlaces: number;
  percentageFormat: PercentageFormat;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  showAdvancedMetrics: boolean;
}

export interface SecuritySettings {
  biometricAuth: boolean;
  sessionTimeout: number;
  dataEncryption: boolean;
  shareAnalytics: boolean;
  cloudSync: boolean;
}

// ========================================
// Charts & Visualization
// ========================================

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  type?: ChartType;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: ChartScales;
  plugins?: ChartPlugins;
  animation?: ChartAnimation;
}

export interface ChartScales {
  x?: ChartScale;
  y?: ChartScale;
}

export interface ChartScale {
  type: 'linear' | 'logarithmic' | 'time' | 'category';
  min?: number;
  max?: number;
  title?: string;
  format?: string;
}

export interface ChartPlugins {
  legend?: LegendOptions;
  tooltip?: TooltipOptions;
  zoom?: ZoomOptions;
}

export interface LegendOptions {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels?: LegendLabelOptions;
}

export interface LegendLabelOptions {
  color?: string;
  font?: FontOptions;
  padding?: number;
}

export interface FontOptions {
  family?: string;
  size?: number;
  weight?: string | number;
}

export interface TooltipOptions {
  enabled: boolean;
  mode: 'point' | 'nearest' | 'index';
  intersect: boolean;
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
}

export interface ZoomOptions {
  enabled: boolean;
  mode: 'x' | 'y' | 'xy';
  speed: number;
  threshold: number;
}

export interface ChartAnimation {
  duration: number;
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad';
  delay?: number;
}

// ========================================
// Forms & Input Validation
// ========================================

export interface FormField<T = any> {
  name: string;
  label: string;
  type: InputType;
  value: T;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  disabled?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  format?: string;
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  params?: any;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
}

export interface FormErrors {
  [fieldName: string]: string[];
}

export interface FormState {
  values: { [fieldName: string]: any };
  errors: FormErrors;
  touched: { [fieldName: string]: boolean };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ========================================
// Enums & Type Unions
// ========================================

export type OptimizationType = 
  | 'markowitz' 
  | 'maxSharpe' 
  | 'minVariance' 
  | 'targetReturn' 
  | 'riskParity' 
  | 'blackLitterman';

export type RiskProfile = 
  | 'conservative' 
  | 'moderate' 
  | 'aggressive' 
  | 'custom';

export type RiskTolerance = 
  | 'low' 
  | 'medium' 
  | 'high';

export type RiskLevel = 
  | 'veryLow' 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'veryHigh';

export type InvestmentExperience = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced' 
  | 'expert';

export type RebalanceFrequency = 
  | 'never' 
  | 'monthly' 
  | 'quarterly' 
  | 'semiannual' 
  | 'annual';

export type Currency = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'JPY' 
  | 'CAD' 
  | 'AUD' 
  | 'CHF';

export type Language = 
  | 'en' 
  | 'fr' 
  | 'es' 
  | 'de' 
  | 'it' 
  | 'pt' 
  | 'zh' 
  | 'ja';

export type Theme = 
  | 'light' 
  | 'dark' 
  | 'auto';

export type Timeframe = 
  | '1D' 
  | '1W' 
  | '1M' 
  | '3M' 
  | '6M' 
  | '1Y' 
  | '2Y' 
  | '5Y' 
  | 'ALL';

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'scatter' 
  | 'candlestick' 
  | 'area';

export type TabName = 
  | 'portfolio' 
  | 'analysis' 
  | 'markets' 
  | 'optimization' 
  | 'settings';

export type ModalType = 
  | 'addAsset' 
  | 'editPortfolio' 
  | 'riskAnalysis' 
  | 'optimization' 
  | 'settings' 
  | 'confirmation' 
  | 'error';

export type ToastType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info';

export type ApiProvider = 
  | 'alphavantage' 
  | 'finnhub' 
  | 'polygon' 
  | 'yahoo' 
  | 'twelvedata' 
  | 'iex';

export type PercentageFormat = 
  | 'decimal' 
  | 'percentage';

export type DateFormat = 
  | 'DD/MM/YYYY' 
  | 'MM/DD/YYYY' 
  | 'YYYY-MM-DD' 
  | 'DD-MM-YYYY';

export type NumberFormat = 
  | 'standard' 
  | 'scientific' 
  | 'compact';

export type InputType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'multiselect' 
  | 'slider' 
  | 'switch' 
  | 'date' 
  | 'datetime' 
  | 'textarea';

export type ValidationType = 
  | 'required' 
  | 'min' 
  | 'max' 
  | 'pattern' 
  | 'email' 
  | 'custom';

// ========================================
// Utility Types
// ========================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

// ========================================
// API Response Types
// ========================================

export type ApiSuccessResponse<T> = {
  status: 'success';
  data: T;
  message?: string;
  timestamp: Date;
};

export type ApiErrorResponse = {
  status: 'error';
  error: ApiError;
  timestamp: Date;
};

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ========================================
// Component Props Types
// ========================================

export interface BaseComponentProps {
  className?: string;
  style?: any;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ========================================
// Redux/State Management Types
// ========================================

export interface RootState {
  portfolio: PortfolioState;
  market: MarketState;
  user: UserState;
  ui: UIState;
  api: ApiState;
}

export interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolio?: Portfolio;
  optimization?: OptimizationResult;
  analysis?: RiskMetrics;
  loading: boolean;
  error?: string;
}

export interface MarketState {
  data: { [symbol: string]: MarketData };
  historical: { [symbol: string]: HistoricalDataPoint[] };
  loading: boolean;
  lastUpdate?: Date;
  error?: string;
}

export interface UserState {
  profile?: UserProfile;
  preferences: UserPreferences;
  authenticated: boolean;
  loading: boolean;
  error?: string;
}

export interface ApiState {
  providers: { [provider in ApiProvider]: ApiProviderState };
  rateLimit: { [provider in ApiProvider]: RateLimitInfo };
  errors: ApiError[];
}

export interface ApiProviderState {
  available: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
}

// ========================================
// Action Types for Redux
// ========================================

export interface BaseAction {
  type: string;
  payload?: any;
  meta?: any;
  error?: boolean;
}

export interface PayloadAction<T = any> extends BaseAction {
  payload: T;
}

export interface AsyncAction<T = any> {
  pending: () => BaseAction;
  fulfilled: (payload: T) => PayloadAction<T>;
  rejected: (error: Error) => PayloadAction<Error>;
}