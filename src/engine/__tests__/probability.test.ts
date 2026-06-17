// ============================================================================
// WARRIKS AI v5.1 — Probability Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { calculateProbability } from "../probability";
import type {
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  SessionResult,
} from "../types";

// ─── Test Helpers ───────────────────────────────────────────────────────────

const bullishStructure: MarketStructureResult = {
  bias: "BULLISH",
  structureState: "BOS",
  trendStrength: 80,
  description: "Bullish BOS detected",
};

const neutralStructure: MarketStructureResult = {
  bias: "NEUTRAL",
  structureState: "UNCLEAR",
  trendStrength: 0,
  description: "No clear structure",
};

const liquiditySwept: LiquidityResult = {
  sweepDirection: "BUY",
  liquidityTaken: true,
  strength: 75,
  pools: [{ type: "SESSION_LOW", price: 100, taken: true }],
  description: "Liquidity sweep detected",
};

const noLiquidity: LiquidityResult = {
  sweepDirection: "NEUTRAL",
  liquidityTaken: false,
  strength: 0,
  pools: [],
  description: "No liquidity sweep",
};

const validOrderFlow: OrderFlowResult = {
  entryModel: "FVG",
  entryZone: { high: 101, low: 99, midpoint: 100 },
  confirmationStatus: true,
  displacement: true,
  mitigation: true,
  description: "FVG entry detected",
};

const noOrderFlow: OrderFlowResult = {
  entryModel: "NONE",
  entryZone: { high: 0, low: 0, midpoint: 0 },
  confirmationStatus: false,
  displacement: false,
  mitigation: false,
  description: "No entry model",
};

const inKillzone: SessionResult = {
  inKillzone: true,
  currentKillzone: "NEW_YORK",
  volatility: "HIGH",
  nextKillzone: null,
  nextKillzoneTime: null,
  description: "NY killzone active",
};

const outsideKillzone: SessionResult = {
  inKillzone: false,
  currentKillzone: "ASIA",
  volatility: "LOW",
  nextKillzone: "LONDON",
  nextKillzoneTime: "07:00 NY",
  description: "Outside killzone",
};

// ============================================================================
// Tests
// ============================================================================
describe("calculateProbability", () => {
  it("returns HIGH quality when all 4 engines agree at max strength", () => {
    const result = calculateProbability(
      bullishStructure,
      liquiditySwept,
      validOrderFlow,
      inKillzone,
    );

    expect(result.tradeQuality).toBe("HIGH");
    expect(result.enginesAgreed).toBe(4);
    expect(result.totalConfluence).toBeGreaterThanOrEqual(85);
  });

  it("returns LOW quality when no engines agree", () => {
    const result = calculateProbability(
      neutralStructure,
      noLiquidity,
      noOrderFlow,
      outsideKillzone,
    );

    expect(result.tradeQuality).toBe("LOW");
    expect(result.enginesAgreed).toBe(0);
    expect(result.totalConfluence).toBe(0);
  });

  it("returns MEDIUM quality with partial agreement", () => {
    const semiStructure: MarketStructureResult = {
      bias: "BULLISH",
      structureState: "TRENDING",
      trendStrength: 55,
      description: "Bullish trending",
    };

    const semiLiquidity: LiquidityResult = {
      sweepDirection: "BUY",
      liquidityTaken: true,
      strength: 50,
      pools: [{ type: "SESSION_LOW", price: 100, taken: true }],
      description: "Weak sweep",
    };

    const semiOrderFlow: OrderFlowResult = {
      entryModel: "OB",
      entryZone: { high: 101, low: 99, midpoint: 100 },
      confirmationStatus: true,
      displacement: true,
      mitigation: false,
      description: "OB entry",
    };

    const result = calculateProbability(
      semiStructure,
      semiLiquidity,
      semiOrderFlow,
      inKillzone,
    );

    expect(result.enginesAgreed).toBeGreaterThanOrEqual(3);
  });

  it("individual quality scores are between 0 and 100", () => {
    const result = calculateProbability(
      bullishStructure,
      liquiditySwept,
      validOrderFlow,
      inKillzone,
    );

    expect(result.structureQuality).toBeGreaterThanOrEqual(0);
    expect(result.structureQuality).toBeLessThanOrEqual(100);
    expect(result.liquidityClarity).toBeGreaterThanOrEqual(0);
    expect(result.liquidityClarity).toBeLessThanOrEqual(100);
    expect(result.entryPrecision).toBeGreaterThanOrEqual(0);
    expect(result.entryPrecision).toBeLessThanOrEqual(100);
    expect(result.sessionQuality).toBeGreaterThanOrEqual(0);
    expect(result.sessionQuality).toBeLessThanOrEqual(100);
    expect(result.totalConfluence).toBeGreaterThanOrEqual(0);
    expect(result.totalConfluence).toBeLessThanOrEqual(100);
  });

  it("counts enginesAgreed correctly", () => {
    // 3 engines agree (structure, liquidity, order flow) but not session
    const result = calculateProbability(
      bullishStructure,
      liquiditySwept,
      validOrderFlow,
      outsideKillzone,
    );
    expect(result.enginesAgreed).toBe(3);

    // 2 engines agree
    const result2 = calculateProbability(
      neutralStructure,
      liquiditySwept,
      validOrderFlow,
      outsideKillzone,
    );
    expect(result2.enginesAgreed).toBe(2);
  });
});
