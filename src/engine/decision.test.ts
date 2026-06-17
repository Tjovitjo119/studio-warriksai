// ============================================================================
// WARRIKS AI — Decision Engine Unit Tests
// Tests: full pipeline, condition checking, risk parameter calculation
// ============================================================================

import { describe, it, expect } from "vitest";
import { runDecisionEngine, checkAllConditions } from "./decision";
import type { Candle, MarketStructureResult, LiquidityResult, OrderFlowResult, SessionResult, ProbabilityResult } from "./types";

function generateTestCandles(count: number, direction: "up" | "down" | "neutral" = "neutral"): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let price = 100;
  for (let i = count; i > 0; i--) {
    const open = price;
    let drift: number;
    switch (direction) {
      case "up": drift = (Math.random() - 0.3) * 2; break;
      case "down": drift = (Math.random() - 0.7) * 2; break;
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

describe("Decision Engine", () => {
  it("returns a valid TradeDecision with status always defined", () => {
    const candles = generateTestCandles(80, "up");
    const decision = runDecisionEngine("NAS100", candles);

    expect(decision).toBeDefined();
    expect(decision.symbol).toBe("NAS100");
    expect(["TRADE", "NO_TRADE"]).toContain(decision.status);
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(decision.direction);
    expect(decision.confluenceScore).toBeGreaterThanOrEqual(0);
    expect(decision.probabilityScore).toBeGreaterThanOrEqual(0);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(decision.tradeQuality);
    expect(typeof decision.reason).toBe("string");
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it("handles different symbols without error", () => {
    const candles = generateTestCandles(60, "neutral");
    const symbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"];

    for (const symbol of symbols) {
      const decision = runDecisionEngine(symbol, candles);
      expect(decision.symbol).toBe(symbol);
      expect(decision.status).toBeDefined();
    }
  });

  it("returns NO_TRADE with insufficient data", () => {
    const candles = generateTestCandles(5, "up");
    const decision = runDecisionEngine("NAS100", candles);

    expect(decision.status).toBe("NO_TRADE");
    expect(decision.direction).toBe("NEUTRAL");
  });

  it("returns valid risk parameters for a trade", () => {
    const candles = generateTestCandles(80, "up");
    const decision = runDecisionEngine("NAS100", candles);

    if (decision.status === "TRADE") {
      expect(decision.stopLoss).toBeGreaterThan(0);
      expect(decision.takeProfit.tp1).toBeGreaterThan(0);
      expect(decision.takeProfit.tp2).toBeGreaterThan(0);
      expect(decision.takeProfit.tp3).toBeGreaterThan(0);
      expect(decision.riskReward).toBeGreaterThan(0);
      expect(decision.entryZone.midpoint).toBeGreaterThan(0);
    }
  });

  it("returns NO_TRADE for empty candle array", () => {
    const decision = runDecisionEngine("NAS100", []);
    expect(decision.status).toBe("NO_TRADE");
  });

  describe("checkAllConditions", () => {
    it("returns true when all conditions are met", () => {
      const structure: MarketStructureResult = { bias: "BULLISH", structureState: "BOS", trendStrength: 80, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "BUY", liquidityTaken: true, strength: 70, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: true, currentKillzone: "NEW_YORK", volatility: "HIGH", nextKillzone: null, nextKillzoneTime: null, description: "" };
      const probability: ProbabilityResult = { structureQuality: 80, liquidityClarity: 80, entryPrecision: 80, sessionQuality: 80, totalConfluence: 85, tradeQuality: "HIGH", enginesAgreed: 4 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(true);
    });

    it("returns false when structure has no bias", () => {
      const structure: MarketStructureResult = { bias: "NEUTRAL", structureState: "UNCLEAR", trendStrength: 0, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "BUY", liquidityTaken: true, strength: 70, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: true, currentKillzone: "NEW_YORK", volatility: "HIGH", nextKillzone: null, nextKillzoneTime: null, description: "" };
      const probability: ProbabilityResult = { structureQuality: 80, liquidityClarity: 80, entryPrecision: 80, sessionQuality: 80, totalConfluence: 85, tradeQuality: "HIGH", enginesAgreed: 4 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(false);
    });

    it("returns false when liquidity is not taken", () => {
      const structure: MarketStructureResult = { bias: "BULLISH", structureState: "BOS", trendStrength: 80, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "NEUTRAL", liquidityTaken: false, strength: 0, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: true, currentKillzone: "NEW_YORK", volatility: "HIGH", nextKillzone: null, nextKillzoneTime: null, description: "" };
      const probability: ProbabilityResult = { structureQuality: 80, liquidityClarity: 80, entryPrecision: 80, sessionQuality: 80, totalConfluence: 85, tradeQuality: "HIGH", enginesAgreed: 4 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(false);
    });

    it("returns false when not in killzone", () => {
      const structure: MarketStructureResult = { bias: "BULLISH", structureState: "BOS", trendStrength: 80, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "BUY", liquidityTaken: true, strength: 70, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: false, currentKillzone: "OFF_HOURS", volatility: "LOW", nextKillzone: "LONDON", nextKillzoneTime: "07:00 NY", description: "" };
      const probability: ProbabilityResult = { structureQuality: 80, liquidityClarity: 80, entryPrecision: 80, sessionQuality: 80, totalConfluence: 85, tradeQuality: "HIGH", enginesAgreed: 4 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(false);
    });

    it("returns false when confluence is too low", () => {
      const structure: MarketStructureResult = { bias: "BULLISH", structureState: "BOS", trendStrength: 80, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "BUY", liquidityTaken: true, strength: 70, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: true, currentKillzone: "NEW_YORK", volatility: "HIGH", nextKillzone: null, nextKillzoneTime: null, description: "" };
      const probability: ProbabilityResult = { structureQuality: 20, liquidityClarity: 20, entryPrecision: 20, sessionQuality: 20, totalConfluence: 40, tradeQuality: "LOW", enginesAgreed: 3 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(false);
    });

    it("returns false when not enough engines agree", () => {
      const structure: MarketStructureResult = { bias: "BULLISH", structureState: "BOS", trendStrength: 80, description: "" };
      const liquidity: LiquidityResult = { sweepDirection: "BUY", liquidityTaken: true, strength: 70, pools: [], description: "" };
      const orderFlow: OrderFlowResult = { entryModel: "FVG", entryZone: { high: 101, low: 99, midpoint: 100 }, confirmationStatus: true, displacement: true, mitigation: true, description: "" };
      const session: SessionResult = { inKillzone: true, currentKillzone: "NEW_YORK", volatility: "HIGH", nextKillzone: null, nextKillzoneTime: null, description: "" };
      const probability: ProbabilityResult = { structureQuality: 80, liquidityClarity: 80, entryPrecision: 80, sessionQuality: 80, totalConfluence: 85, tradeQuality: "HIGH", enginesAgreed: 1 };

      expect(checkAllConditions(structure, liquidity, orderFlow, session, probability)).toBe(false);
    });
  });
});
