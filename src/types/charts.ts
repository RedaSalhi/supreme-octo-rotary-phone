// ===========================================
// src/types/charts.ts
// Chart and UI Component Specific Types
// ===========================================

import { Asset, Portfolio, RiskMetrics, VaRResult, EfficientFrontierPoint } from './index';

// ========================================
// Chart Configuration & Data
// ========================================

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: ChartPlugin[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[] | ChartPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  type?: ChartType;
  yAxisID?: string;
  hidden?: boolean;
}

export interface ChartPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  aspectRatio?: number;
  scales?: ChartScales;
  plugins?: ChartPluginOptions;
  interaction?: InteractionOptions;
  animation?: AnimationOptions;
  layout?: LayoutOptions;
  elements?: ElementOptions;
}

// ========================================
// Financial Chart Types
// ========================================

export interface PortfolioChartData {
  type: 'allocation' | 'performance' | 'comparison' | 'correlation';
  portfolio: Portfolio;
  timeframe: Timeframe;
  benchmark?: string;
  data: ChartData;
  metrics?: RiskMetrics;
}

export interface RiskChartData {
  type: 'var' | 'risk_return' | 'drawdown' | 'correlation_matrix';
  varResult?: VaRResult;
  riskMetrics?: RiskMetrics;
  data: ChartData;
  confidenceLevel?: number;
}

export interface OptimizationChartData {
  type: 'efficient_frontier' | 'weights' | 'risk_contribution';
  efficientFrontier?: EfficientFrontierPoint[];
  currentPortfolio?: Portfolio;
  optimizedWeights?: number[];
  data: ChartData;
}

export interface PriceChartData {
  type: 'line' | 'candlestick' | 'volume' | 'indicators';
  symbol: string;
  timeframe: Timeframe;
  data: CandlestickData[] | PricePoint[];
  volume?: VolumeData[];
  indicators?: TechnicalIndicator[];
}

export interface CandlestickData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

export interface VolumeData {
  timestamp: Date;
  volume: number;
  color?: string;
}

export interface TechnicalIndicator {
  name: string;
  type: IndicatorType;
  data: IndicatorPoint[];
  color: string;
  visible: boolean;
}

export interface IndicatorPoint {
  timestamp: Date;
  value: number;
}

// ========================================
// Chart Components Props
// ========================================

export interface LineChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  animate?: boolean;
  onPointPress?: (point: ChartPoint, index: number) => void;
}

export interface PieChartProps {
  data: PieSlice[];
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  colors?: string[];
  showLabels?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  animate?: boolean;
  onSlicePress?: (slice: PieSlice, index: number) => void;
}

export interface BarChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  barColor?: string;
  showValues?: boolean;
  horizontal?: boolean;
  grouped?: boolean;
  stacked?: boolean;
  animate?: boolean;
  onBarPress?: (bar: BarData, index: number) => void;
}

export interface CandlestickChartProps {
  data: CandlestickData[];
  width?: number;
  height?: number;
  timeframe: Timeframe;
  showVolume?: boolean;
  showIndicators?: boolean;
  indicators?: TechnicalIndicator[];
  onCandlePress?: (candle: CandlestickData, index: number) => void;
}

export interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  colors?: string[];
  showTrendline?: boolean;
  onPointPress?: (point: ScatterPoint, index: number) => void;
}

export interface HeatmapProps {
  data: HeatmapData[][];
  width?: number;
  height?: number;
  colorScale?: ColorScale;
  showValues?: boolean;
  rowLabels?: string[];
  columnLabels?: string[];
  onCellPress?: (cell: HeatmapData, row: number, col: number) => void;
}

// ========================================
// Chart Data Types
// ========================================

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface BarData {
  label: string;
  value: number;
  color?: string;
  category?: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  size?: number;
  category?: string;
}

export interface HeatmapData {
  value: number;
  label?: string;
  color?: string;
}

export interface ColorScale {
  min: string;
  max: string;
  steps?: number;
  type?: 'linear' | 'logarithmic';
}

// ========================================
// Chart Styling & Theming
// ========================================

