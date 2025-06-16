// ===========================================
// src/utils/financial/indicators.ts
// Technical Analysis Indicators
// ===========================================

export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: Date;
}

export interface IndicatorResult {
  values: number[];
  signal?: 'buy' | 'sell' | 'hold';
  metadata?: any;
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
  percentB: number[];
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface StochasticResult {
  k: number[];
  d: number[];
}

// ===========================================
// Moving Averages
// ===========================================

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const sma: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA value is SMA
  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i];
  }
  ema.push(sum / Math.min(period, prices.length));
  
  // Calculate subsequent EMA values
  for (let i = 1; i < prices.length; i++) {
    const emaValue = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    ema.push(emaValue);
  }
  
  return ema;
}

/**
 * Weighted Moving Average (WMA)
 */
export function calculateWMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const wma: number[] = [];
  const weightSum = (period * (period + 1)) / 2;
  
  for (let i = period - 1; i < prices.length; i++) {
    let weightedSum = 0;
    
    for (let j = 0; j < period; j++) {
      weightedSum += prices[i - j] * (period - j);
    }
    
    wma.push(weightedSum / weightSum);
  }
  
  return wma;
}

// ===========================================
// Momentum Indicators
// ===========================================

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): IndicatorResult {
  if (prices.length < period + 1) return { values: [] };
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const rsi: number[] = [];
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Calculate RSI values
  for (let i = period; i < gains.length; i++) {
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    // Update averages using Wilder's smoothing
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }
  
  // Generate signals
  const lastRSI = rsi[rsi.length - 1];
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  
  if (lastRSI < 30) signal = 'buy';   // Oversold
  else if (lastRSI > 70) signal = 'sell'; // Overbought
  
  return { values: rsi, signal };
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  prices: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // MACD line = Fast EMA - Slow EMA
  const macd: number[] = [];
  const startIndex = slowPeriod - fastPeriod;
  
  for (let i = startIndex; i < fastEMA.length; i++) {
    macd.push(fastEMA[i] - slowEMA[i - startIndex]);
  }
  
  // Signal line = EMA of MACD
  const signal = calculateEMA(macd, signalPeriod);
  
  // Histogram = MACD - Signal
  const histogram: number[] = [];
  const histStartIndex = signalPeriod - 1;
  
  for (let i = histStartIndex; i < macd.length; i++) {
    histogram.push(macd[i] - signal[i - histStartIndex]);
  }
  
  return { macd, signal, histogram };
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  priceData: PriceData[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): StochasticResult {
  if (priceData.length < kPeriod) return { k: [], d: [] };
  
  const k: number[] = [];
  
  // Calculate %K values
  for (let i = kPeriod - 1; i < priceData.length; i++) {
    const window = priceData.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...window.map(p => p.high));
    const lowestLow = Math.min(...window.map(p => p.low));
    const currentClose = priceData[i].close;
    
    if (highestHigh === lowestLow) {
      k.push(50); // Avoid division by zero
    } else {
      k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
    }
  }
  
  // Calculate %D (SMA of %K)
  const d = calculateSMA(k, dPeriod);
  
  return { k, d };
}

/**
 * Williams %R
 */
