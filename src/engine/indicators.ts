// ============================================================================
// WARRIKS AI v5.1 — Technical Indicator Library
// All indicator calculations used by the multi-strategy engine
// ============================================================================

import type { Candle, IndicatorValues } from "./types";

/**
 * Calculate all indicators for a given set of candles.
 */
export function calculateAllIndicators(candles: Candle[]): IndicatorValues {
  const prices = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  return {
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices),
    adx: calculateADX(highs, lows, prices, 14),
    bollinger: calculateBollingerBands(prices, 20, 2),
    donchian: calculateDonchian(highs, lows, 20),
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
    ema9: calculateEMA(prices, 9),
    ema21: calculateEMA(prices, 21),
    atr: calculateATR(candles, 14),
    volumeAvg: calculateSMA(
      candles.map((c) => c.volume),
      20,
    ),
    zscore: calculateZScore(prices, 20),
  };
}

// ─── Simple Moving Average ──────────────────────────────────────────────────

export function calculateSMA(values: number[], period: number): number {
  if (values.length < period || period <= 0 || values.length === 0) return 0;
  const slice = values.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / period;
}

// ─── Exponential Moving Average ─────────────────────────────────────────────

export function calculateEMA(values: number[], period: number): number {
  if (values.length < period) return calculateSMA(values, values.length);
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

// ─── RSI (Relative Strength Index) ──────────────────────────────────────────

export function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  const start = prices.length - period - 1;
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = start + 1; i <= start + period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ─── MACD (Moving Average Convergence Divergence) ───────────────────────────

export function calculateMACD(
  prices: number[],
): { macdLine: number; signalLine: number; histogram: number } {
  if (prices.length < 35) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  // Calculate EMAs
  const ema12 = calculateEMAArray(prices, 12);
  const ema26 = calculateEMAArray(prices, 26);

  // MACD line = EMA12 - EMA26 (use last values)
  const macdLine = ema12 - ema26;

  // Signal line = 9-period EMA of MACD line
  // To approximate, we need history of MACD values
  const macdHistory: number[] = [];
  const minLen = Math.min(prices.length, 50);
  for (let i = minLen - 1; i >= 26; i--) {
    const p12 = calculateEMA(prices.slice(0, i + 1), 12);
    const p26 = calculateEMA(prices.slice(0, i + 1), 26);
    macdHistory.unshift(p12 - p26);
  }

  const signalLine = macdHistory.length >= 9
    ? calculateEMA(macdHistory, 9)
    : macdLine;

  return {
    macdLine,
    signalLine,
    histogram: macdLine - signalLine,
  };
}

function calculateEMAArray(values: number[], period: number): number {
  return calculateEMA(values, period);
}

// ─── ADX (Average Directional Index) ────────────────────────────────────────

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number,
): number {
  if (closes.length < period * 2) return 20;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      ),
    );
  }

  const smoothedTR = calculateSMMA(tr, period);
  const smoothedPlusDM = calculateSMMA(plusDM, period);
  const smoothedMinusDM = calculateSMMA(minusDM, period);

  const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

  const dx = Math.abs(plusDI - minusDI) / Math.max(plusDI + minusDI, 0.001) * 100;

  // ADX is smoothed DX (approximate with last value)
  return Math.min(dx, 100);
}

function calculateSMMA(values: number[], period: number): number {
  if (values.length < period) return values.reduce((s, v) => s + v, 0) / values.length;
  const slice = values.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / period;
}

// ─── Bollinger Bands ────────────────────────────────────────────────────────

export function calculateBollingerBands(
  prices: number[],
  period: number,
  stdDev: number,
): { upper: number; middle: number; lower: number } {
  const middle = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const variance = slice.reduce((s, v) => s + (v - middle) ** 2, 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: middle + stdDev * std,
    middle,
    lower: middle - stdDev * std,
  };
}

// ─── Donchian Channel ───────────────────────────────────────────────────────

export function calculateDonchian(
  highs: number[],
  lows: number[],
  period: number,
): { upper: number; middle: number; lower: number } {
  const highSlice = highs.slice(-period);
  const lowSlice = lows.slice(-period);
  const upper = Math.max(...highSlice);
  const lower = Math.min(...lowSlice);
  return {
    upper,
    middle: (upper + lower) / 2,
    lower,
  };
}

// ─── ATR (Average True Range) ───────────────────────────────────────────────

export function calculateATR(candles: Candle[], period: number): number {
  if (candles.length < 2) return 0;

  const trValues: number[] = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    if (i < 1) continue;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    );
    trValues.push(tr);
  }

  if (trValues.length === 0) return 0;
  return trValues.reduce((s, v) => s + v, 0) / trValues.length;
}

// ─── Z-Score (distance from mean in std devs) ───────────────────────────────

export function calculateZScore(
  prices: number[],
  period: number,
): number {
  const slice = prices.slice(-period);
  if (slice.length < 2) return 0;

  const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
  const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length;
  const std = Math.sqrt(variance);

  if (std === 0) return 0;
  const lastPrice = slice[slice.length - 1];
  return (lastPrice - mean) / std;
}

// ─── Rate of Change ─────────────────────────────────────────────────────────

export function calculateROC(prices: number[], period: number): number {
  if (prices.length < period + 1) return 0;
  const current = prices[prices.length - 1];
  const previous = prices[prices.length - 1 - period];
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
