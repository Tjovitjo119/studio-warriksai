// ============================================================================
// WARRIKS AI v5.1 — Market Structure Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeMarketStructure } from "../marketStructure";
import { generateCandles } from "../marketData";

describe("analyzeMarketStructure", () => {
  it("returns UNCLEAR for insufficient data", () => {
    const candles = generateCandles("NAS100", 10);
    const result = analyzeMarketStructure(candles, "NAS100");
    expect(result.bias).toBe("NEUTRAL");
    expect(result.structureState).toBe("UNCLEAR");
    expect(result.trendStrength).toBe(0);
  });

  it("returns valid structure with sufficient data", () => {
    const candles = generateCandles("NAS100", 50);
    const result = analyzeMarketStructure(candles, "NAS100");
    expect(["BULLISH", "BEARISH", "NEUTRAL"]).toContain(result.bias);
    expect(["BOS", "CHOCH", "RANGE", "TRENDING", "UNCLEAR"]).toContain(result.structureState);
    expect(result.trendStrength).toBeGreaterThanOrEqual(0);
    expect(result.trendStrength).toBeLessThanOrEqual(100);
  });

  it("returns a description string", () => {
    const candles = generateCandles("EURUSD", 50);
    const result = analyzeMarketStructure(candles, "EURUSD");
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.description).toContain("EURUSD");
  });

  it("trend strength is between 0 and 100", () => {
    const candles = generateCandles("NAS100", 60);
    const result = analyzeMarketStructure(candles, "NAS100");
    expect(result.trendStrength).toBeGreaterThanOrEqual(0);
    expect(result.trendStrength).toBeLessThanOrEqual(100);
  });

  it("handles XAUUSD symbol", () => {
    const candles = generateCandles("XAUUSD", 50);
    const result = analyzeMarketStructure(candles, "XAUUSD");
    expect(result.description).toContain("XAUUSD");
  });

  it("handles GBPUSD symbol", () => {
    const candles = generateCandles("GBPUSD", 50);
    const result = analyzeMarketStructure(candles, "GBPUSD");
    expect(result.description).toContain("GBPUSD");
  });
});
