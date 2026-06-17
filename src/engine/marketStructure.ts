// ============================================================================
// WARRIKS AI v5.1 — Market Structure Engine (D1 / 4H / 1H)
// Purpose: Define macro trend direction, detect BOS/CHOCH, identify regime
// ============================================================================

import type { Candle, MarketStructureResult, MarketBias, StructureState } from "./types";

/**
 * Analyze market structure across multiple timeframes using candlestick data.
 * Simulates D1, 4H, and 1H analysis from available data.
 */
export function analyzeMarketStructure(
  candles: Candle[],
  symbol: string,
): MarketStructureResult {
  if (candles.length < 20) {
    return {
      bias: "NEUTRAL",
      structureState: "UNCLEAR",
      trendStrength: 0,
      description: "Insufficient data for structure analysis",
    };
  }

  // Sort candles by timestamp ascending
  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);

  // Calculate EMAs for trend direction
  const ema20 = calculateEMA(sorted, 20);
  const ema50 = calculateEMA(sorted, 50);

  // Detect higher highs / lower lows (uptrend) or lower highs / higher lows (downtrend)
  const recentCandles = sorted.slice(-30);
  const highs = recentCandles.map((c) => c.high);
  const lows = recentCandles.map((c) => c.low);

  // Count sequences for structure detection
  let higherHighs = 0;
  let lowerLows = 0;

  for (let i = 2; i < highs.length; i++) {
    if (highs[i] > highs[i - 1] && highs[i - 1] > highs[i - 2]) higherHighs++;
    if (lows[i] < lows[i - 1] && lows[i - 1] < lows[i - 2]) lowerLows++;
  }

  // Break of Structure (BOS) detection
  const bosUp = detectBOS(highs, "UP");
  const bosDown = detectBOS(lows, "DOWN");

  // Change of Character (CHOCH) detection
  const choch = detectCHOCH(highs, lows);

  // Determine bias
  let bias: MarketBias = "NEUTRAL";
  let structureState: StructureState = "RANGE";

  const emaSlope = ema20[ema20.length - 1] - ema20[Math.floor(ema20.length * 0.7)];
  const priceAboveEma = sorted[sorted.length - 1].close > ema20[ema20.length - 1];

  if (bosUp && priceAboveEma && emaSlope > 0) {
    bias = "BULLISH";
    structureState = "BOS";
  } else if (bosDown && !priceAboveEma && emaSlope < 0) {
    bias = "BEARISH";
    structureState = "BOS";
  } else if (choch.detected) {
    structureState = "CHOCH";
    bias = choch.newBias;
  } else if (higherHighs > lowerLows + 2 && priceAboveEma) {
    bias = "BULLISH";
    structureState = "TRENDING";
  } else if (lowerLows > higherHighs + 2 && !priceAboveEma) {
    bias = "BEARISH";
    structureState = "TRENDING";
  }

  // Calculate trend strength (0–100)
  const trendStrength = calculateTrendStrength(
    emaSlope,
    higherHighs,
    lowerLows,
    sorted,
    bias,
  );

  return {
    bias,
    structureState,
    trendStrength,
    description: buildStructureDescription(bias, structureState, trendStrength, symbol),
  };
}

function calculateEMA(candles: Candle[], period: number): number[] {
  const closes = candles.map((c) => c.close);
  const k = 2 / (period + 1);
  const ema: number[] = [closes[0]];

  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }

  return ema;
}

function detectBOS(values: number[], direction: "UP" | "DOWN"): boolean {
  const recent = values.slice(-10);
  const pivot = direction === "UP"
    ? Math.max(...recent.slice(0, 5))
    : Math.min(...recent.slice(0, 5));

  const check = direction === "UP"
    ? recent[recent.length - 1] > pivot
    : recent[recent.length - 1] < pivot;

  // Check if at least 2 of last 3 candles confirm the break
  const last3 = recent.slice(-3);
  const confirmations = direction === "UP"
    ? last3.filter((v) => v > pivot).length
    : last3.filter((v) => v < pivot).length;

  return check && confirmations >= 2;
}

function detectCHOCH(
  highs: number[],
  lows: number[],
): { detected: boolean; newBias: MarketBias } {
  const recentHighs = highs.slice(-15);
  const recentLows = lows.slice(-15);

  // Prev downtrend: series of lower lows
  const oldLows = recentLows.slice(0, 8);
  const lastLows = recentLows.slice(-5);
  const downtrendBroken = Math.max(...lastLows) > Math.max(...oldLows);

  // Prev uptrend: series of higher highs
  const oldHighs = recentHighs.slice(0, 8);
  const lastHighs = recentHighs.slice(-5);
  const uptrendBroken = Math.min(...lastHighs) < Math.min(...oldHighs);

  if (downtrendBroken) return { detected: true, newBias: "BULLISH" };
  if (uptrendBroken) return { detected: true, newBias: "BEARISH" };

  return { detected: false, newBias: "NEUTRAL" };
}

function calculateTrendStrength(
  emaSlope: number,
  higherHighs: number,
  lowerLows: number,
  candles: Candle[],
  bias: MarketBias,
): number {
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const candleSize = Math.abs(lastCandle.close - prevCandle.close);
  const avgSize = candles
    .slice(-20)
    .reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 20;

  const momentum = avgSize > 0 ? Math.min(candleSize / avgSize, 1) : 0.5;
  const structureCount = bias === "BULLISH" ? higherHighs : lowerLows;
  const structureScore = Math.min(structureCount / 5, 1);
  const slopeScore = Math.min(Math.abs(emaSlope) / 0.5, 1);

  return Math.round(((momentum * 0.3 + structureScore * 0.4 + slopeScore * 0.3)) * 100);
}

function buildStructureDescription(
  bias: MarketBias,
  state: StructureState,
  strength: number,
  symbol: string,
): string {
  if (bias === "NEUTRAL") return `${symbol}: Neutral structure, no clear directional bias`;
  return `${symbol}: ${bias} ${state}, trend strength ${strength}/100`;
}
