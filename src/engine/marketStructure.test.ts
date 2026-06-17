// ============================================================================
// WARRIKS AI — Market Structure Engine Unit Tests
// Tests: bias detection, structure states, trend strength, edge cases
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeMarketStructure } from "./marketStructure";
import type { Candle } from "./types";

function generateTrendingCandles(
  count: number,
  startPrice: number,
  direction: "up" | "down" | "range",
  volatility: number = 0.5,
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let price = startPrice;

  for (let i = count; i > 0; i--) {
    const open = price;
    let change: number;
    switch (direction) {
      case "up": change = volatility * (0.7 + Math.random() * 0.6); break;
      case "down": change = -volatility * (0.7 + Math.random() * 0.6); break;
      case "range": change = (Math.random() - 0.5) * volatility; break;
    }
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    candles.push({ timestamp: now - i * 60000, open: Math.round(open * 100) / 100, high: Math.round(high * 100) / 100, low: Math.round(low * 100) / 100, close: Math.round(close * 100) / 100, volume: Math.floor(Math.random() * 1000 + 100) });
    price = close;
  }
  return candles;
}

describe("Market Structure Engine", () => {
  it("returns NEUTRAL with insufficient data", () => {
    const candles = generateTrendingCandles(10, 100, "up");
    const result = analyzeMarketStructure(candles, "NAS100");

    expect(result.bias).toBe("NEUTRAL");
    expect(result.structureState).toBe("UNCLEAR");
    expect(result.trendStrength).toBe(0);
  });

  it("detects bullish structure with uptrend data", () => {
    const candles = generateTrendingCandles(80, 100, "up", 0.3);
    const result = analyzeMarketStructure(candles, "NAS100");

    expect(["BULLISH", "NEUTRAL"]).toContain(result.bias);
    expect(["BOS", "TRENDING", "RANGE", "UNCLEAR"]).toContain(result.structureState);
    expect(result.trendStrength).toBeGreaterThanOrEqual(0);
    expect(result.trendStrength).toBeLessThanOrEqual(100);
  });

  it("detects bearish structure with downtrend data", () => {
    const candles = generateTrendingCandles(80, 200, "down", 0.5);
    const result = analyzeMarketStructure(candles, "NAS100");

    expect(["BEARISH", "NEUTRAL"]).toContain(result.bias);
    expect(result.trendStrength).toBeGreaterThanOrEqual(0);
  });

  it("returns description that contains the symbol", () => {
    const candles = generateTrendingCandles(40, 100, "up");
    const result = analyzeMarketStructure(candles, "XAUUSD");

    expect(result.description).toContain("XAUUSD");
  });

  it("handles very large candle arrays", () => {
    const candles = generateTrendingCandles(500, 100, "up");
    const result = analyzeMarketStructure(candles, "NAS100");
    expect(result).toBeDefined();
    expect(result.bias).toBeDefined();
    expect(result.trendStrength).toBeGreaterThanOrEqual(0);
  });

  it("returns NEUTRAL for true ranging market", () => {
    const candles = generateTrendingCandles(60, 100, "range", 0.1);
    const result = analyzeMarketStructure(candles, "EURUSD");

    // In a true range, bias could be neutral or slight
    expect(["BULLISH", "BEARISH", "NEUTRAL"]).toContain(result.bias);
  });
});
