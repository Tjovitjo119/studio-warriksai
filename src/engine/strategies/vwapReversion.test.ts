// ============================================================================
// WARRIKS AI v5.2 — VWAP Institutional Reversion Engine Unit Tests
// Tests: VWAP calculation, rejection candle detection, session extreme
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeVWAPReversion } from "./vwapReversion";
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

describe("VWAP Reversion Engine", () => {
  it("returns NEUTRAL with insufficient data", () => {
    const candles = generateTestCandles(10, "neutral");
    const result = analyzeVWAPReversion(candles, "NAS100");

    expect(result.type).toBe("VWAP_REVERSION");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.signal).toBe(false);
    expect(result.active).toBe(false);
    expect(result.priority).toBe("MEDIUM");
  });

  it("returns valid result with sufficient bullish data", () => {
    const candles = generateTestCandles(80, "bullish");
    const result = analyzeVWAPReversion(candles, "NAS100");

    expect(result.type).toBe("VWAP_REVERSION");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(typeof result.signal).toBe("boolean");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("has all required indicator keys", () => {
    const candles = generateTestCandles(60, "neutral");
    const result = analyzeVWAPReversion(candles, "NAS100");

    expect(result.indicators).toHaveProperty("vwap");
    expect(result.indicators).toHaveProperty("vwapDeviation");
    expect(result.indicators).toHaveProperty("volumeRatio");
    expect(result.indicators).toHaveProperty("rejectionWick");
    expect(result.indicators).toHaveProperty("atExtreme");
    expect(result.indicators).toHaveProperty("extremeType");
    expect(result.indicators).toHaveProperty("conditionsMet");
    expect(result.indicators).toHaveProperty("totalConditions");
    expect(result.indicators.totalConditions).toBe(4);
  });

  it("handles empty candle array gracefully", () => {
    const result = analyzeVWAPReversion([], "EURUSD");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.signal).toBe(false);
  });

  it("returns NEUTRAL for extremely little data", () => {
    const result = analyzeVWAPReversion(generateTestCandles(3, "bullish"), "EURUSD");
    expect(result.direction).toBe("NEUTRAL");
  });
});
