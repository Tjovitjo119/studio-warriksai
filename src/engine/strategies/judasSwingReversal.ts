// ============================================================================
// WARRIKS AI v5.2 — Strategy Engine 1: Judas Swing Reversal
// Purpose: Identify institutional stop hunts and session reversals
// Vote Strengths: Strong Bullish, Strong Bearish, Neutral
// Priority: Very High
// ============================================================================
//
// Best Formation Times:
//   07:00 – 10:00 NY Time
//   08:30 – 10:30 NY Time (Highest Probability)
//
// Requirements:
//   1. Asian High or Low established
//   2. Liquidity sweep occurs
//   3. MSS after sweep
//   4. Displacement candle
//   5. Breaker Block or FVG entry
// ============================================================================

import type {
  Candle,
  AsianRange,
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  StrategyEngineResult,
} from "../types";

/**
 * Detect Asian session high/low from the candle data.
 * Asian session: ~18:00–02:00 NY time (overnight).
 * We approximate by taking the first portion of candles as the Asian range.
 */
function detectAsianRange(candles: Candle[]): AsianRange {
  // Use the first ~third of candles to approximate Asian session range
  const asianCount = Math.max(Math.floor(candles.length / 3), 10);
  const asianCandles = candles.slice(0, asianCount);
  const high = Math.max(...asianCandles.map((c) => c.high));
  const low = Math.min(...asianCandles.map((c) => c.low));
  return { high, low, midpoint: (high + low) / 2 };
}

/**
 * Detect a displacement candle: a candle with a large body relative to recent candles.
 */
function detectDisplacementCandle(
  candles: Candle[],
  threshold: number = 1.8,
): { displaced: boolean; direction: "BUY" | "SELL" | "NEUTRAL"; size: number } {
  if (candles.length < 10) {
    return { displaced: false, direction: "NEUTRAL", size: 0 };
  }

  const lastCandle = candles[candles.length - 1];
  const recentCandles = candles.slice(-10, -1);
  const avgBody =
    recentCandles.reduce((sum, c) => {
      const body = Math.abs(c.close - c.open);
      return sum + body;
    }, 0) / recentCandles.length;

  if (avgBody === 0) return { displaced: false, direction: "NEUTRAL", size: 0 };

  const currentBody = Math.abs(lastCandle.close - lastCandle.open);
  const ratio = currentBody / avgBody;
  const direction =
    lastCandle.close > lastCandle.open ? "BUY" : "SELL";

  return {
    displaced: ratio >= threshold,
    direction,
    size: ratio,
  };
}

/**
 * Judas Swing Reversal Engine.
 *
 * Detects institutional stop hunts by looking for:
 * - Asian range established
 * - Price sweeps beyond Asian high/low (liquidity grab)
 * - Market Structure Shift (MSS) confirming reversal
 * - Displacement candle showing conviction
 * - Breaker Block or FVG as entry model
 */
