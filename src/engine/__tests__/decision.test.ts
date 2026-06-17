// ============================================================================
// WARRIKS AI v5.1 — Decision Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { runDecisionEngine, checkAllConditions } from "../decision";
import { generateCandles } from "../marketData";
import type {
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  SessionResult,
  ProbabilityResult,
} from "../types";

// ============================================================================
// checkAllConditions
// ============================================================================
describe("checkAllConditions", () => {
  const validStructure: MarketStructureResult = {
    bias: "BULLISH",
    structureState: "BOS",
    trendStrength: 80,
    description: "Bullish",
  };

  const validLiquidity: LiquidityResult = {
    sweepDirection: "BUY",
    liquidityTaken: true,
    strength: 75,
    pools: [],
    description: "Sweep",
  };

  const validOrderFlow: OrderFlowResult = {
    entryModel: "FVG",
    entryZone: { high: 101, low: 99, midpoint: 100 },
    confirmationStatus: true,
    displacement: true,
    mitigation: true,
    description: "FVG",
  };

  const validSession: SessionResult = {
    inKillzone: true,
    currentKillzone: "NEW_YORK",
    volatility: "HIGH",
    nextKillzone: null,
    nextKillzoneTime: null,
    description: "Killzone",
  };

  const validProbability: ProbabilityResult = {
    structureQuality: 80,
    liquidityClarity: 80,
    entryPrecision: 80,
    sessionQuality: 80,
    totalConfluence: 85,
    tradeQuality: "HIGH",
    enginesAgreed: 4,
  };

  it("returns true when all conditions are met", () => {
    expect(
      checkAllConditions(validStructure, validLiquidity, validOrderFlow, validSession, validProbability),
    ).toBe(true);
  });

  it("returns false when structure is neutral", () => {
    expect(
      checkAllConditions(
        { ...validStructure, bias: "NEUTRAL", structureState: "UNCLEAR" },
        validLiquidity,
        validOrderFlow,
        validSession,
        validProbability,
      ),
    ).toBe(false);
  });

  it("returns false when no liquidity sweep", () => {
    expect(
      checkAllConditions(
        validStructure,
        { ...validLiquidity, liquidityTaken: false },
        validOrderFlow,
        validSession,
        validProbability,
      ),
    ).toBe(false);
  });

  it("returns false when no order flow confirmation", () => {
    expect(
      checkAllConditions(
        validStructure,
        validLiquidity,
        { ...validOrderFlow, confirmationStatus: false },
        validSession,
        validProbability,
      ),
    ).toBe(false);
  });

  it("returns false when outside killzone", () => {
    expect(
      checkAllConditions(
        validStructure,
        validLiquidity,
        validOrderFlow,
        { ...validSession, inKillzone: false },
        validProbability,
      ),
    ).toBe(false);
  });

  it("returns false when confluence < 75", () => {
    expect(
      checkAllConditions(
        validStructure,
        validLiquidity,
        validOrderFlow,
        validSession,
        { ...validProbability, totalConfluence: 50 },
      ),
    ).toBe(false);
  });

  it("returns false when engines agreed < 3", () => {
    expect(
      checkAllConditions(
        validStructure,
        validLiquidity,
        validOrderFlow,
        validSession,
        { ...validProbability, enginesAgreed: 2 },
      ),
    ).toBe(false);
  });
});

// ============================================================================
// runDecisionEngine — Integration
// ============================================================================
describe("runDecisionEngine", () => {
  it("returns valid decision with sufficient data", () => {
    const candles = generateCandles("NAS100", 100);
    const decision = runDecisionEngine("NAS100", candles);

    expect(decision.symbol).toBe("NAS100");
    expect(["TRADE", "NO_TRADE"]).toContain(decision.status);
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(decision.direction);
    expect(decision.confluenceScore).toBeGreaterThanOrEqual(0);
    expect(decision.confluenceScore).toBeLessThanOrEqual(100);
    expect(typeof decision.reason).toBe("string");
  });

  it("always has a reason string", () => {
    const candles = generateCandles("EURUSD", 100);
    const decision = runDecisionEngine("EURUSD", candles);
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it("NO_TRADE has zero trade parameters", () => {
    // Use minimal candles to force NO_TRADE
    const candles = generateCandles("XAUUSD", 20);
    const decision = runDecisionEngine("XAUUSD", candles);
    if (decision.status === "NO_TRADE") {
      expect(decision.stopLoss).toBe(0);
      expect(decision.takeProfit.tp1).toBe(0);
      expect(decision.riskReward).toBe(0);
    }
  });

  it("TRADE status has non-zero risk parameters", () => {
    const candles = generateCandles("GBPUSD", 120);
    const decision = runDecisionEngine("GBPUSD", candles);
    if (decision.status === "TRADE") {
      expect(decision.stopLoss).toBeGreaterThan(0);
      expect(decision.takeProfit.tp1).toBeGreaterThan(0);
      expect(decision.riskReward).toBeGreaterThan(0);
      expect(decision.entryZone.midpoint).toBeGreaterThan(0);
    }
  });

  it("handles all 4 default symbols without errors", () => {
    const symbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"];
    for (const symbol of symbols) {
      const candles = generateCandles(symbol, 100);
      expect(() => runDecisionEngine(symbol, candles)).not.toThrow();
      const decision = runDecisionEngine(symbol, candles);
      expect(decision.symbol).toBe(symbol);
    }
  });

  it("probabilityScore is between 0 and 100", () => {
    const candles = generateCandles("NAS100", 100);
    const decision = runDecisionEngine("NAS100", candles);
    expect(decision.probabilityScore).toBeGreaterThanOrEqual(0);
    expect(decision.probabilityScore).toBeLessThanOrEqual(100);
  });
});
