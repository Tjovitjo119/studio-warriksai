// ============================================================================
// WARRIKS AI v5.2 — Strategy Engine 4: Daily Range Expansion
// Purpose: Capture continuation moves after daily direction is established
// Vote Strengths: Bullish, Bearish, Neutral
// Priority: High
// ============================================================================
//
// Best Formation Times:
//   08:30 – 12:00 NY Time
//   13:00 – 15:00 NY Time
//
// Requirements:
//   1. Daily Bias confirmed
//   2. Premium/Discount alignment
//   3. Pullback into structure
//   4. Continuation confirmation
// ============================================================================

import type {
  Candle,
  MarketStructureResult,
  StrategyEngineResult,
} from "../types";

/**
 * Determine if price is in premium (above midpoint) or discount (below midpoint).
 */
function getPremiumDiscount(
  candles: Candle[],
): { zone: "PREMIUM" | "DISCOUNT" | "NEUTRAL"; midpoint: number; price: number } {
  if (candles.length < 5) {
    return { zone: "NEUTRAL", midpoint: 0, price: 0 };
  }

  const range = candles.slice(-24); // approximate daily candles
  const high = Math.max(...range.map((c) => c.high));
  const low = Math.min(...range.map((c) => c.low));
  const midpoint = (high + low) / 2;
  const lastPrice = candles[candles.length - 1].close;

  const zone = lastPrice > midpoint ? "PREMIUM" : lastPrice < midpoint ? "DISCOUNT" : "NEUTRAL";

  return { zone, midpoint, price: lastPrice };
}

/**
 * Detect a pullback into a structure level.
 * Check if price has pulled back from a recent extreme toward an EMA or midpoint.
 */
