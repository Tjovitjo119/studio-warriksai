// ============================================================================
// WARRIKS AI v5.2 — Strategy Engine 3: VWAP Institutional Reversion
// Purpose: Capture mean reversion after institutional overextension
// Vote Strengths: Bullish, Bearish, Neutral
// Priority: Medium
// ============================================================================
//
// Best Formation Times:
//   09:30 – 11:30 NY Time
//   13:00 – 15:00 NY Time
//
// Requirements:
//   1. Strong displacement away from VWAP
//   2. Volume spike
//   3. Session extreme
//   4. Rejection candle
// ============================================================================

import type {
  Candle,
  StrategyEngineResult,
  VWAPResult,
} from "../types";
import { calculateAllIndicators } from "../indicators";

/**
 * Calculate VWAP (Volume-Weighted Average Price) from candles.
 */
function calculateVWAP(candles: Candle[]): VWAPResult {
  if (candles.length === 0) {
    return { current: 0, deviation: 0, above: false };
  }

  let cumulativeTPV = 0; // typical price * volume
  let cumulativeVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
  }

  const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : candles[candles.length - 1].close;
  const lastPrice = candles[candles.length - 1].close;
  const deviation = vwap > 0 ? ((lastPrice - vwap) / vwap) * 100 : 0;

  return {
    current: vwap,
    deviation,
    above: lastPrice > vwap,
  };
}

/**
 * Detect a rejection candle: a candle with a long wick in the opposite direction.
 */
function detectRejectionCandle(
  candles: Candle[],
): { rejected: boolean; direction: "BUY" | "SELL" | "NEUTRAL"; wickRatio: number } {
  if (candles.length < 2) {
    return { rejected: false, direction: "NEUTRAL", wickRatio: 0 };
  }

  const last = candles[candles.length - 1];

  if (last.close > last.open) {
    // Bullish candle — check for upper wick rejection (bearish rejection)
    const body = last.close - last.open;
    const upperWick = last.high - last.close;
    const lowerWick = last.open - last.low;
    const totalRange = last.high - last.low;

    if (totalRange === 0) return { rejected: false, direction: "NEUTRAL", wickRatio: 0 };

    const upperWickRatio = upperWick / totalRange;
    // Long upper wick = rejection to the downside
    if (upperWickRatio > 0.5 && upperWick > body * 0.5) {
      return { rejected: true, direction: "SELL", wickRatio: upperWickRatio };
    }
  } else if (last.close < last.open) {
    // Bearish candle — check for lower wick rejection (bullish rejection)
    const body = last.open - last.close;
    const upperWick = last.high - last.open;
    const lowerWick = last.close - last.low;
    const totalRange = last.high - last.low;

    if (totalRange === 0) return { rejected: false, direction: "NEUTRAL", wickRatio: 0 };

    const lowerWickRatio = lowerWick / totalRange;
    if (lowerWickRatio > 0.5 && lowerWick > body * 0.5) {
      return { rejected: true, direction: "BUY", wickRatio: lowerWickRatio };
    }
  }

  return { rejected: false, direction: "NEUTRAL", wickRatio: 0 };
}

/**
 * Detect if price is at a session extreme (recent high/low).
 */
function detectSessionExtreme(
  candles: Candle[],
): { atExtreme: boolean; type: "HIGH" | "LOW" | "NONE"; distance: number } {
  if (candles.length < 10) {
    return { atExtreme: false, type: "NONE", distance: 0 };
  }

  const lookback = candles.slice(-20);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;

  const high = Math.max(...lookback.map((c) => c.high));
  const low = Math.min(...lookback.map((c) => c.low));
  const range = high - low;

  if (range === 0) return { atExtreme: false, type: "NONE", distance: 0 };

  const distFromHigh = (high - lastPrice) / range;
  const distFromLow = (lastPrice - low) / range;

  if (distFromHigh < 0.05) {
    return { atExtreme: true, type: "HIGH", distance: distFromHigh };
  }
  if (distFromLow < 0.05) {
    return { atExtreme: true, type: "LOW", distance: distFromLow };
  }

  return { atExtreme: false, type: "NONE", distance: Math.min(distFromHigh, distFromLow) };
}

/**
 * VWAP Institutional Reversion Engine.
 *
 * Identifies overextended moves from VWAP with volume confirmation
 * and rejection candles for mean reversion entries.
 */
