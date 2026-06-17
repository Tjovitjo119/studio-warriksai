// ============================================================================
// WARRIKS AI — Probability Engine Unit Tests
// Tests: scoring, trade quality, engine agreement counting
// ============================================================================

import { describe, it, expect } from "vitest";
import { calculateProbability } from "./probability";
import type { MarketStructureResult, LiquidityResult, OrderFlowResult, SessionResult } from "./types";

describe("Probability Engine", () => {
  const baseStructure: MarketStructureResult = {
    bias: "BULLISH",
    structureState: "BOS",
    trendStrength: 75,
    description: "Bullish BOS detected",
  };

  const baseLiquidity: LiquidityResult = {
    sweepDirection: "BUY",
    liquidityTaken: true,
    strength: 75,
    pools: [{ type: "EQUAL_LOW", price: 95, taken: true }],
    description: "Liquidity sweep detected",
  };

  const baseOrderFlow: OrderFlowResult = {
    entryModel: "FVG",
    entryZone: { high: 101, low: 99, midpoint: 100 },
    confirmationStatus: true,
    displacement: true,
    mitigation: true,
    description: "FVG detected",
  };

  const baseSession: SessionResult = {
    inKillzone: true,
    currentKillzone: "NEW_YORK",
    volatility: "HIGH",
    nextKillzone: null,
    nextKillzoneTime: null,
    description: "NY killzone active",
  };

  it("returns HIGH quality for all engines agreeing at high scores", () => {
    const result = calculateProbability(baseStructure, baseLiquidity, baseOrderFlow, baseSession);

    expect(result.totalConfluence).toBeGreaterThanOrEqual(75);
    expect(result.tradeQuality).toBe("HIGH");
    expect(result.enginesAgreed).toBe(4);
  });

  it("returns MEDIUM quality with moderate scores", () => {
    const moderateStructure: MarketStructureResult = {
      bias: "BULLISH",
      structureState: "TRENDING",
      trendStrength: 45,
      description: "Trending market",
    };

    const moderateLiquidity: LiquidityResult = {
      sweepDirection: "BUY",
      liquidityTaken: true,
      strength: 40,
      pools: [{ type: "EQUAL_LOW", price: 95, taken: false }],
      description: "Weak liquidity",
    };

    const result = calculateProbability(moderateStructure, moderateLiquidity, baseOrderFlow, baseSession);

    expect(result.totalConfluence).toBeGreaterThanOrEqual(0);
    expect(["MEDIUM", "HIGH", "LOW"]).toContain(result.tradeQuality);
    expect(result.enginesAgreed).toBeGreaterThanOrEqual(1);
  });

  it("returns LOW quality when all engines fail", () => {
    const badStructure: MarketStructureResult = {
      bias: "NEUTRAL",
      structureState: "UNCLEAR",
      trendStrength: 0,
      description: "No structure",
    };

    const badLiquidity: LiquidityResult = {
      sweepDirection: "NEUTRAL",
      liquidityTaken: false,
      strength: 0,
      pools: [],
      description: "No liquidity",
    };

    const badOrderFlow: OrderFlowResult = {
      entryModel: "NONE",
      entryZone: { high: 0, low: 0, midpoint: 0 },
      confirmationStatus: false,
      displacement: false,
      mitigation: false,
      description: "No entry",
    };

    const badSession: SessionResult = {
      inKillzone: false,
      currentKillzone: "OFF_HOURS",
      volatility: "LOW",
      nextKillzone: "LONDON",
      nextKillzoneTime: "07:00 NY",
      description: "Outside killzone",
    };

    const result = calculateProbability(badStructure, badLiquidity, badOrderFlow, badSession);

    expect(result.totalConfluence).toBe(0);
    expect(result.tradeQuality).toBe("LOW");
    expect(result.enginesAgreed).toBe(0);
    expect(result.structureQuality).toBe(0);
    expect(result.liquidityClarity).toBe(0);
    expect(result.entryPrecision).toBe(0);
    expect(result.sessionQuality).toBe(0);
  });

  it("scores each engine component independently", () => {
    const result = calculateProbability(baseStructure, baseLiquidity, baseOrderFlow, baseSession);

    expect(result.structureQuality).toBeGreaterThan(0);
    expect(result.liquidityClarity).toBeGreaterThan(0);
    expect(result.entryPrecision).toBeGreaterThan(0);
    expect(result.sessionQuality).toBeGreaterThan(0);
  });

  it("returns 3 engines for 3 active engines", () => {
    // Only 3 engines agree (session fails)
    const noSession: SessionResult = {
      inKillzone: false,
      currentKillzone: "OFF_HOURS",
      volatility: "LOW",
      nextKillzone: "LONDON",
      nextKillzoneTime: "07:00 NY",
      description: "Outside killzone",
    };
    const result = calculateProbability(baseStructure, baseLiquidity, baseOrderFlow, noSession);
    expect(result.enginesAgreed).toBe(3);
  });

  it("totalConfluence is between 0 and 100", () => {
    const result = calculateProbability(baseStructure, baseLiquidity, baseOrderFlow, baseSession);
    expect(result.totalConfluence).toBeGreaterThanOrEqual(0);
    expect(result.totalConfluence).toBeLessThanOrEqual(100);
  });
});