export interface ChartTheme {
  name: string;
  colors: ChartColors;
  fonts: ChartFonts;
  spacing: ChartSpacing;
  effects: ChartEffects;
}

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  grid: string;
  axis: string;
  palette: string[];
}

export interface ChartFonts {
  family: string;
  sizes: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  weights: {
    normal: string;
    bold: string;
  };
}

export interface ChartSpacing {
  padding: number;
  margin: number;
  gap: number;
  legend: number;
  axis: number;
}

export interface ChartEffects {
  shadow: boolean;
  gradient: boolean;
  animation: boolean;
  hover: boolean;
}

// ========================================
// Advanced Chart Options
// ========================================

export interface ChartScales {
  x?: AxisConfig;
  y?: AxisConfig;
  y1?: AxisConfig; // Secondary y-axis
}

export interface AxisConfig {
  type: AxisType;
  position: AxisPosition;
  title?: AxisTitle;
  min?: number;
  max?: number;
  ticks?: TickConfig;
  grid?: GridConfig;
  border?: BorderConfig;
  display?: boolean;
  reverse?: boolean;
  stacked?: boolean;
}

export interface AxisTitle {
  display: boolean;
  text: string;
  color?: string;
  font?: FontConfig;
  padding?: number;
}

export interface TickConfig {
  display: boolean;
  color?: string;
  font?: FontConfig;
  maxRotation?: number;
  minRotation?: number;
  padding?: number;
  stepSize?: number;
  precision?: number;
  format?: string;
  callback?: (value: any, index: number) => string;
}

export interface GridConfig {
  display: boolean;
  color?: string;
  lineWidth?: number;
  drawBorder?: boolean;
  drawOnChartArea?: boolean;
  drawTicks?: boolean;
}

export interface BorderConfig {
  display: boolean;
  color?: string;
  width?: number;
  dash?: number[];
}

export interface FontConfig {
  family?: string;
  size?: number;
  style?: FontStyle;
  weight?: FontWeight;
  lineHeight?: number;
}

export interface ChartPluginOptions {
  legend?: LegendConfig;
  title?: TitleConfig;
  tooltip?: TooltipConfig;
  zoom?: ZoomConfig;
  crosshair?: CrosshairConfig;
  annotation?: AnnotationConfig;
}

export interface LegendConfig {
  display: boolean;
  position: LegendPosition;
  align?: LegendAlign;
  labels?: LegendLabelConfig;
  title?: LegendTitleConfig;
  onClick?: (event: any, legendItem: any) => void;
  onHover?: (event: any, legendItem: any) => void;
}

export interface LegendLabelConfig {
  boxWidth?: number;
  boxHeight?: number;
  color?: string;
  font?: FontConfig;
  padding?: number;
  pointStyle?: PointStyle;
  textAlign?: TextAlign;
  usePointStyle?: boolean;
}

export interface LegendTitleConfig {
  display: boolean;
  text: string;
  color?: string;
  font?: FontConfig;
  padding?: number;
}

export interface TitleConfig {
  display: boolean;
  text: string | string[];
  color?: string;
  font?: FontConfig;
  padding?: number;
  position?: TitlePosition;
}

export interface TooltipConfig {
  enabled: boolean;
  mode: TooltipMode;
  intersect: boolean;
  position: TooltipPosition;
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  displayColors?: boolean;
  callbacks?: TooltipCallbacks;
}

export interface TooltipCallbacks {
  beforeTitle?: (tooltipItems: any[]) => string | string[];
  title?: (tooltipItems: any[]) => string | string[];
  afterTitle?: (tooltipItems: any[]) => string | string[];
  beforeBody?: (tooltipItems: any[]) => string | string[];
  beforeLabel?: (tooltipItem: any) => string | string[];
  label?: (tooltipItem: any) => string | string[];
  afterLabel?: (tooltipItem: any) => string | string[];
  afterBody?: (tooltipItems: any[]) => string | string[];
  beforeFooter?: (tooltipItems: any[]) => string | string[];
  footer?: (tooltipItems: any[]) => string | string[];
  afterFooter?: (tooltipItems: any[]) => string | string[];
}

