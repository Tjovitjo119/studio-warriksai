// ============================================================================
// WARRIKS AI v5.2 — Strategy Orchestrator
// Runs all 4 trading strategies PLUS the 5 secondary confirmation engines
// ============================================================================

import type {
  Candle,
  StrategyResult,
  StrategyType,
  MultiStrategyOutput,
  AgreementLevel,
  CombinationResult,
  StrategyEngineResult,
} from "../types";
import { runDecisionEngine } from "../decision";
import { analyzeMomentum } from "./momentum";
import { analyzeMeanReversion } from "./meanReversion";
import { analyzeBreakout } from "./breakout";

// New exports for the v5.2 secondary engines
import { analyzeJudasSwingReversal } from "./judasSwingReversal";
import { analyzeBreakerBlockExecution } from "./breakerBlockExecution";
import { analyzeVWAPReversion } from "./vwapReversion";
import { analyzeDailyRangeExpansion } from "./dailyRangeExpansion";
import { analyzeTurtleBreakout } from "./turtleBreakoutFilter";
import { runCombinationEngine, getEngineSummary } from "./combinationEngine";

/**
 * Run all 4 trading strategies on the given candles and produce a combined view.
 *
 * Strategies:
 * 1. ICT_SMC — Institutional SMC (market structure + liquidity + order flow + killzone)
 * 2. MOMENTUM — Trend following (MACD + ADX + EMA alignment)
 * 3. MEAN_REVERSION — Fade extremes (RSI + Bollinger Bands + Z-score)
 * 4. BREAKOUT — Volatility breakout (Donchian + volume + ATR)
 */
export function runMultiStrategy(
  symbol: string,
  candles: Candle[],
): MultiStrategyOutput {
  // Run all 4 strategies
  const strategies: StrategyResult[] = [
    runICT_SMC(symbol, candles),
    analyzeMomentum(candles, symbol),
    analyzeMeanReversion(candles, symbol),
    analyzeBreakout(candles, symbol),
  ];

  const activeStrategies = strategies.filter((s) => s.active && s.direction !== "NEUTRAL");
  const totalActive = activeStrategies.length;

  // Count votes per direction
  let buyVotes = strategies.filter((s) => s.direction === "BUY" && s.confidence >= 40).length;
  let sellVotes = strategies.filter((s) => s.direction === "SELL" && s.confidence >= 40).length;
  let neutralVotes = strategies.length - buyVotes - sellVotes;

  // Determine consensus direction
  let consensusDirection: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let agreement: AgreementLevel = "WEAK";
  const avgConfidence = Math.round(
    strategies.reduce((s, st) => s + st.confidence, 0) / strategies.length,
  );

  if (buyVotes > sellVotes && buyVotes > neutralVotes) {
    consensusDirection = "BUY";
  } else if (sellVotes > buyVotes && sellVotes > neutralVotes) {
    consensusDirection = "SELL";
  }

  // Agreement level
  if (buyVotes >= 3 || sellVotes >= 3) {
    agreement = "STRONG";
  } else if (buyVotes >= 2 || sellVotes >= 2) {
    agreement = totalActive >= 2 ? "MODERATE" : "WEAK";
  } else if (totalActive === 0) {
    agreement = "CONFLICT";
  }

  // Top strategy = highest confidence active strategy
  let topStrategy: StrategyType = strategies.reduce((best, s) =>
    s.confidence > best.confidence ? s : best,
  ).type;

  return {
    strategies,
    agreement,
    consensusDirection,
    buyVotes,
    sellVotes,
    neutralVotes,
    topStrategy,
    avgConfidence,
  };
}

/**
 * Run the original ICT/SMC decision engine and convert to StrategyResult format.
 */
function runICT_SMC(symbol: string, candles: Candle[]): StrategyResult {
  const decision = runDecisionEngine(symbol, candles);

  return {
    type: "ICT_SMC",
    direction: decision.status === "TRADE" ? decision.direction : "NEUTRAL",
    confidence: decision.status === "TRADE"
      ? Math.round(
          (decision.confluenceScore * 0.6 + decision.probabilityScore * 0.4),
        )
      : Math.max(0, Math.round(decision.confluenceScore * 0.4)),
    reason: decision.reason,
    indicators: {
      confluenceScore: decision.confluenceScore,
      probabilityScore: decision.probabilityScore,
      enginesAgreed: decision.probabilityScore > 0 ? 4 : 0,
      trendStrength: decision.probabilityScore,
    },
    active: decision.status === "TRADE",
  };
}

/**
 * Quick multi-strategy analysis for dashboard display.
 * Returns a condensed summary.
 */
export function getStrategySummary(output: MultiStrategyOutput): {
  label: string;
  consensus: string;
  agreement: string;
  strategyBreakdown: { type: string; dir: string; conf: number }[];
} {
  const getDir = (d: string) =>
    d === "BUY" ? "▲" : d === "SELL" ? "▼" : "—";

  return {
    label: `${output.consensusDirection === "NEUTRAL" ? "MIXED" : output.consensusDirection} ${output.agreement}`,
    consensus: output.consensusDirection,
    agreement: output.agreement,
    strategyBreakdown: output.strategies.map((s) => ({
      type: s.type,
      dir: getDir(s.direction),
      conf: s.confidence,
    })),
  };
}

// ============================================================================
// v5.2 Exports — Secondary Strategy Engines & Combination Engine
// ============================================================================

export {
  analyzeJudasSwingReversal,
  analyzeBreakerBlockExecution,
  analyzeVWAPReversion,
  analyzeDailyRangeExpansion,
  analyzeTurtleBreakout,
  runCombinationEngine,
  getEngineSummary,
};

export type { CombinationResult, StrategyEngineResult } from "../types";

// Re-export the combination engine's types
export { getEngineSummary as getCombinationSummary } from "./combinationEngine";
