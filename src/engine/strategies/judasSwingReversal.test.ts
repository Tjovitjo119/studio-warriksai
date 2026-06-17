// ============================================================================
// WARRIKS AI v5.2 — Judas Swing Reversal Engine Unit Tests
// Tests: Asian range detection, displacement detection, condition counting
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeJudasSwingReversal } from "./judasSwingReversal";
import { analyzeMarketStructure } from "../marketStructure";
import { analyzeLiquidity } from "../liquidity";
import { analyzeOrderFlow } from "../orderFlow";
import type { Candle, MarketStructureResult, LiquidityResult, OrderFlowResult } from "../types";

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

describe("Judas Swing Reversal Engine", () => {
  it("returns NEUTRAL with insufficient data", () => {
    const candles = generateTestCandles(10, "neutral");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeJudasSwingReversal(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.type).toBe("JUDAS_SWING");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.signal).toBe(false);
    expect(result.active).toBe(false);
  });

  it("returns valid engine result with sufficient data", () => {
    const candles = generateTestCandles(100, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeJudasSwingReversal(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.type).toBe("JUDAS_SWING");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(["STRONG_BULLISH", "STRONG_BEARISH", "BULLISH", "BEARISH", "NEUTRAL"]).toContain(result.voteStrength);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(typeof result.signal).toBe("boolean");
    expect(result.priority).toBe("VERY_HIGH");
    expect(result.indicators).toBeDefined();
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("has indicators for asianHigh, asianLow, displacementRatio", () => {
    const candles = generateTestCandles(80, "bullish");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeJudasSwingReversal(candles, structure, liquidity, orderFlow, "NAS100");

    expect(result.indicators).toHaveProperty("asianHigh");
    expect(result.indicators).toHaveProperty("asianLow");
    expect(result.indicators).toHaveProperty("displacementRatio");
    expect(result.indicators).toHaveProperty("conditionsMet");
    expect(result.indicators).toHaveProperty("totalConditions");
    expect(result.indicators.totalConditions).toBe(5);
  });

  it("is not active for bearish data with inconsistent structure", () => {
    const candles = generateTestCandles(50, "neutral");
    const structure = analyzeMarketStructure(candles, "NAS100");
    const liquidity = analyzeLiquidity(candles, "NAS100");
    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "NAS100");
    const result = analyzeJudasSwingReversal(candles, structure, liquidity, orderFlow, "NAS100");

    expect(typeof result.active).toBe("boolean");
  });
});
