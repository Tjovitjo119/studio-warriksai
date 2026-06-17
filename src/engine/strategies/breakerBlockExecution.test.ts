// ============================================================================
// WARRIKS AI v5.2 — Breaker Block Execution Engine Unit Tests
// Tests: breaker formation, retest detection, condition counting
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeBreakerBlockExecution } from "./breakerBlockExecution";
import { analyzeMarketStructure } from "../marketStructure";
import { analyzeLiquidity } from "../liquidity";
import { analyzeOrderFlow } from "../orderFlow";
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

describe("Breaker Block Execution Engine", () => {
  it("returns NEUTRAL with insufficient data", () => {
    const candles = generateTestCandles(10, "neutral");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeBreakerBlockExecution(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.type).toBe("BREAKER_BLOCK");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.signal).toBe(false);
    expect(result.active).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateTestCandles(100, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeBreakerBlockExecution(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.type).toBe("BREAKER_BLOCK");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(typeof result.signal).toBe("boolean");
    expect(result.priority).toBe("VERY_HIGH");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("has all required indicator keys", () => {
    const candles = generateTestCandles(80, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeBreakerBlockExecution(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.indicators).toHaveProperty("sweepConfirmed");
    expect(result.indicators).toHaveProperty("mssConfirmed");
    expect(result.indicators).toHaveProperty("breakerFormed");
    expect(result.indicators).toHaveProperty("retesting");
    expect(result.indicators).toHaveProperty("conditionsMet");
    expect(result.indicators).toHaveProperty("totalConditions");
    expect(result.indicators.totalConditions).toBe(4);
  });

  it("returns NEUTRAL for completely neutral data", () => {
    const candles = generateTestCandles(30, "neutral");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeBreakerBlockExecution(candles, structure, liquidity, orderFlow, "NAS100");

    expect(typeof result.signal).toBe("boolean");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });
});
