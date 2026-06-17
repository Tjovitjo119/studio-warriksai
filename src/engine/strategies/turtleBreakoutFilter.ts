// ============================================================================
// WARRIKS AI v5.2 — Strategy Engine 5: Turtle Breakout Filter
// Purpose: Detect genuine institutional momentum expansion
// Vote Strengths: Bullish, Bearish, Neutral
// Priority: Medium
// ============================================================================
//
// Best Formation Times:
//   08:30 – 11:00 NY Time
//   Major News Events
//   High Volatility Sessions
//
// Requirements:
//   1. 20-period breakout
//   2. HTF trend alignment
//   3. Volatility expansion
//   4. Volume increase
// ============================================================================

import type {
  Candle,
  MarketStructureResult,
  StrategyEngineResult,
} from "../types";
import { calculateAllIndicators } from "../indicators";

/**
 * Detect a 20-period breakout: price exceeds the 20-period high or low.
 */
function detectBreakout(
  candles: Candle[],
): { brokeOut: boolean; direction: "BUY" | "SELL" | "NEUTRAL"; level: number; strength: number } {
  if (candles.length < 25) {
    return { brokeOut: false, direction: "NEUTRAL", level: 0, strength: 0 };
  }

  const lookback = candles.slice(-25, -1);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;

  const periodHigh = Math.max(...lookback.map((c) => c.high));
  const periodLow = Math.min(...lookback.map((c) => c.low));

  const range = periodHigh - periodLow;
  if (range === 0) return { brokeOut: false, direction: "NEUTRAL", level: 0, strength: 0 };

  // Bullish breakout: close above 20-period high
  const aboveHigh = lastCandle.high > periodHigh && lastPrice > periodHigh * 1.001;
  // Bearish breakout: close below 20-period low
  const belowLow = lastCandle.low < periodLow && lastPrice < periodLow * 0.999;

  if (aboveHigh) {
    const strength = Math.min((lastPrice - periodHigh) / range * 100, 100);
    return { brokeOut: true, direction: "BUY", level: periodHigh, strength };
  }

  if (belowLow) {
    const strength = Math.min((periodLow - lastPrice) / range * 100, 100);
    return { brokeOut: true, direction: "SELL", level: periodLow, strength };
  }

  return { brokeOut: false, direction: "NEUTRAL", level: 0, strength: 0 };
}

/**
 * Detect volatility expansion by comparing recent ATR to previous ATR.
 */
function detectVolatilityExpansion(
  candles: Candle[],
): { expanding: boolean; ratio: number } {
  if (candles.length < 30) {
    return { expanding: false, ratio: 1 };
  }

  const recentATR = calculateATRSimple(candles.slice(-14), 14);
  const priorATR = calculateATRSimple(candles.slice(-28, -14), 14);

  if (priorATR === 0) return { expanding: false, ratio: 1 };

  const ratio = recentATR / priorATR;
  return {
    expanding: ratio > 1.1,
    ratio,
  };
}

function calculateATRSimple(candles: Candle[], period: number): number {
  if (candles.length < 2) return 0;
  const trValues: number[] = [];
  for (let i = Math.max(1, candles.length - period); i < candles.length; i++) {
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

/**
 * Turtle Breakout Filter Engine.
 *
 * Identifies genuine momentum expansions using the classic Turtle Trading
 * 20-period breakout with volatility, volume, and trend alignment filters.
 */
export function analyzeTurtleBreakout(
  candles: Candle[],
  structure: MarketStructureResult,
  symbol: string,
): StrategyEngineResult {
  if (candles.length < 30) {
    return {
      type: "TURTLE_BREAKOUT",
      direction: "NEUTRAL",
      voteStrength: "NEUTRAL",
      confidence: 0,
      signal: false,
      reason: `${symbol}: Insufficient data for Turtle Breakout analysis`,
      priority: "MEDIUM",
      indicators: {},
      active: false,
    };
  }

  const ind = calculateAllIndicators(candles);
  const lastCandle = candles[candles.length - 1];
  const lastVolume = lastCandle.volume;

  // Condition 1: 20-period breakout
  const breakout = detectBreakout(candles);

  // Condition 2: HTF trend alignment
  const htfAligned =
    (breakout.direction === "BUY" && structure.bias === "BULLISH") ||
    (breakout.direction === "SELL" && structure.bias === "BEARISH");

  // Condition 3: Volatility expansion
  const volExpansion = detectVolatilityExpansion(candles);

  // Condition 4: Volume increase (above average)
  const volumeRatio = ind.volumeAvg > 0 ? lastVolume / ind.volumeAvg : 1;
  const volumeIncreased = volumeRatio >= 1.3;

  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let voteStrength: "STRONG_BULLISH" | "STRONG_BEARISH" | "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let signal = false;
  let reason = "";

  const totalConditions = 4;
  let conditionsMet = 0;

  if (breakout.brokeOut) {
    conditionsMet++;
    if (htfAligned) conditionsMet++;
    if (volExpansion.expanding) conditionsMet++;
    if (volumeIncreased) conditionsMet++;

    if (conditionsMet >= 2) {
      direction = breakout.direction;
      confidence = 35 + conditionsMet * 12;

      // Breakout strength bonus
      if (breakout.strength > 30) confidence += 8;

      // Strong volume bonus
      if (volumeRatio >= 2.0) confidence += 7;

      // Strong volatility expansion bonus
      if (volExpansion.ratio > 1.5) confidence += 5;

      // All conditions met = strong signal
      if (conditionsMet >= totalConditions) {
        voteStrength = direction === "BUY" ? "STRONG_BULLISH" : "STRONG_BEARISH";
        confidence += 10;
      } else {
        voteStrength = direction === "BUY" ? "BULLISH" : "BEARISH";
      }

      signal = conditionsMet >= 3;
      confidence = Math.min(Math.max(Math.round(confidence), 0), 100);

      reason =
        `${symbol} TURTLE ${direction}: ${conditionsMet}/${totalConditions} conditions. ` +
        `Breakout${htfAligned ? " + HTF aligned" : ""}, ` +
        `Volatility ${volExpansion.expanding ? `${volExpansion.ratio.toFixed(2)}x` : "normal"}, ` +
        `Volume ${volumeRatio.toFixed(1)}x. Confidence ${confidence}%`;
    }
  }

  if (direction === "NEUTRAL") {
    if (!breakout.brokeOut) {
      reason = `${symbol}: No Turtle breakout. Price within 20-period range.`;
    } else {
      const failed: string[] = [];
      if (!htfAligned) failed.push("HTF misaligned");
      if (!volExpansion.expanding) failed.push("no volatility expansion");
      if (!volumeIncreased) failed.push("no volume increase");

      reason = `${symbol}: Turtle breakout ${breakout.direction} but ${failed.join(", ")}.`;
    }
    confidence = breakout.brokeOut
      ? Math.round(conditionsMet * 10 + 10)
      : Math.round(conditionsMet * 5);
  }

  return {
    type: "TURTLE_BREAKOUT",
    direction,
    voteStrength,
    confidence,
    signal,
    reason,
    priority: "MEDIUM",
    indicators: {
      breakoutLevel: Math.round(breakout.level * 100) / 100,
      breakoutStrength: Math.round(breakout.strength * 10) / 10,
      volExpansionRatio: Math.round(volExpansion.ratio * 100) / 100,
      volumeRatio: Math.round(volumeRatio * 10) / 10,
      htfAligned: htfAligned ? 1 : 0,
      conditionsMet,
      totalConditions,
    },
    active: signal,
  };
}
