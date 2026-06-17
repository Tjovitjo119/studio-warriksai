// ============================================================================
// WARRIKS AI — Liquidity Engine Unit Tests
// Tests: sweep detection, pool identification, strength calculation
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeLiquidity } from "./liquidity";
import type { Candle } from "./types";

function makeCandle(high: number, low: number, open: number, close: number, timestamp?: number): Candle {
  return { timestamp: timestamp ?? Date.now(), open, high, low, close, volume: 1000 };
}

function generateSweepCandles(upSweep: boolean): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  // First 25 candles create a range
  for (let i = 25; i > 0; i--) {
    const basePrice = upSweep ? 95 : 105;
    const noise = (Math.random() - 0.5) * 2;
    candles.push(makeCandle(
      basePrice + 5 + Math.abs(noise),
      basePrice - 5 - Math.abs(noise),
      basePrice + noise,
      basePrice + noise * 0.8,
      now - i * 60000,
    ));
  }
  // Last 5 candles: the sweep and reversal
  for (let i = 5; i > 0; i--) {
    if (upSweep) {
      // Sweep up: break above range, then close back within
      if (i > 2) {
        candles.push(makeCandle(115, 96, 105, 98, now - i * 60000));
      } else {
        candles.push(makeCandle(108, 100, 102, 105, now - i * 60000));
      }
    } else {
      // Sweep down: break below range, then close back within
      if (i > 2) {
        candles.push(makeCandle(106, 85, 100, 98, now - i * 60000));
      } else {
        candles.push(makeCandle(102, 95, 98, 100, now - i * 60000));
      }
    }
  }
  return candles;
}

describe("Liquidity Engine", () => {
  it("returns no sweep with insufficient data", () => {
    const candles = Array.from({ length: 10 }, (_, i) =>
      makeCandle(100 + i, 95 + i, 98 + i, 99 + i, Date.now() - i * 60000)
    );
    const result = analyzeLiquidity(candles, "NAS100");

    expect(result.liquidityTaken).toBe(false);
    expect(result.sweepDirection).toBe("NEUTRAL");
    expect(result.strength).toBe(0);
    expect(result.pools.length).toBe(0);
  });

  it("detects liquidity pools in the data", () => {
    const candles = Array.from({ length: 35 }, (_, i) => {
      // Create some equal highs and lows
      const highBase = i < 15 ? 105 : 102;
      const lowBase = i < 15 ? 95 : 98;
      return makeCandle(highBase, lowBase, (highBase + lowBase) / 2, (highBase + lowBase) / 2, Date.now() - i * 60000);
    });
    const result = analyzeLiquidity(candles, "NAS100");

    expect(result.pools.length).toBeGreaterThanOrEqual(2);
    expect(result.pools[0]).toHaveProperty("type");
    expect(result.pools[0]).toHaveProperty("price");
    expect(result.pools[0]).toHaveProperty("taken");
  });

  it("returns valid strength value", () => {
    const candles = generateSweepCandles(true);
    const result = analyzeLiquidity(candles, "NAS100");

    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(100);
  });

  it("description contains the symbol", () => {
    const candles = Array.from({ length: 35 }, (_, i) =>
      makeCandle(101, 99, 100, 100, Date.now() - i * 60000)
    );
    const result = analyzeLiquidity(candles, "XAUUSD");

    expect(result.description).toContain("XAUUSD");
  });

  it("handles empty candle array gracefully", () => {
    const result = analyzeLiquidity([], "EURUSD");
    expect(result.liquidityTaken).toBe(false);
    expect(result.sweepDirection).toBe("NEUTRAL");
    expect(result.description).toBe("Insufficient data for liquidity analysis");
  });
});