export interface ZoomConfig {
  pan?: PanConfig;
  zoom?: ZoomInteractionConfig;
  limits?: ZoomLimits;
}

export interface PanConfig {
  enabled: boolean;
  mode: PanMode;
  rangeMin?: { [axis: string]: number };
  rangeMax?: { [axis: string]: number };
  speed?: number;
  threshold?: number;
}

export interface ZoomInteractionConfig {
  wheel?: WheelZoomConfig;
  pinch?: PinchZoomConfig;
  drag?: DragZoomConfig;
}

export interface WheelZoomConfig {
  enabled: boolean;
  speed?: number;
  modifierKey?: ModifierKey;
}

export interface PinchZoomConfig {
  enabled: boolean;
}

export interface DragZoomConfig {
  enabled: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface ZoomLimits {
  x?: { min?: number; max?: number; minRange?: number };
  y?: { min?: number; max?: number; minRange?: number };
}

export interface CrosshairConfig {
  line?: CrosshairLineConfig;
  sync?: CrosshairSyncConfig;
  zoom?: CrosshairZoomConfig;
}

export interface CrosshairLineConfig {
  color?: string;
  width?: number;
  dashPattern?: number[];
}

export interface CrosshairSyncConfig {
  enabled: boolean;
  group?: string;
  suppressTooltips?: boolean;
}

export interface CrosshairZoomConfig {
  enabled: boolean;
}

export interface AnnotationConfig {
  annotations: ChartAnnotation[];
}

export interface ChartAnnotation {
  type: AnnotationType;
  display?: boolean;
  adjustScaleRange?: boolean;
  scaleID?: string;
  value?: number;
  endValue?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  label?: AnnotationLabel;
}

export interface AnnotationLabel {
  display?: boolean;
  content?: string | string[];
  position?: AnnotationPosition;
  xAdjust?: number;
  yAdjust?: number;
  backgroundColor?: string;
  color?: string;
  font?: FontConfig;
  padding?: number;
}

// ========================================
// Interaction & Animation
// ========================================

export interface InteractionOptions {
  mode: InteractionMode;
  intersect: boolean;
  includeInvisible?: boolean;
}

export interface AnimationOptions {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  loop?: boolean;
  onProgress?: (animation: any) => void;
  onComplete?: (animation: any) => void;
}

export interface LayoutOptions {
  padding?: number | PaddingOptions;
  autoPadding?: boolean;
}

export interface PaddingOptions {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ElementOptions {
  point?: PointElementOptions;
  line?: LineElementOptions;
  bar?: BarElementOptions;
  arc?: ArcElementOptions;
}

export interface PointElementOptions {
  radius?: number;
  pointStyle?: PointStyle;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  hoverRadius?: number;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  hoverBorderWidth?: number;
}

export interface LineElementOptions {
  tension?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderCapStyle?: LineCapStyle;
  borderJoinStyle?: LineJoinStyle;
  capBezierPoints?: boolean;
  cubicInterpolationMode?: CubicInterpolationMode;
  fill?: boolean | string;
  stepped?: boolean | SteppedValue;
}

export interface BarElementOptions {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number | BorderRadiusOptions;
  borderSkipped?: BorderSkipped;
  base?: number;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  hoverBorderWidth?: number;
}

export interface BorderRadiusOptions {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

export interface ArcElementOptions {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderAlign?: BorderAlign;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  hoverBorderWidth?: number;
}

// ========================================
// Type Enums & Unions
// ========================================

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'scatter' 
  | 'bubble' 
  | 'radar' 
  | 'polarArea' 
  | 'candlestick' 
  | 'heatmap';

export type AxisType = 
  | 'linear' 
  | 'logarithmic' 
  | 'category' 
  | 'time' 
  | 'timeseries' 
  | 'radialLinear';

export type AxisPosition = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'center';

export type FontStyle = 
  | 'normal' 
  | 'italic' 
  | 'oblique';

export type FontWeight = 
  | 'normal' 
  | 'bold' 
  | 'bolder' 
  | 'lighter' 
  | number;

export type LegendPosition = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'center';

export type LegendAlign = 
  | 'start' 
  | 'center' 
  | 'end';

export type PointStyle = 
  | 'circle' 
  | 'cross' 
  | 'crossRot' 
  | 'dash' 
  | 'line' 
  | 'rect' 
  | 'rectRounded' 
  | 'rectRot' 
  | 'star' 
  | 'triangle';

export type TextAlign = 
  | 'left' 
  | 'center' 
  | 'right';

export type TitlePosition = 
  | 'top' 
  | 'bottom';

export type TooltipMode = 
  | 'point' 
  | 'nearest' 
  | 'index' 
  | 'dataset' 
  | 'x' 
  | 'y';

export type TooltipPosition = 
  | 'average' 
  | 'nearest';

export type PanMode = 
  | 'x' 
  | 'y' 
  | 'xy';

export type ModifierKey = 
  | 'ctrl' 
  | 'alt' 
  | 'shift' 
  | 'meta';

export type AnnotationType = 
  | 'line' 
  | 'box' 
  | 'ellipse' 
  | 'point' 
  | 'polygon';

export type AnnotationPosition = 
  | 'start' 
  | 'center' 
  | 'end';

export type InteractionMode = 
  | 'point' 
  | 'nearest' 
  | 'index' 
  | 'dataset' 
  | 'x' 
  | 'y';

export type EasingFunction = 
  | 'linear' 
  | 'easeInQuad' 
  | 'easeOutQuad' 
  | 'easeInOutQuad' 
  | 'easeInCubic' 
  | 'easeOutCubic' 
  | 'easeInOutCubic' 
  | 'easeInQuart' 
  | 'easeOutQuart' 
  | 'easeInOutQuart' 
  | 'easeInQuint' 
  | 'easeOutQuint' 
  | 'easeInOutQuint' 
  | 'easeInSine' 
  | 'easeOutSine' 
  | 'easeInOutSine' 
  | 'easeInExpo' 
  | 'easeOutExpo' 
  | 'easeInOutExpo' 
  | 'easeInCirc' 
  | 'easeOutCirc' 
  | 'easeInOutCirc' 
  | 'easeInElastic' 
  | 'easeOutElastic' 
  | 'easeInOutElastic' 
  | 'easeInBack' 
  | 'easeOutBack' 
  | 'easeInOutBack' 
  | 'easeInBounce' 
  | 'easeOutBounce' 
  | 'easeInOutBounce';

export type LineCapStyle = 
  | 'butt' 
  | 'round' 
  | 'square';

export type LineJoinStyle = 
  | 'bevel' 
  | 'round' 
  | 'miter';

export type CubicInterpolationMode = 
  | 'default' 
  | 'monotone';

export type SteppedValue = 
  | 'before' 
  | 'after' 
  | 'middle';

export type BorderSkipped = 
  | false 
  | 'start' 
  | 'end' 
  | 'middle' 
  | 'bottom' 
  | 'left' 
  | 'top' 
  | 'right';

export type BorderAlign = 
  | 'center' 
  | 'inner';

export type IndicatorType = 
  | 'sma' 
  | 'ema' 
  | 'rsi' 
  | 'macd' 
  | 'bollinger' 
  | 'stochastic' 
  | 'volume' 
  | 'obv';

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

// ========================================
// Chart Plugin Interface
// ========================================

export interface ChartPlugin {
  id: string;
  beforeInit?: (chart: any, args: any, options: any) => void;
  afterInit?: (chart: any, args: any, options: any) => void;
  beforeUpdate?: (chart: any, args: any, options: any) => void;
  afterUpdate?: (chart: any, args: any, options: any) => void;
  beforeDraw?: (chart: any, args: any, options: any) => void;
  afterDraw?: (chart: any, args: any, options: any) => void;
  beforeEvent?: (chart: any, args: any, options: any) => boolean | void;
  afterEvent?: (chart: any, args: any, options: any) => void;
  resize?: (chart: any, args: any, options: any) => void;
  destroy?: (chart: any, args: any, options: any) => void;
  install?: (chart: any, args: any, options: any) => void;
  start?: (chart: any, args: any, options: any) => void;
  stop?: (chart: any, args: any, options: any) => void;
  uninstall?: (chart: any, args: any, options: any) => void;
}