export function analyzeJudasSwingReversal(
  candles: Candle[],
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  symbol: string,
): StrategyEngineResult {
  if (candles.length < 30) {
    return {
      type: "JUDAS_SWING",
      direction: "NEUTRAL",
      voteStrength: "NEUTRAL",
      confidence: 0,
      signal: false,
      reason: `${symbol}: Insufficient data for Judas Swing analysis`,
      priority: "VERY_HIGH",
      indicators: {},
      active: false,
    };
  }

  const asianRange = detectAsianRange(candles);
  const displacement = detectDisplacementCandle(candles);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;

  // Condition 1: Asian range must be established with reasonable width
  const asianWidth = Math.abs(asianRange.high - asianRange.low);
  const asianEstablished = asianWidth > 0 && asianRange.midpoint > 0;

  // Condition 2: Liquidity sweep occurred
  const sweepDetected = liquidity.liquidityTaken;

  // Condition 3: MSS confirmed after sweep
  const mssDetected = structure.structureState === "BOS" || structure.structureState === "CHOCH";

  // Condition 4: Displacement candle
  const displaced = displacement.displaced;

  // Condition 5: Breaker Block or FVG entry
  const hasBreakerOrFvg =
    orderFlow.entryModel === "BREAKER" || orderFlow.entryModel === "FVG";

  // Check if sweep went beyond Asian range
  let asianSweepDetected = false;
  let sweepSide: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";

  if (sweepDetected) {
    // Sell-side sweep (price went above Asian high then reversed)
    if (lastCandle.high > asianRange.high && lastCandle.close < asianRange.high) {
      asianSweepDetected = true;
      sweepSide = "SELL";
    }
    // Buy-side sweep (price went below Asian low then reversed)
    if (lastCandle.low < asianRange.low && lastCandle.close > asianRange.low) {
      asianSweepDetected = true;
      sweepSide = "BUY";
    }

    // Also check via liquidity sweep direction from liquidity engine
    if (!asianSweepDetected) {
      sweepSide = liquidity.sweepDirection;
      // Even if not through asian range, if there's a sweep + MSS, it counts
    }
  }

  // Count how many conditions are met
  let bullishConditions = 0;
  let bearishConditions = 0;
  const totalConditions = 5;

  // Bullish check: sweep down (buy-side sweep), then MSS bullish, displacement up, breaker/FVG
  if (sweepDetected && (sweepSide === "BUY" || liquidity.sweepDirection === "BUY")) {
    bullishConditions++;
    if (mssDetected && structure.bias === "BULLISH") bullishConditions++;
    if (displaced && displacement.direction === "BUY") bullishConditions++;
    if (hasBreakerOrFvg) bullishConditions++;
    if (asianEstablished) bullishConditions++;
  }

  // Bearish check: sweep up (sell-side sweep), then MSS bearish, displacement down, breaker/FVG
  if (sweepDetected && (sweepSide === "SELL" || liquidity.sweepDirection === "SELL")) {
    bearishConditions++;
    if (mssDetected && structure.bias === "BEARISH") bearishConditions++;
    if (displaced && displacement.direction === "SELL") bearishConditions++;
    if (hasBreakerOrFvg) bearishConditions++;
    if (asianEstablished) bearishConditions++;
  }

  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let voteStrength: "STRONG_BULLISH" | "STRONG_BEARISH" | "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let signal = false;
  let reason = "";

  const conditionsMet = Math.max(bullishConditions, bearishConditions);

  if (bullishConditions >= bearishConditions && bullishConditions >= 3) {
    direction = "BUY";
    confidence = 40 + bullishConditions * 12;
    if (bullishConditions >= 5) {
      voteStrength = "STRONG_BULLISH";
      confidence += 10;
    } else {
      voteStrength = "STRONG_BULLISH";
    }
    signal = bullishConditions >= 4;
    confidence = Math.min(Math.round(confidence), 100);

    reason =
      `${symbol} JUDAS SWING BUY: ${bullishConditions}/${totalConditions} conditions met. ` +
      `Asian range [${asianRange.low.toFixed(2)}–${asianRange.high.toFixed(2)}], ` +
      `Sweep ${sweepSide}, ${structure.structureState}, ` +
      `Displacement ${displacement.direction}(${displacement.size.toFixed(1)}x), ` +
      `Entry: ${orderFlow.entryModel}. Confidence ${confidence}%`;
  } else if (bearishConditions > bullishConditions && bearishConditions >= 3) {
    direction = "SELL";
    confidence = 40 + bearishConditions * 12;
    if (bearishConditions >= 5) {
      voteStrength = "STRONG_BEARISH";
      confidence += 10;
    } else {
      voteStrength = "STRONG_BEARISH";
    }
    signal = bearishConditions >= 4;
    confidence = Math.min(Math.round(confidence), 100);

    reason =
      `${symbol} JUDAS SWING SELL: ${bearishConditions}/${totalConditions} conditions met. ` +
      `Asian range [${asianRange.low.toFixed(2)}–${asianRange.high.toFixed(2)}], ` +
      `Sweep ${sweepSide}, ${structure.structureState}, ` +
      `Displacement ${displacement.direction}(${displacement.size.toFixed(1)}x), ` +
      `Entry: ${orderFlow.entryModel}. Confidence ${confidence}%`;
  } else {
    const failed: string[] = [];
    if (!sweepDetected) failed.push("no liquidity sweep");
    if (!mssDetected && sweepDetected) failed.push("no MSS after sweep");
    if (!displaced) failed.push("no displacement");
    if (!hasBreakerOrFvg && mssDetected) failed.push("no Breaker/FVG entry");
    if (!asianEstablished) failed.push("Asian range unclear");

    reason = `${symbol}: No Judas Swing setup. ${failed.join(", ")}.`;
    confidence = Math.round(conditionsMet * 8);
  }

  return {
    type: "JUDAS_SWING",
    direction,
    voteStrength,
    confidence,
    signal,
    reason,
    priority: "VERY_HIGH",
    indicators: {
      asianHigh: Math.round(asianRange.high * 100) / 100,
      asianLow: Math.round(asianRange.low * 100) / 100,
      displacementRatio: Math.round(displacement.size * 10) / 10,
      conditionsMet,
      totalConditions,
      mssConfirmed: mssDetected ? 1 : 0,
      sweepConfirmed: sweepDetected ? 1 : 0,
      breakerOrFvgFound: hasBreakerOrFvg ? 1 : 0,
    },
    active: signal,
  };
}
