// ============================================================================
// WARRIKS AI v5.2 — Strategy Engine 2: Breaker Block Execution
// Purpose: Capture high-probability continuation and reversal entries via breakers
// Vote Strengths: Strong Bullish, Strong Bearish, Neutral
// Priority: Very High
// ============================================================================
//
// Best Formation Times:
//   London Killzone: 07:00 – 10:00 NY Time
//   New York Killzone: 08:30 – 11:30 NY Time
//
// Requirements:
//   1. Liquidity sweep
//   2. MSS confirmation
//   3. Breaker formation
//   4. Retest of breaker
// ============================================================================

import type {
  Candle,
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  StrategyEngineResult,
  PriceZone,
} from "../types";

/**
 * Detect a breaker formation from recent candles.
 * A breaker is an Order Block that has been mitigated and becomes a support/resistance level.
 */
function detectBreakerFormation(
  candles: Candle[],
): { found: boolean; breaker: PriceZone | null; direction: "BUY" | "SELL" | "NEUTRAL" } {
  if (candles.length < 10) {
    return { found: false, breaker: null, direction: "NEUTRAL" };
  }

  const recent = candles.slice(-15);

  for (let i = 3; i < recent.length; i++) {
    const c1 = recent[i - 3]; // prior candle
    const c2 = recent[i - 2]; // breaker candle
    const c3 = recent[i - 1]; // displacement candle
    const c4 = recent[i]; // current candle

    // Bullish Breaker: bearish candle (c2) that gets fully engulfed by bullish move (c3)
    const isBearishCandle = c2.close < c2.open;
    const bullishEngulf = c3.close > c3.open && c3.close > c2.high;
    const retestBullish = c4.low <= c2.high && c4.close > c2.high;

    if (isBearishCandle && bullishEngulf && retestBullish) {
      const breaker: PriceZone = {
        high: Math.max(c2.high, c3.high),
        low: Math.min(c2.low, c3.low),
        midpoint: (c2.high + c2.low) / 2,
      };
      return { found: true, breaker, direction: "BUY" };
    }

    // Bearish Breaker: bullish candle (c2) that gets fully engulfed by bearish move (c3)
    const isBullishCandle = c2.close > c2.open;
    const bearishEngulf = c3.close < c3.open && c3.close < c2.low;
    const retestBearish = c4.high >= c2.low && c4.close < c2.low;

    if (isBullishCandle && bearishEngulf && retestBearish) {
      const breaker: PriceZone = {
        high: Math.max(c2.high, c3.high),
        low: Math.min(c2.low, c3.low),
        midpoint: (c2.high + c2.low) / 2,
      };
      return { found: true, breaker, direction: "SELL" };
    }
  }

  return { found: false, breaker: null, direction: "NEUTRAL" };
}

/**
 * Determine if price is retesting the breaker zone.
 */
function detectRetest(
  candles: Candle[],
  breaker: PriceZone,
): { retesting: boolean; distance: number } {
  if (!breaker) return { retesting: false, distance: Infinity };

  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const breakerMid = breaker.midpoint;

  // Price within 0.5% of breaker midpoint is considered a retest
  const distancePct = Math.abs(lastPrice - breakerMid) / breakerMid;
  return {
    retesting: distancePct < 0.005,
    distance: distancePct,
  };
}

/**
 * Breaker Block Execution Engine.
 *
 * Trades breaker formations after liquidity sweeps with MSS confirmation.
 * Requires: sweep → MSS → breaker formation → retest of breaker.
 */
