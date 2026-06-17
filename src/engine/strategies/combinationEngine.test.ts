// ============================================================================
// WARRIKS AI v5.2 — Combination Engine Unit Tests
// Tests: agreement matrix, confluence boosters, session priority, edge cases
// ============================================================================

import { describe, it, expect } from "vitest";
import { runCombinationEngine, getEngineSummary } from "./combinationEngine";
import { getSessionPriority, isInApprovedSession } from "../session";
import type { Candle } from "../types";

/**
 * Helper: generate a synthetic candle array with a given trend bias.
 * @param count Number of candles to generate
 * @param bias "bullish" = trending up, "bearish" = trending down, "neutral" = random
 * @returns Candle array
 */
function generateTestCandles(count: number, bias: "bullish" | "bearish" | "neutral" = "neutral"): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let price = 100;

  for (let i = count; i > 0; i--) {
    const open = price;
    let drift: number;

    switch (bias) {
      case "bullish":
        drift = (Math.random() - 0.35) * 2; // positive bias
        break;
      case "bearish":
        drift = (Math.random() - 0.65) * 2; // negative bias
        break;
      default:
        drift = (Math.random() - 0.5) * 2; // random
    }

    const close = open + drift;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.floor(Math.random() * 1000 + 100);

    candles.push({
      timestamp: now - i * 60000,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

describe("Combination Engine", () => {
  describe("runCombinationEngine", () => {
    it("returns a valid CombinationResult with all 6 engines", () => {
      const candles = generateTestCandles(120, "bullish");
      const result = runCombinationEngine("NAS100", candles);

      expect(result).toBeDefined();
      expect(result.engines).toHaveLength(6);
      expect(result.agreement).toBeDefined();
      expect(typeof result.agreementCount).toBe("number");
      expect(result.agreementCount).toBeGreaterThanOrEqual(0);
      expect(result.agreementCount).toBeLessThanOrEqual(6);
      expect(result.confluenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confluenceScore).toBeLessThanOrEqual(100);
      expect(result.tradeable).toBeDefined();
      expect(typeof result.tradeable).toBe("boolean");
      expect(result.description).toBeDefined();
      expect(result.description.length).toBeGreaterThan(0);
    });

    it("returns NO_TRADE for insufficient data", () => {
      const candles = generateTestCandles(5, "bullish");
      const result = runCombinationEngine("NAS100", candles);

      expect(result.agreement).toBe("NO_TRADE");
      expect(result.tradeable).toBe(false);
      expect(result.agreementCount).toBe(0);
    });

    it("produces a consensus direction with enough bullish data", () => {
      // Strong bullish data should produce some BUY signals
      const candles = generateTestCandles(200, "bullish");
      const result = runCombinationEngine("NAS100", candles);

      expect(result.consensusDirection).toBeDefined();
      expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.consensusDirection);
    });

    it("returns all engines with valid properties", () => {
      const candles = generateTestCandles(100, "neutral");
      const result = runCombinationEngine("EURUSD", candles);

      expect(result.engines.length).toBe(6);

      for (const engine of result.engines) {
        expect(engine.type).toBeDefined();
        expect(["MSS_FVG", "JUDAS_SWING", "BREAKER_BLOCK", "VWAP_REVERSION", "DAILY_RANGE_EXPANSION", "TURTLE_BREAKOUT"]).toContain(engine.type);
        expect(["BUY", "SELL", "NEUTRAL"]).toContain(engine.direction);
        expect(engine.confidence).toBeGreaterThanOrEqual(0);
        expect(engine.confidence).toBeLessThanOrEqual(100);
        expect(typeof engine.signal).toBe("boolean");
        expect(typeof engine.reason).toBe("string");
        expect(typeof engine.active).toBe("boolean");
      }
    });

    it("handles different symbols without error", () => {
      const candles = generateTestCandles(100, "neutral");
      const symbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"];

      for (const symbol of symbols) {
        const result = runCombinationEngine(symbol, candles);
        expect(result).toBeDefined();
        expect(result.engines).toHaveLength(6);
      }
    });

    it("does not crash with empty candle array", () => {
      const result = runCombinationEngine("NAS100", []);
      expect(result).toBeDefined();
      expect(result.agreement).toBe("NO_TRADE");
      expect(result.tradeable).toBe(false);
    });
  });

  describe("Agreement Matrix", () => {
    it("agreementCount is never negative", () => {
      const candles = generateTestCandles(50, "neutral");
      const result = runCombinationEngine("EURUSD", candles);
      expect(result.agreementCount).toBeGreaterThanOrEqual(0);
    });

    it("agreement level maps correctly to agreementCount", () => {
      const candles = generateTestCandles(80, "bullish");
      const result = runCombinationEngine("GBPUSD", candles);

      const { agreement, agreementCount } = result;

      if (agreement === "ELITE") expect(agreementCount).toBeGreaterThanOrEqual(6);
      else if (agreement === "INSTITUTIONAL_GRADE") expect(agreementCount).toBeGreaterThanOrEqual(5);
      else if (agreement === "HIGH_PROBABILITY") expect(agreementCount).toBeGreaterThanOrEqual(4);
      else if (agreement === "MODERATE_PROBABILITY") expect(agreementCount).toBeGreaterThanOrEqual(3);
      else expect(agreementCount).toBeLessThan(3);
    });
  });

  describe("Confluence Boosters", () => {
    it("boosters array is always present", () => {
      const candles = generateTestCandles(100, "neutral");
      const result = runCombinationEngine("NAS100", candles);

      expect(result.boostersApplied).toBeDefined();
      expect(Array.isArray(result.boostersApplied)).toBe(true);
    });

    it("each booster has required properties if applied", () => {
      const candles = generateTestCandles(120, "bullish");
      const result = runCombinationEngine("NAS100", candles);

      for (const booster of result.boostersApplied) {
        expect(typeof booster.label).toBe("string");
        expect(typeof booster.points).toBe("number");
        expect(typeof booster.applied).toBe("boolean");
        if (booster.applied) {
          expect(booster.points).toBeGreaterThan(0);
        }
      }
    });

    it("total bonus from boosters is capped such that final score <= 100", () => {
      const candles = generateTestCandles(200, "bullish");
      const result = runCombinationEngine("NAS100", candles);

      expect(result.confluenceScore).toBeLessThanOrEqual(100);
      expect(result.confluenceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Session Priority Integration", () => {
    it("getSessionPriority returns valid priority", () => {
      // Test known NY time windows
      expect(getSessionPriority(9, 0)).toBe("HIGHEST");   // 09:00 NY
      expect(getSessionPriority(7, 30)).toBe("SECOND");    // 07:30 NY
      expect(getSessionPriority(14, 0)).toBe("THIRD");     // 14:00 NY
      expect(getSessionPriority(3, 0)).toBe("LOWEST");     // 03:00 NY
      expect(getSessionPriority(16, 0)).toBe("LOWEST");    // 16:00 NY
    });

    it("isInApprovedSession returns correct boolean for known times", () => {
      // 09:00 NY should be approved (HIGHEST)
      expect(isInApprovedSession(9, 0)).toBe(true);
      // 03:00 NY should not be approved
      expect(isInApprovedSession(3, 0)).toBe(false);
    });

    it("sessionPriority is valid", () => {
      const candles = generateTestCandles(100, "neutral");
      const result = runCombinationEngine("EURUSD", candles);

      expect(["HIGHEST", "SECOND", "THIRD", "LOWEST"]).toContain(result.sessionPriority);
    });
  });

  describe("getEngineSummary", () => {
    it("returns a complete summary object", () => {
      const candles = generateTestCandles(120, "bullish");
      const result = runCombinationEngine("XAUUSD", candles);
      const summary = getEngineSummary(result);

      expect(summary).toBeDefined();
      expect(summary.totalEngines).toBe(6);
      expect(summary.activeEngines).toBeGreaterThanOrEqual(0);
      expect(summary.activeEngines).toBeLessThanOrEqual(6);
      expect(typeof summary.agreementLabel).toBe("string");
      expect(typeof summary.consensus).toBe("string");
      expect(summary.score).toBeGreaterThanOrEqual(0);
      expect(summary.score).toBeLessThanOrEqual(100);
      expect(typeof summary.tradeable).toBe("boolean");
      expect(summary.engineDetails).toHaveLength(6);

      for (const detail of summary.engineDetails) {
        expect(typeof detail.type).toBe("string");
        expect(typeof detail.dir).toBe("string");
        expect(detail.conf).toBeGreaterThanOrEqual(0);
        expect(detail.conf).toBeLessThanOrEqual(100);
        expect(typeof detail.signal).toBe("boolean");
      }
    });

    it("agreementLabel is non-empty for any valid result", () => {
      const candles = generateTestCandles(100, "bearish");
      const result = runCombinationEngine("GBPUSD", candles);
      const summary = getEngineSummary(result);

      expect(summary.agreementLabel.length).toBeGreaterThan(0);
    });
  });
});