export function calculateWilliamsR(priceData: PriceData[], period: number = 14): number[] {
  if (priceData.length < period) return [];
  
  const williamsR: number[] = [];
  
  for (let i = period - 1; i < priceData.length; i++) {
    const window = priceData.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...window.map(p => p.high));
    const lowestLow = Math.min(...window.map(p => p.low));
    const currentClose = priceData[i].close;
    
    if (highestHigh === lowestLow) {
      williamsR.push(-50);
    } else {
      williamsR.push(((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100);
    }
  }
  
  return williamsR;
}

// ===========================================
// Volatility Indicators
// ===========================================

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[], 
  period: number = 20, 
  stdDev: number = 2
): BollingerBandsResult {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];
  const percentB: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const window = prices.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    
    // Calculate standard deviation
    const variance = window.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    const upperBand = mean + (stdDev * std);
    const lowerBand = mean - (stdDev * std);
    
    upper.push(upperBand);
    lower.push(lowerBand);
    
    // Bandwidth (measure of volatility)
    bandwidth.push((upperBand - lowerBand) / mean);
    
    // %B (position within bands)
    const currentPrice = prices[i];
    if (upperBand === lowerBand) {
      percentB.push(0.5);
    } else {
      percentB.push((currentPrice - lowerBand) / (upperBand - lowerBand));
    }
  }
  
  return {
    upper,
    middle: sma,
    lower,
    bandwidth,
    percentB
  };
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(priceData: PriceData[], period: number = 14): number[] {
  if (priceData.length < 2) return [];
  
  const trueRanges: number[] = [];
  
  // Calculate True Range for each period
  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    const previous = priceData[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate ATR using EMA
  return calculateEMA(trueRanges, period);
}

// ===========================================
// Volume Indicators
// ===========================================

/**
 * On-Balance Volume (OBV)
 */
export function calculateOBV(priceData: PriceData[]): number[] {
  if (priceData.length < 2) return [];
  
  const obv: number[] = [priceData[0].volume || 0];
  
  for (let i = 1; i < priceData.length; i++) {
    const currentPrice = priceData[i].close;
    const previousPrice = priceData[i - 1].close;
    const currentVolume = priceData[i].volume || 0;
    
    if (currentPrice > previousPrice) {
      obv.push(obv[i - 1] + currentVolume);
    } else if (currentPrice < previousPrice) {
      obv.push(obv[i - 1] - currentVolume);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  
  return obv;
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(priceData: PriceData[]): number[] {
  const vwap: number[] = [];
  let cumulativeVolume = 0;
  let cumulativeVolumePrice = 0;
  
  for (const data of priceData) {
    const volume = data.volume || 0;
    const typicalPrice = (data.high + data.low + data.close) / 3;
    
    cumulativeVolume += volume;
    cumulativeVolumePrice += typicalPrice * volume;
    
    if (cumulativeVolume === 0) {
      vwap.push(typicalPrice);
    } else {
      vwap.push(cumulativeVolumePrice / cumulativeVolume);
    }
  }
  
  return vwap;
}

// ===========================================
// Trend Indicators
// ===========================================

/**
 * Average Directional Index (ADX)
 */
export function calculateADX(priceData: PriceData[], period: number = 14): number[] {
  if (priceData.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  // Calculate True Range and Directional Movement
  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    const previous = priceData[i - 1];
    
    // True Range
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    trueRanges.push(Math.max(tr1, tr2, tr3));
    
    // Directional Movement
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  // Calculate smoothed averages
  const smoothedTR = calculateEMA(trueRanges, period);
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  
  // Calculate DI+ and DI-
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  
  for (let i = 0; i < smoothedTR.length; i++) {
    plusDI.push(smoothedTR[i] ? (smoothedPlusDM[i] / smoothedTR[i]) * 100 : 0);
    minusDI.push(smoothedTR[i] ? (smoothedMinusDM[i] / smoothedTR[i]) * 100 : 0);
  }
  
  // Calculate DX and ADX
  const dx: number[] = [];
  for (let i = 0; i < plusDI.length; i++) {
    const sum = plusDI[i] + minusDI[i];
    if (sum === 0) {
      dx.push(0);
    } else {
      dx.push(Math.abs(plusDI[i] - minusDI[i]) / sum * 100);
    }
  }
  
  return calculateEMA(dx, period);
}

/**
 * Parabolic SAR
 */
export function calculateParabolicSAR(
  priceData: PriceData[], 
  step: number = 0.02, 
  maxStep: number = 0.2
): number[] {
  if (priceData.length < 2) return [];
  
  const sar: number[] = [];
  let trend = 1; // 1 for uptrend, -1 for downtrend
  let acceleration = step;
  let extremePoint = priceData[0].high;
  let sarValue = priceData[0].low;
  
  sar.push(sarValue);
  
  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    
    if (trend === 1) { // Uptrend
      sarValue = sarValue + acceleration * (extremePoint - sarValue);
      
      if (current.low <= sarValue) {
        trend = -1;
        sarValue = extremePoint;
        extremePoint = current.low;
        acceleration = step;
      } else {
        if (current.high > extremePoint) {
          extremePoint = current.high;
          acceleration = Math.min(acceleration + step, maxStep);
        }
      }
    } else { // Downtrend
      sarValue = sarValue + acceleration * (extremePoint - sarValue);
      
      if (current.high >= sarValue) {
        trend = 1;
        sarValue = extremePoint;
        extremePoint = current.high;
        acceleration = step;
      } else {
        if (current.low < extremePoint) {
          extremePoint = current.low;
          acceleration = Math.min(acceleration + step, maxStep);
        }
      }
    }
    
    sar.push(sarValue);
  }
  
  return sar;
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Detect crossovers between two series
 */
export function detectCrossovers(
  series1: number[], 
  series2: number[]
): Array<{ index: number; type: 'bullish' | 'bearish' }> {
  const crossovers: Array<{ index: number; type: 'bullish' | 'bearish' }> = [];
  const minLength = Math.min(series1.length, series2.length);
  
  for (let i = 1; i < minLength; i++) {
    const prev1 = series1[i - 1];
    const prev2 = series2[i - 1];
    const curr1 = series1[i];
    const curr2 = series2[i];
    
    if (prev1 <= prev2 && curr1 > curr2) {
      crossovers.push({ index: i, type: 'bullish' });
    } else if (prev1 >= prev2 && curr1 < curr2) {
      crossovers.push({ index: i, type: 'bearish' });
    }
  }
  
  return crossovers;
}

/**
 * Calculate indicator divergences
 */
export function detectDivergence(
  prices: number[], 
  indicator: number[], 
  period: number = 5
): Array<{ index: number; type: 'bullish' | 'bearish' }> {
  const divergences: Array<{ index: number; type: 'bullish' | 'bearish' }> = [];
  
  // Find local peaks and troughs
  const priceExtremes = findExtremes(prices, period);
  const indicatorExtremes = findExtremes(indicator, period);
  
  // Compare trends between price and indicator extremes
  // This is a simplified implementation
  // Full divergence detection would require more sophisticated peak/trough analysis
  
  return divergences;
}

/**
 * Find local extremes (peaks and troughs)
 */
function findExtremes(
  data: number[], 
  period: number
): Array<{ index: number; value: number; type: 'peak' | 'trough' }> {
  const extremes: Array<{ index: number; value: number; type: 'peak' | 'trough' }> = [];
  
  for (let i = period; i < data.length - period; i++) {
    const window = data.slice(i - period, i + period + 1);
    const currentValue = data[i];
    
    if (currentValue === Math.max(...window)) {
      extremes.push({ index: i, value: currentValue, type: 'peak' });
    } else if (currentValue === Math.min(...window)) {
      extremes.push({ index: i, value: currentValue, type: 'trough' });
    }
  }
  
  return extremes;
}