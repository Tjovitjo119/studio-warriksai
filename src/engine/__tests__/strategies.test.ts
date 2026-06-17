// ============================================================================
// WARRIKS AI v5.1 — Multi-Strategy Engine Unit Tests
// Tests: Momentum, Mean Reversion, Breakout, and Multi-Strategy orchestrator
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeMomentum } from "../strategies/momentum";
import { analyzeMeanReversion } from "../strategies/meanReversion";
import { analyzeBreakout } from "../strategies/breakout";
import { runMultiStrategy, getStrategySummary } from "../strategies";
import { generateCandles } from "../marketData";
import type { Candle } from "../types";

// ============================================================================
// Momentum Strategy Tests
// ============================================================================
describe("analyzeMomentum", () => {
  it("returns neutral with insufficient data", () => {
    const candles = generateCandles("NAS100", 20);
    const result = analyzeMomentum(candles, "NAS100");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.confidence).toBe(0);
    expect(result.active).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateCandles("NAS100", 60);
    const result = analyzeMomentum(candles, "NAS100");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(typeof result.reason).toBe("string");
    expect(result.type).toBe("MOMENTUM");
  });

  it("returns indicator values", () => {
    const candles = generateCandles("NAS100", 60);
    const result = analyzeMomentum(candles, "NAS100");
    expect(result.indicators).toHaveProperty("adx");
    expect(result.indicators).toHaveProperty("macdHistogram");
    expect(result.indicators).toHaveProperty("ema9");
    expect(result.indicators).toHaveProperty("ema21");
  });

  it("handles all symbols", () => {
    for (const symbol of ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"]) {
      const candles = generateCandles(symbol, 60);
      const result = analyzeMomentum(candles, symbol);
      expect(result.reason).toContain(symbol);
    }
  });
});

// ============================================================================
// Mean Reversion Strategy Tests
// ============================================================================
describe("analyzeMeanReversion", () => {
  it("returns neutral with insufficient data", () => {
    const candles = generateCandles("NAS100", 10);
    const result = analyzeMeanReversion(candles, "NAS100");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.confidence).toBe(0);
    expect(result.active).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateCandles("XAUUSD", 50);
    const result = analyzeMeanReversion(candles, "XAUUSD");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.type).toBe("MEAN_REVERSION");
  });

  it("returns indicator values", () => {
    const candles = generateCandles("EURUSD", 50);
    const result = analyzeMeanReversion(candles, "EURUSD");
    expect(result.indicators).toHaveProperty("rsi");
    expect(result.indicators).toHaveProperty("zscore");
    expect(result.indicators).toHaveProperty("bollingerUpper");
    expect(result.indicators).toHaveProperty("bollingerLower");
  });

  it("reason mentions the symbol", () => {
    const candles = generateCandles("GBPUSD", 50);
    const result = analyzeMeanReversion(candles, "GBPUSD");
    expect(result.reason).toContain("GBPUSD");
  });
});

// ============================================================================
// Breakout Strategy Tests
// ============================================================================
describe("analyzeBreakout", () => {
  it("returns neutral with insufficient data", () => {
    const candles = generateCandles("NAS100", 10);
    const result = analyzeBreakout(candles, "NAS100");
    expect(result.direction).toBe("NEUTRAL");
    expect(result.confidence).toBe(0);
    expect(result.active).toBe(false);
  });

  it("returns valid result with sufficient data", () => {
    const candles = generateCandles("XAUUSD", 50);
    const result = analyzeBreakout(candles, "XAUUSD");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.type).toBe("BREAKOUT");
  });

  it("returns indicator values", () => {
    const candles = generateCandles("EURUSD", 50);
    const result = analyzeBreakout(candles, "EURUSD");
    expect(result.indicators).toHaveProperty("donchianUpper");
    expect(result.indicators).toHaveProperty("donchianLower");
    expect(result.indicators).toHaveProperty("volumeRatio");
    expect(result.indicators).toHaveProperty("atr");
  });

  it("handles all symbols", () => {
    for (const symbol of ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"]) {
      const candles = generateCandles(symbol, 50);
      expect(() => analyzeBreakout(candles, symbol)).not.toThrow();
      const result = analyzeBreakout(candles, symbol);
      expect(result.reason).toContain(symbol);
    }
  });
});

// ============================================================================
// Multi-Strategy Orchestrator Tests
// ============================================================================
describe("runMultiStrategy", () => {
  it("returns all 4 strategies", () => {
    const candles = generateCandles("NAS100", 100);
    const output = runMultiStrategy("NAS100", candles);

    expect(output.strategies).toHaveLength(4);
    expect(output.strategies.map((s) => s.type).sort()).toEqual([
      "BREAKOUT",
      "ICT_SMC",
      "MEAN_REVERSION",
      "MOMENTUM",
    ]);
  });

  it("returns agreement level and consensus", () => {
    const candles = generateCandles("NAS100", 100);
    const output = runMultiStrategy("NAS100", candles);

    expect(["STRONG", "MODERATE", "WEAK", "CONFLICT"]).toContain(output.agreement);
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(output.consensusDirection);
    expect(typeof output.avgConfidence).toBe("number");
  });

  it("votes sum to 4", () => {
    const candles = generateCandles("NAS100", 100);
    const output = runMultiStrategy("NAS100", candles);

    expect(output.buyVotes + output.sellVotes + output.neutralVotes).toBe(4);
  });

  it("avgConfidence is between 0 and 100", () => {
    const candles = generateCandles("EURUSD", 100);
    const output = runMultiStrategy("EURUSD", candles);

    expect(output.avgConfidence).toBeGreaterThanOrEqual(0);
    expect(output.avgConfidence).toBeLessThanOrEqual(100);
  });

  it("topStrategy is one of the strategy types", () => {
    const candles = generateCandles("XAUUSD", 100);
    const output = runMultiStrategy("XAUUSD", candles);

    expect(["ICT_SMC", "MOMENTUM", "MEAN_REVERSION", "BREAKOUT"]).toContain(output.topStrategy);
  });
});

// ============================================================================
// getStrategySummary Tests
// ============================================================================
describe("getStrategySummary", () => {
  it("returns summary for a valid multi-strategy output", () => {
    const candles = generateCandles("NAS100", 100);
    const output = runMultiStrategy("NAS100", candles);
    const summary = getStrategySummary(output);

    expect(summary).toHaveProperty("label");
    expect(summary).toHaveProperty("consensus");
    expect(summary).toHaveProperty("agreement");
    expect(summary).toHaveProperty("strategyBreakdown");

    expect(summary.strategyBreakdown).toHaveLength(4);
    for (const s of summary.strategyBreakdown) {
      expect(s).toHaveProperty("type");
      expect(s).toHaveProperty("dir");
      expect(s).toHaveProperty("conf");
    }
  });
});