export function analyzeVWAPReversion(
  candles: Candle[],
  symbol: string,
): StrategyEngineResult {
  if (candles.length < 30) {
    return {
      type: "VWAP_REVERSION",
      direction: "NEUTRAL",
      voteStrength: "NEUTRAL",
      confidence: 0,
      signal: false,
      reason: `${symbol}: Insufficient data for VWAP Reversion analysis`,
      priority: "MEDIUM",
      indicators: {},
      active: false,
    };
  }

  const ind = calculateAllIndicators(candles);
  const vwap = calculateVWAP(candles);
  const rejection = detectRejectionCandle(candles);
  const extreme = detectSessionExtreme(candles);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const volume = lastCandle.volume;

  // Condition 1: Strong displacement away from VWAP (>1.5 std dev or >2% dev)
  const vwapDisplaced = Math.abs(vwap.deviation) > 0.5; // 0.5% deviation

  // Condition 2: Volume spike
  const volumeSpike = ind.volumeAvg > 0 ? volume / ind.volumeAvg : 1;
  const volumeConfirmed = volumeSpike >= 1.4;

  // Condition 3: Session extreme
  const atExtreme = extreme.atExtreme;

  // Condition 4: Rejection candle
  const rejected = rejection.rejected;

  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let voteStrength: "STRONG_BULLISH" | "STRONG_BEARISH" | "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let signal = false;
  let reason = "";

  let conditionsMet = 0;
  const totalConditions = 4;

  // Bullish setup: price below VWAP, at extreme low, rejection up
  if (vwap.deviation < 0 && !vwap.above) {
    if (vwapDisplaced) conditionsMet++;
    if (volumeConfirmed) conditionsMet++;
    if (atExtreme && extreme.type === "LOW") conditionsMet++;
    if (rejected && rejection.direction === "BUY") conditionsMet++;

    if (conditionsMet >= 2) {
      direction = "BUY";
      confidence = 35 + conditionsMet * 12;

      // Bonus for strong rejection
      if (rejection.wickRatio > 0.6) confidence += 8;

      // Bonus for volume spike > 2x
      if (volumeSpike >= 2.0) confidence += 7;

      // Penalty if VWAP deviation is too extreme (risk of trend continuation)
      if (Math.abs(vwap.deviation) > 3.0) confidence -= 5;

      voteStrength = conditionsMet >= 3 ? "BULLISH" : "BULLISH";
      signal = conditionsMet >= 3;
      confidence = Math.min(Math.max(Math.round(confidence), 0), 100);

      reason =
        `${symbol} VWAP REVERSION BUY: ${conditionsMet}/${totalConditions} conditions. ` +
        `VWAP dev ${vwap.deviation.toFixed(2)}%, Volume ${volumeSpike.toFixed(1)}x, ` +
        `Session ${extreme.type === "LOW" ? "low" : "extreme"}, ` +
        `Rejection ${rejection.direction}. Confidence ${confidence}%`;
    }
  }

  // Bearish setup: price above VWAP, at extreme high, rejection down
  if ((vwap.deviation > 0 && vwap.above) || (!direction || direction === "NEUTRAL")) {
    let bearConditions = 0;

    if (vwapDisplaced) bearConditions++;
    if (volumeConfirmed) bearConditions++;
    if (atExtreme && extreme.type === "HIGH") bearConditions++;
    if (rejected && rejection.direction === "SELL") bearConditions++;

    if (bearConditions >= 2 && bearConditions > conditionsMet) {
      direction = "SELL";
      confidence = 35 + bearConditions * 12;

      if (rejection.wickRatio > 0.6) confidence += 8;
      if (volumeSpike >= 2.0) confidence += 7;
      if (Math.abs(vwap.deviation) > 3.0) confidence -= 5;

      voteStrength = bearConditions >= 3 ? "BEARISH" : "BEARISH";
      signal = bearConditions >= 3;
      confidence = Math.min(Math.max(Math.round(confidence), 0), 100);
      conditionsMet = bearConditions;

      reason =
        `${symbol} VWAP REVERSION SELL: ${bearConditions}/${totalConditions} conditions. ` +
        `VWAP dev ${vwap.deviation.toFixed(2)}%, Volume ${volumeSpike.toFixed(1)}x, ` +
        `Session ${extreme.type === "HIGH" ? "high" : "extreme"}, ` +
        `Rejection ${rejection.direction}. Confidence ${confidence}%`;
    }
  }

  if (direction === "NEUTRAL") {
    const failed: string[] = [];
    if (!vwapDisplaced) failed.push("price near VWAP");
    if (!volumeConfirmed) failed.push("no volume spike");
    if (!atExtreme) failed.push("not at session extreme");
    if (!rejected) failed.push("no rejection candle");

    reason = `${symbol}: No VWAP reversion setup. ${failed.join(", ")}. VWAP dev ${vwap.deviation.toFixed(2)}%.`;
    confidence = Math.round(conditionsMet * 8);
  }

  return {
    type: "VWAP_REVERSION",
    direction,
    voteStrength,
    confidence,
    signal,
    reason,
    priority: "MEDIUM",
    indicators: {
      vwap: Math.round(vwap.current * 100) / 100,
      vwapDeviation: Math.round(vwap.deviation * 100) / 100,
      volumeRatio: Math.round(volumeSpike * 10) / 10,
      rejectionWick: Math.round(rejection.wickRatio * 100) / 100,
      atExtreme: atExtreme ? 1 : 0,
      extremeType: extreme.type === "HIGH" ? 1 : extreme.type === "LOW" ? -1 : 0,
      conditionsMet,
      totalConditions,
    },
    active: signal,
  };
}