export function analyzeBreakerBlockExecution(
  candles: Candle[],
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  symbol: string,
): StrategyEngineResult {
  if (candles.length < 20) {
    return {
      type: "BREAKER_BLOCK",
      direction: "NEUTRAL",
      voteStrength: "NEUTRAL",
      confidence: 0,
      signal: false,
      reason: `${symbol}: Insufficient data for Breaker Block analysis`,
      priority: "VERY_HIGH",
      indicators: {},
      active: false,
    };
  }

  // Condition 1: Liquidity sweep
  const sweepDetected = liquidity.liquidityTaken;
  const sweepDirection = liquidity.sweepDirection;

  // Condition 2: MSS confirmation
  const mssDetected = structure.structureState === "BOS" || structure.structureState === "CHOCH";
  const structureDirection = structure.bias;

  // Condition 3: Breaker formation
  const breakerResult = detectBreakerFormation(candles);
  const breakerFormed = breakerResult.found;
  const breakerDirection = breakerResult.direction;

  // Condition 4: Retest of breaker
  const retestResult = breakerResult.breaker
    ? detectRetest(candles, breakerResult.breaker)
    : { retesting: false, distance: Infinity };

  // Count conditions
  let bullishConditions = 0;
  let bearishConditions = 0;
  const totalConditions = 4;

  // Bullish setup
  if (
    sweepDetected &&
    (sweepDirection === "BUY") &&
    mssDetected &&
    structureDirection === "BULLISH" &&
    breakerFormed &&
    (breakerDirection === "BUY")
  ) {
    bullishConditions = 4;
    if (retestResult.retesting) bullishConditions += 1; // bonus
  } else {
    if (sweepDetected && sweepDirection === "BUY") bullishConditions++;
    if (mssDetected && structureDirection === "BULLISH") bullishConditions++;
    if (breakerFormed && breakerDirection === "BUY") bullishConditions++;
    if (retestResult.retesting) bullishConditions++;
  }

  // Bearish setup
  if (
    sweepDetected &&
    (sweepDirection === "SELL") &&
    mssDetected &&
    structureDirection === "BEARISH" &&
    breakerFormed &&
    (breakerDirection === "SELL")
  ) {
    bearishConditions = 4;
    if (retestResult.retesting) bearishConditions += 1;
  } else {
    if (sweepDetected && sweepDirection === "SELL") bearishConditions++;
    if (mssDetected && structureDirection === "BEARISH") bearishConditions++;
    if (breakerFormed && breakerDirection === "SELL") bearishConditions++;
    if (retestResult.retesting) bearishConditions++;
  }

  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let voteStrength: "STRONG_BULLISH" | "STRONG_BEARISH" | "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let signal = false;
  let reason = "";

  if (bullishConditions >= bearishConditions && bullishConditions >= 3) {
    direction = "BUY";
    confidence = 45 + bullishConditions * 10;
    voteStrength = bullishConditions >= totalConditions ? "STRONG_BULLISH" : "BULLISH";
    signal = bullishConditions >= totalConditions;
    confidence = Math.min(Math.round(confidence), 100);

    reason =
      `${symbol} BREAKER BLOCK BUY: ${bullishConditions}/${totalConditions} conditions met. ` +
      `Sweep ${sweepDirection}, ${structure.structureState}, ` +
      `Breaker ${breakerDirection}${retestResult.retesting ? " (retesting)" : ""}. ` +
      `Confidence ${confidence}%`;
  } else if (bearishConditions > bullishConditions && bearishConditions >= 3) {
    direction = "SELL";
    confidence = 45 + bearishConditions * 10;
    voteStrength = bearishConditions >= totalConditions ? "STRONG_BEARISH" : "BEARISH";
    signal = bearishConditions >= totalConditions;
    confidence = Math.min(Math.round(confidence), 100);

    reason =
      `${symbol} BREAKER BLOCK SELL: ${bearishConditions}/${totalConditions} conditions met. ` +
      `Sweep ${sweepDirection}, ${structure.structureState}, ` +
      `Breaker ${breakerDirection}${retestResult.retesting ? " (retesting)" : ""}. ` +
      `Confidence ${confidence}%`;
  } else {
    const failed: string[] = [];
    if (!sweepDetected) failed.push("no liquidity sweep");
    if (!mssDetected) failed.push("no MSS");
    if (!breakerFormed) failed.push("no breaker formation");
    if (breakerFormed && !retestResult.retesting) failed.push("no retest");

    reason = `${symbol}: No Breaker Block setup. ${failed.join(", ")}.`;
    confidence = Math.round(Math.max(bullishConditions, bearishConditions) * 12);
  }

  return {
    type: "BREAKER_BLOCK",
    direction,
    voteStrength,
    confidence,
    signal,
    reason,
    priority: "VERY_HIGH",
    indicators: {
      sweepConfirmed: sweepDetected ? 1 : 0,
      mssConfirmed: mssDetected ? 1 : 0,
      breakerFormed: breakerFormed ? 1 : 0,
      retesting: retestResult.retesting ? 1 : 0,
      conditionsMet: Math.max(bullishConditions, bearishConditions),
      totalConditions,
    },
    active: signal,
  };
}
