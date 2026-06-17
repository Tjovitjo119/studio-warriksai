// ============================================================================
// WARRIKS AI v5.2 — Daily Range Expansion Engine Unit Tests
// Tests: premium/discount detection, pullback detection, continuation
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeDailyRangeExpansion } from "./dailyRangeExpansion";
import { analyzeMarketStructure } from "../marketStructure";
import type { Candle } from "../types";

function generateTestCandles(count: number, bias: "bullish" | "bearish" | "neutral" = "neutral"): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let price = 100;
  for (let i = count; i > 0; i--) {
    const open = price;
    let drift: number;
    switch (bias) {
      case "bullish": drift = (Math.random() - 0.35) * 2; break;
      case "bearish": drift = (Math.random() - 0.65) * 2; break;
      default: drift = (Math.random() - 0.5) * 2;
    }
    const close = open + drift;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    candles.push({ timestamp: now - i * 60000, open, high, low, close, volume: Math.floor(Math.random() * 1000 + 100) });
    price = close;
  }
  return candles;
}

describe("Daily Range Expansion Engine", () => {
  it("returns NEUTRAL with insufficient data", () => {
    const candles = generateTestCandles(10, "neutral");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const result = analyzeDailyRangeExpansion(candles, structure, "NAS100");

    expect(result.type).toBe("DAILY_RANGE_EXPANSION");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.signal).toBe(false);
    expect(result.active).toBe(false);
    expect(result.priority).toBe("HIGH");
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateTestCandles(80, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const result = analyzeDailyRangeExpansion(candles, structure, "NAS100");

    expect(result.type).toBe("DAILY_RANGE_EXPANSION");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(typeof result.signal).toBe("boolean");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("has all required indicator keys", () => {
    const candles = generateTestCandles(60, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const result = analyzeDailyRangeExpansion(candles, structure, "NAS100");

    expect(result.indicators).toHaveProperty("dailyBias");
    expect(result.indicators).toHaveProperty("pdZone");
    expect(result.indicators).toHaveProperty("pullbackDepth");
    expect(result.indicators).toHaveProperty("continuationStrength");
    expect(result.indicators).toHaveProperty("conditionsMet");
    expect(result.indicators).toHaveProperty("totalConditions");
    expect(result.indicators.totalConditions).toBe(4);
  });

  it("works with bearish data", () => {
    const candles = generateTestCandles(60, "bearish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const result = analyzeDailyRangeExpansion(candles, structure, "NAS100");

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
  });

  it("handles empty data gracefully", () => {
    const structure = analyzeMarketStructure([], "NAS100");
    const result = analyzeDailyRangeExpansion([], structure, "NAS100");
    expect(result.direction).toBe("NEUTRAL");
  });
});