function detectPullback(
  candles: Candle[],
  prevCandles: Candle[],
): { pullingBack: boolean; intoValue: boolean; depth: number } {
  if (candles.length < 10) {
    return { pullingBack: false, intoValue: false, depth: 0 };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const lookback = candles.slice(-10, -2);

  if (lookback.length < 3) return { pullingBack: false, intoValue: false, depth: 0 };

  // Check if recent move was directional
  const recentHigh = Math.max(...lookback.map((c) => c.high));
  const recentLow = Math.min(...lookback.map((c) => c.low));
  const prevHigh = Math.max(...prevCandles.slice(-20).map((c) => c.high));
  const prevLow = Math.min(...prevCandles.slice(-20).map((c) => c.low));

  const recentRange = recentHigh - recentLow;
  if (recentRange === 0) return { pullingBack: false, intoValue: false, depth: 0 };

  // Bullish pullback: was going up, now pulling back toward structure
  const bullishPullback =
    prev.close > prev.close - 1 * Math.abs(prev.close - candles[Math.max(candles.length - 5, 0)]?.close || 0) &&
    last.close < prev.close &&
    last.close > (recentLow + recentRange * 0.382); // fib retracement zone

  // Bearish pullback: was going down, now pulling back up
  const bearishPullback =
    prev.close < prev.close + 1 * Math.abs(prev.close - candles[Math.max(candles.length - 5, 0)]?.close || 0) &&
    last.close > prev.close &&
    last.close < (recentHigh - recentRange * 0.382);

  return {
    pullingBack: bullishPullback || bearishPullback,
    intoValue: true, // simplistically, any pullback into structure
    depth: Math.abs(last.close - prev.close) / (recentRange || 1),
  };
}

/**
 * Confirm continuation: the current candle moves back in the direction of the bias.
 */
function detectContinuation(
  candles: Candle[],
  bias: "BULLISH" | "BEARISH" | "NEUTRAL",
): { confirmed: boolean; strength: number } {
  if (candles.length < 3) {
    return { confirmed: false, strength: 0 };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  if (bias === "BULLISH") {
    const bullishContinuation = last.close > last.open && last.close > prev.close;
    return {
      confirmed: bullishContinuation,
      strength: bullishContinuation
        ? Math.min((last.close - prev.close) / (prev.close || 1) * 100, 100)
        : 0,
    };
  }

  if (bias === "BEARISH") {
    const bearishContinuation = last.close < last.open && last.close < prev.close;
    return {
      confirmed: bearishContinuation,
      strength: bearishContinuation
        ? Math.min((prev.close - last.close) / (prev.close || 1) * 100, 100)
        : 0,
    };
  }

  return { confirmed: false, strength: 0 };
}

/**
 * Daily Range Expansion Engine.
 *
 * Trades continuations after the daily direction is established.
 * Requires: daily bias, premium/discount alignment, pullback, continuation confirmation.
 */
export function analyzeDailyRangeExpansion(
  candles: Candle[],
  structure: MarketStructureResult,
  symbol: string,
): StrategyEngineResult {
  if (candles.length < 30) {
    return {
      type: "DAILY_RANGE_EXPANSION",
      direction: "NEUTRAL",
      voteStrength: "NEUTRAL",
      confidence: 0,
      signal: false,
      reason: `${symbol}: Insufficient data for Daily Range Expansion analysis`,
      priority: "HIGH",
      indicators: {},
      active: false,
    };
  }

  // Condition 1: Daily bias confirmed from structure
  const dailyBias = structure.bias;
  const biasConfirmed = dailyBias !== "NEUTRAL";

  // Condition 2: Premium/Discount alignment
  const pd = getPremiumDiscount(candles);
  const pdAligned =
    (dailyBias === "BULLISH" && pd.zone === "DISCOUNT") ||
    (dailyBias === "BEARISH" && pd.zone === "PREMIUM");

  // Condition 3: Pullback into structure
  const prevCandles = candles.slice(0, -10);
  const pullback = prevCandles.length > 5
    ? detectPullback(candles, prevCandles)
    : { pullingBack: false, intoValue: false, depth: 0 };

  // Condition 4: Continuation confirmation
  const continuation = detectContinuation(candles, dailyBias);

  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let voteStrength: "STRONG_BULLISH" | "STRONG_BEARISH" | "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let signal = false;
  let reason = "";

  const totalConditions = 4;
  let conditionsMet = 0;

  if (biasConfirmed) conditionsMet++;
  if (pdAligned) conditionsMet++;
  if (pullback.pullingBack) conditionsMet++;
  if (continuation.confirmed) conditionsMet++;

  if (biasConfirmed && conditionsMet >= 2) {
    direction = dailyBias === "BULLISH" ? "BUY" : "SELL";
    confidence = 30 + conditionsMet * 12;

    // Continuation strength bonus
    if (continuation.strength > 0.5) confidence += 8;

    // Premium/discount alignment bonus
    if (pdAligned) confidence += 5;

    // Pullback depth bonus (shallow pullbacks are better)
    if (pullback.pullingBack && pullback.depth < 0.5) confidence += 5;

    voteStrength = conditionsMet >= 3 ? "BULLISH" : "BULLISH";
    if (conditionsMet >= totalConditions) {
      voteStrength = dailyBias === "BULLISH" ? "STRONG_BULLISH" : "STRONG_BEARISH";
    }
    signal = conditionsMet >= 3;
    confidence = Math.min(Math.max(Math.round(confidence), 0), 100);

    reason =
      `${symbol} DAILY RANGE ${direction}: ${conditionsMet}/${totalConditions} conditions. ` +
      `Bias ${dailyBias}, PD ${pd.zone}, ` +
      `Pullback ${pullback.pullingBack ? "yes" : "no"}, ` +
      `Continuation ${continuation.confirmed ? "yes" : "no"}. Confidence ${confidence}%`;
  } else {
    const failed: string[] = [];
    if (!biasConfirmed) failed.push("no daily bias");
    if (!pdAligned) failed.push("premium/discount misaligned");
    if (!pullback.pullingBack) failed.push("no pullback");
    if (!continuation.confirmed) failed.push("no continuation");

    reason = `${symbol}: No Daily Range Expansion setup. ${failed.join(", ")}.`;
    confidence = Math.round(conditionsMet * 8);
  }

  return {
    type: "DAILY_RANGE_EXPANSION",
    direction,
    voteStrength,
    confidence,
    signal,
    reason,
    priority: "HIGH",
    indicators: {
      dailyBias: dailyBias === "BULLISH" ? 1 : dailyBias === "BEARISH" ? -1 : 0,
      pdZone: pd.zone === "PREMIUM" ? 1 : pd.zone === "DISCOUNT" ? -1 : 0,
      pullbackDepth: Math.round(pullback.depth * 100) / 100,
      continuationStrength: Math.round(continuation.strength * 100) / 100,
      conditionsMet,
      totalConditions,
    },
    active: signal,
  };
}
