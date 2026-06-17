// ============================================================================
// WARRIKS AI v5.1 — Full Engine Integration Tests
// Tests the complete pipeline from market data → structure → liquidity →
// order flow → probability → decision → multi-strategy
// ============================================================================

import { describe, it, expect } from "vitest";
import { generateAllCandles } from "../marketData";
import { analyzeMarketStructure } from "../marketStructure";
import { analyzeLiquidity } from "../liquidity";
import { analyzeOrderFlow } from "../orderFlow";
import { analyzeSession } from "../session";
import { calculateProbability } from "../probability";
import { runDecisionEngine } from "../decision";
import { runMultiStrategy } from "../strategies";

describe("Full Engine Pipeline", () => {
  it("processes all 4 symbols through the entire pipeline without errors", () => {
    const allCandles = generateAllCandles(120);
    const symbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"];

    for (const symbol of symbols) {
      const candles = allCandles[symbol];
      expect(candles.length).toBeGreaterThan(0);

      // Run the full pipeline
      const structure = analyzeMarketStructure(candles, symbol);
      const liquidity = analyzeLiquidity(candles, symbol);
      const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, symbol);
      const session = analyzeSession();
      const probability = calculateProbability(structure, liquidity, orderFlow, session);
      const decision = runDecisionEngine(symbol, candles);
      const multiStrategy = runMultiStrategy(symbol, candles);

      // Validate all outputs
      expect(structure.bias).toMatch(/^(BULLISH|BEARISH|NEUTRAL)$/);
      expect(liquidity.sweepDirection).toMatch(/^(BUY|SELL|NEUTRAL)$/);
      expect(orderFlow.entryModel).toMatch(/^(NONE|FVG|OB|BREAKER)$/);
      expect(probability.totalConfluence).toBeGreaterThanOrEqual(0);
      expect(probability.tradeQuality).toMatch(/^(LOW|MEDIUM|HIGH)$/);
      expect(decision.status).toMatch(/^(TRADE|NO_TRADE)$/);
      expect(multiStrategy.strategies).toHaveLength(4);
    }
  });

  it("data flows consistently — same symbol/session data across calls", () => {
    const candles = generateAllCandles(100).NAS100;
    const decision1 = runDecisionEngine("NAS100", candles);
    const session = analyzeSession();
    const decision2 = runDecisionEngine("NAS100", candles);

    // Same input should produce same output (session is time-dependent so might differ)
    expect(decision1.confluenceScore).toBe(decision2.confluenceScore);
    expect(decision1.status).toBe(decision2.status);
  });

  it("all engine outputs satisfy type constraints", () => {
    const candles = generateAllCandles(100).EURUSD;

    const structure = analyzeMarketStructure(candles, "EURUSD");
    expect(structure.trendStrength).toBeGreaterThanOrEqual(0);
    expect(structure.trendStrength).toBeLessThanOrEqual(100);

    const liquidity = analyzeLiquidity(candles, "EURUSD");
    expect(liquidity.strength).toBeGreaterThanOrEqual(0);
    expect(liquidity.strength).toBeLessThanOrEqual(100);

    const orderFlow = analyzeOrderFlow(candles, liquidity.sweepDirection, "EURUSD");
    if (orderFlow.confirmationStatus) {
      expect(orderFlow.entryZone.high).toBeGreaterThan(orderFlow.entryZone.low);
      expect(orderFlow.entryZone.midpoint).toBeGreaterThan(0);
    }

    const probability = calculateProbability(structure, liquidity, orderFlow, analyzeSession());
    expect(probability.enginesAgreed).toBeGreaterThanOrEqual(0);
    expect(probability.enginesAgreed).toBeLessThanOrEqual(4);

    const decision = runDecisionEngine("EURUSD", candles);
    expect(decision.confluenceScore).toBeGreaterThanOrEqual(0);
    expect(decision.confluenceScore).toBeLessThanOrEqual(100);
  });

  it("engine runs deterministically with consistent candle data", () => {
    const candles = generateAllCandles(80).GBPUSD;
    const candlesCopy = [...candles].map((c) => ({ ...c }));

    const result1 = runDecisionEngine("GBPUSD", candles);
    const result2 = runDecisionEngine("GBPUSD", candlesCopy);

    expect(result1.status).toBe(result2.status);
    expect(result1.direction).toBe(result2.direction);
    expect(result1.confluenceScore).toBe(result2.confluenceScore);
    expect(result1.tradeQuality).toBe(result2.tradeQuality);
  });
});
