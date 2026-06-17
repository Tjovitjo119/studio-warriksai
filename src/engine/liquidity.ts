// ============================================================================
// WARRIKS AI v5.1 — Liquidity Engine (15M / 5M)
// Purpose: Detect liquidity pools, stop hunts, and sweep activity
// ============================================================================

import type { Candle, Direction, LiquidityPool, LiquidityResult } from "./types";

/**
 * Analyze liquidity conditions using candlestick data.
 * Detects equal highs/lows, session ranges, and sweep events.
 */
export function analyzeLiquidity(
  candles: Candle[],
  symbol: string,
): LiquidityResult {
  if (candles.length < 30) {
    return {
      sweepDirection: "NEUTRAL",
      liquidityTaken: false,
      strength: 0,
      pools: [],
      description: "Insufficient data for liquidity analysis",
    };
  }

  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const pools: LiquidityPool[] = [];

  // Detect equal highs/lows (liquidity pools)
  const recentCandles = sorted.slice(-25);
  const equalHighs = findEqualHighs(recentCandles);
  const equalLows = findEqualLows(recentCandles);

  for (const price of equalHighs) {
    pools.push({ type: "EQUAL_HIGH", price, taken: false });
  }
  for (const price of equalLows) {
    pools.push({ type: "EQUAL_LOW", price, taken: false });
  }

  // Session-based pools (high/low of recent range)
  const sessionHigh = Math.max(...recentCandles.map((c) => c.high));
  const sessionLow = Math.min(...recentCandles.map((c) => c.low));

  pools.push({ type: "SESSION_HIGH", price: sessionHigh, taken: false });
  pools.push({ type: "SESSION_LOW", price: sessionLow, taken: false });

  // Check for sweeps — price breaking beyond a pool and reversing
  const lastCandle = sorted[sorted.length - 1];
  const prevCandle = sorted[sorted.length - 2];
  const lookback = sorted.slice(-15, -1);

  let sweepDirection: Direction = "NEUTRAL";
  let liquidityTaken = false;

  // Sweep up: price spikes above recent highs then closes back within range
  const recentHigh = Math.max(...lookback.map((c) => c.high));
  const recentLow = Math.min(...lookback.map((c) => c.low));

  if (lastCandle.high > recentHigh && lastCandle.close < recentHigh) {
    sweepDirection = "SELL";
    liquidityTaken = true;
    const highPool = pools.find((p) => p.type === "SESSION_HIGH" && p.price >= recentHigh);
    if (highPool) highPool.taken = true;
  }

  // Sweep down: price spikes below recent lows then closes back within range
  if (lastCandle.low < recentLow && lastCandle.close > recentLow) {
    sweepDirection = "BUY";
    liquidityTaken = true;
    const lowPool = pools.find((p) => p.type === "SESSION_LOW" && p.price <= recentLow);
    if (lowPool) lowPool.taken = true;
  }

  // Also check for sweep of equal highs/lows
  for (const pool of pools) {
    if (pool.type === "EQUAL_HIGH" && !pool.taken) {
      if (lastCandle.high > pool.price * 1.001 && lastCandle.close < pool.price) {
        pool.taken = true;
        liquidityTaken = true;
        sweepDirection = "SELL";
      }
    }
    if (pool.type === "EQUAL_LOW" && !pool.taken) {
      if (lastCandle.low < pool.price * 0.999 && lastCandle.close > pool.price) {
        pool.taken = true;
        liquidityTaken = true;
        sweepDirection = "BUY";
      }
    }
  }

  // Strength score (0–100)
  const strength = calculateLiquidityStrength(
    liquidityTaken,
    pools,
    lastCandle,
    prevCandle,
    recentCandles,
  );

  return {
    sweepDirection,
    liquidityTaken,
    strength,
    pools,
    description: buildLiquidityDescription(sweepDirection, liquidityTaken, strength, symbol),
  };
}

function findEqualHighs(candles: Candle[]): number[] {
  const highs = candles.map((c) => Math.round(c.high * 100) / 100);
  const equalHighs: number[] = [];
  const frequency = new Map<number, number>();

  for (const h of highs) {
    frequency.set(h, (frequency.get(h) || 0) + 1);
  }

  for (const [price, count] of frequency) {
    if (count >= 3) equalHighs.push(price);
  }

  return equalHighs;
}

function findEqualLows(candles: Candle[]): number[] {
  const lows = candles.map((c) => Math.round(c.low * 100) / 100);
  const equalLows: number[] = [];
  const frequency = new Map<number, number>();

  for (const l of lows) {
    frequency.set(l, (frequency.get(l) || 0) + 1);
  }

  for (const [price, count] of frequency) {
    if (count >= 3) equalLows.push(price);
  }

  return equalLows;
}

function calculateLiquidityStrength(
  liquidityTaken: boolean,
  pools: LiquidityPool[],
  lastCandle: Candle,
  prevCandle: Candle,
  recentCandles: Candle[],
): number {
  if (!liquidityTaken) return 0;

  const takenCount = pools.filter((p) => p.taken).length;
  const totalCount = pools.length;
  const coverage = takenCount / Math.max(totalCount, 1);

  // Sweep magnitude
  const range = Math.max(...recentCandles.map((c) => c.high)) -
    Math.min(...recentCandles.map((c) => c.low));
  const moveSize = Math.abs(lastCandle.close - prevCandle.close);
  const magnitude = range > 0 ? Math.min(moveSize / range, 1) : 0.5;

  return Math.round((coverage * 50 + magnitude * 50));
}

function buildLiquidityDescription(
  direction: Direction,
  taken: boolean,
  strength: number,
  symbol: string,
): string {
  if (!taken) return `${symbol}: No liquidity sweep detected`;
  return `${symbol}: ${direction} liquidity sweep, strength ${strength}/100`;
}
