// ============================================================================
// WARRIKS AI — Order Flow Engine Unit Tests
// Tests: FVG detection, order blocks, breaker detection, entry models
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeOrderFlow } from "./orderFlow";
import type { Candle } from "./types";

function makeCandle(open: number, high: number, low: number, close: number, timestamp?: number): Candle {
  return { timestamp: timestamp ?? Date.now(), open, high, low, close, volume: 1000 };
}

describe("Order Flow Engine", () => {
  it("returns NONE with insufficient data", () => {
    const candles = Array.from({ length: 10 }, (_, i) =>
      makeCandle(100, 101, 99, 100, Date.now() - i * 60000)
    );
    const result = analyzeOrderFlow(candles, "NEUTRAL", "NAS100");

    expect(result.entryModel).toBe("NONE");
    expect(result.confirmationStatus).toBe(false);
    expect(result.displacement).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = Array.from({ length: 25 }, (_, i) =>
      makeCandle(
        100 + Math.sin(i * 1.5) * 2,
        102 + Math.sin(i * 1.5) * 2.5,
        98 + Math.sin(i * 1.5) * 1.5,
        101 + Math.sin(i * 1.5) * 2,
        Date.now() - i * 60000,
      )
    );
    const result = analyzeOrderFlow(candles, "BUY", "NAS100");

    expect(result.confirmationStatus).toBeDefined();
    expect(typeof result.confirmationStatus).toBe("boolean");
    expect(["FVG", "OB", "BREAKER", "NONE"]).toContain(result.entryModel);
    expect(result.entryZone).toHaveProperty("high");
    expect(result.entryZone).toHaveProperty("low");
    expect(result.entryZone).toHaveProperty("midpoint");
    expect(typeof result.displacement).toBe("boolean");
    expect(typeof result.mitigation).toBe("boolean");
  });

  it("description contains the symbol", () => {
    const candles = Array.from({ length: 25 }, (_, i) =>
      makeCandle(100, 101, 99, 100, Date.now() - i * 60000)
    );
    const result = analyzeOrderFlow(candles, "NEUTRAL", "XAUUSD");
    expect(result.description).toContain("XAUUSD");
  });

  it("handles sell sweep direction", () => {
    const candles = Array.from({ length: 25 }, (_, i) =>
      makeCandle(
        100 + Math.sin(i * 1.5) * 2,
        102 + Math.sin(i * 1.5) * 2.5,
        98 + Math.sin(i * 1.5) * 1.5,
        101 + Math.sin(i * 1.5) * 2,
        Date.now() - i * 60000,
      )
    );
    const result = analyzeOrderFlow(candles, "SELL", "NAS100");

    expect(result).toBeDefined();
    expect(result.entryModel).toBeDefined();
  });

  it("handles empty candle array", () => {
    const result = analyzeOrderFlow([], "NEUTRAL", "EURUSD");
    expect(result.entryModel).toBe("NONE");
    expect(result.confirmationStatus).toBe(false);
  });
});
