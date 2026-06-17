// ============================================================================
// WARRIKS AI v5.1 — Liquidity Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeLiquidity } from "../liquidity";
import { generateCandles } from "../marketData";

describe("analyzeLiquidity", () => {
  it("returns safe fallback for insufficient data", () => {
    const candles = generateCandles("NAS100", 10);
    const result = analyzeLiquidity(candles, "NAS100");
    expect(result.sweepDirection).toBe("NEUTRAL");
    expect(result.liquidityTaken).toBe(false);
    expect(result.strength).toBe(0);
    expect(result.pools).toEqual([]);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateCandles("NAS100", 50);
    const result = analyzeLiquidity(candles, "NAS100");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.sweepDirection);
    expect(typeof result.liquidityTaken).toBe("boolean");
    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(100);
  });

  it("detects liquidity pools", () => {
    const candles = generateCandles("NAS100", 50);
    const result = analyzeLiquidity(candles, "NAS100");
    expect(result.pools.length).toBeGreaterThanOrEqual(2); // At least SESSION_HIGH + SESSION_LOW
    expect(result.pools.some((p) => p.type === "SESSION_HIGH")).toBe(true);
    expect(result.pools.some((p) => p.type === "SESSION_LOW")).toBe(true);
  });

  it("returns a description string", () => {
    const candles = generateCandles("EURUSD", 50);
    const result = analyzeLiquidity(candles, "EURUSD");
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("handles different symbols", () => {
    const candles1 = generateCandles("XAUUSD", 50);
    const candles2 = generateCandles("GBPUSD", 50);

    const result1 = analyzeLiquidity(candles1, "XAUUSD");
    const result2 = analyzeLiquidity(candles2, "GBPUSD");

    expect(result1.description).toContain("XAUUSD");
    expect(result2.description).toContain("GBPUSD");
  });
});
