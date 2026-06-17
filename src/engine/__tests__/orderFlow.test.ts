// ============================================================================
// WARRIKS AI v5.1 — Order Flow Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeOrderFlow } from "../orderFlow";
import { generateCandles } from "../marketData";

describe("analyzeOrderFlow", () => {
  it("returns NONE for insufficient data", () => {
    const candles = generateCandles("NAS100", 5);
    const result = analyzeOrderFlow(candles, "BUY", "NAS100");
    expect(result.entryModel).toBe("NONE");
    expect(result.confirmationStatus).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateCandles("NAS100", 50);
    const result = analyzeOrderFlow(candles, "BUY", "NAS100");
    expect(["NONE", "FVG", "OB", "BREAKER"]).toContain(result.entryModel);
    expect(typeof result.confirmationStatus).toBe("boolean");
    expect(typeof result.displacement).toBe("boolean");
    expect(typeof result.mitigation).toBe("boolean");
  });

  it("returns valid entry zone when model detected", () => {
    // Run multiple samples to increase chance of hitting a detection
    for (let i = 0; i < 5; i++) {
      const candles = generateCandles("NAS100", 60);
      const result = analyzeOrderFlow(candles, "BUY", "NAS100");
      if (result.entryModel !== "NONE") {
        expect(result.entryZone.high).toBeGreaterThan(0);
        expect(result.entryZone.low).toBeGreaterThan(0);
        expect(result.entryZone.midpoint).toBeGreaterThan(0);
        expect(result.entryZone.high).toBeGreaterThanOrEqual(result.entryZone.low);
        break;
      }
    }
  });

  it("handles SELL sweep direction", () => {
    const candles = generateCandles("XAUUSD", 50);
    const result = analyzeOrderFlow(candles, "SELL", "XAUUSD");
    expect(["NONE", "FVG", "OB", "BREAKER"]).toContain(result.entryModel);
  });

  it("handles NEUTRAL sweep direction (no sweep)", () => {
    const candles = generateCandles("EURUSD", 50);
    const result = analyzeOrderFlow(candles, "NEUTRAL", "EURUSD");
    expect(result.entryModel).toBe("NONE");
    expect(result.confirmationStatus).toBe(false);
  });

  it("returns a description string", () => {
    const candles = generateCandles("GBPUSD", 50);
    const result = analyzeOrderFlow(candles, "BUY", "GBPUSD");
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
  });
});
