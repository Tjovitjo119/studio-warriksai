// ============================================================================
// WARRIKS AI v5.2 — Strategy Combination Engine
// Purpose: Orchestrate all 6 strategy engines with agreement matrix
//          and confluence boosters for institutional-grade execution
// ============================================================================
//
// STRATEGY AGREEMENT MATRIX (6 engines total):
//   6/6  = Elite Setup (Maximum Confidence)
//   5/6  = Institutional Grade
//   4/6  = High Probability
//   3/6  = Moderate Probability
//   <3/6 = NO TRADE
//
// CONFLUENCE BOOSTERS:
//   +10 = Judas Swing + MSS
//   +10 = Breaker Block + MSS
//   +8  = Daily Range Expansion + HTF Bias
//   +8  = Turtle Breakout + Trend Alignment
//   +5  = VWAP Reversion + Session Extreme
// ============================================================================

import type {
  Candle,
  Direction,
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  StrategyEngineResult,
  CombinationResult,
  AgreementLevelV2,
  ConfluenceBooster,
  SessionPriority,
} from "../types";
import { analyzeMarketStructure } from "../marketStructure";
import { analyzeLiquidity } from "../liquidity";
import { analyzeOrderFlow } from "../orderFlow";
import { analyzeSession, getCurrentNYHour, getSessionPriority, isInApprovedSession } from "../session";
import { runDecisionEngine } from "../decision";

// Import new strategy engines
import { analyzeJudasSwingReversal } from "./judasSwingReversal";
import { analyzeBreakerBlockExecution } from "./breakerBlockExecution";
import { analyzeVWAPReversion } from "./vwapReversion";
import { analyzeDailyRangeExpansion } from "./dailyRangeExpansion";
import { analyzeTurtleBreakout } from "./turtleBreakoutFilter";

/**
 * Convert MSS+FVG decision to StrategyEngineResult format.
 */
function mssFvgToEngineResult(
  symbol: string,
  candles: Candle[],
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
): StrategyEngineResult {
  const decision = runDecisionEngine(symbol, candles);
  const signal = decision.status === "TRADE";

  return {
    type: "MSS_FVG",
    direction: signal ? decision.direction : "NEUTRAL",
    voteStrength: signal
      ? decision.direction === "BUY"
        ? "STRONG_BULLISH"
        : "STRONG_BEARISH"
      : "NEUTRAL",
    confidence: decision.probabilityScore,
    signal,
    reason: decision.reason,
    priority: "VERY_HIGH",
    indicators: {
      confluenceScore: decision.confluenceScore,
      probabilityScore: decision.probabilityScore,
      enginesAgreed: decision.probabilityScore > 0 ? 4 : 0,
      mssConfirmed: structure.bias !== "NEUTRAL" && structure.structureState !== "UNCLEAR" ? 1 : 0,
      sweepConfirmed: liquidity.liquidityTaken ? 1 : 0,
      entryModelFound: orderFlow.confirmationStatus ? 1 : 0,
    },
    active: signal,
  };
}

/**
 * Compute the agreement level based on the number of engines that agree on a direction.
 */
function computeAgreement(agreementCount: number): AgreementLevelV2 {
  if (agreementCount >= 6) return "ELITE";
  if (agreementCount >= 5) return "INSTITUTIONAL_GRADE";
  if (agreementCount >= 4) return "HIGH_PROBABILITY";
  if (agreementCount >= 3) return "MODERATE_PROBABILITY";
  return "NO_TRADE";
}

/**
 * Evaluate confluence boosters based on engine results.
 *
 * Confluence Boosters:
 *   +10 = Judas Swing + MSS
 *   +10 = Breaker Block + MSS
 *   +8  = Daily Range Expansion + HTF Bias
 *   +8  = Turtle Breakout + Trend Alignment
 *   +5  = VWAP Reversion + Session Extreme
 */
function evaluateBoosters(
  engines: StrategyEngineResult[],
  structure: MarketStructureResult,
  sessionPriority: SessionPriority,
): { boosters: ConfluenceBooster[]; totalBonus: number } {
  const boosters: ConfluenceBooster[] = [];
  let totalBonus = 0;

  const judasSwing = engines.find((e) => e.type === "JUDAS_SWING");
  const breakerBlock = engines.find((e) => e.type === "BREAKER_BLOCK");
  const dailyRange = engines.find((e) => e.type === "DAILY_RANGE_EXPANSION");
  const turtle = engines.find((e) => e.type === "TURTLE_BREAKOUT");
  const vwap = engines.find((e) => e.type === "VWAP_REVERSION");
  const mssFvg = engines.find((e) => e.type === "MSS_FVG");

  // +10 = Judas Swing + MSS (both signal same direction)
  if (judasSwing?.signal && mssFvg?.signal && judasSwing.direction === mssFvg.direction) {
    boosters.push({ label: "Judas Swing + MSS", points: 10, applied: true });
    totalBonus += 10;
  }

  // +10 = Breaker Block + MSS
  if (breakerBlock?.signal && mssFvg?.signal && breakerBlock.direction === mssFvg.direction) {
    boosters.push({ label: "Breaker Block + MSS", points: 10, applied: true });
    totalBonus += 10;
  }

  // +8 = Daily Range Expansion + HTF Bias
  if (dailyRange?.signal && structure.bias !== "NEUTRAL") {
    const htfAligned =
      (dailyRange.direction === "BUY" && structure.bias === "BULLISH") ||
      (dailyRange.direction === "SELL" && structure.bias === "BEARISH");
    if (htfAligned) {
      boosters.push({ label: "Daily Range Expansion + HTF Bias", points: 8, applied: true });
      totalBonus += 8;
    }
  }

  // +8 = Turtle Breakout + Trend Alignment
  if (turtle?.signal && structure.bias !== "NEUTRAL") {
    const trendAligned =
      (turtle.direction === "BUY" && structure.bias === "BULLISH") ||
      (turtle.direction === "SELL" && structure.bias === "BEARISH");
    if (trendAligned) {
      boosters.push({ label: "Turtle Breakout + Trend Alignment", points: 8, applied: true });
      totalBonus += 8;
    }
  }

  // +5 = VWAP Reversion + Session Extreme
  // Session extreme approximated by session priority HIGHEST
  if (vwap?.signal && sessionPriority === "HIGHEST") {
    boosters.push({ label: "VWAP Reversion + Session Extreme", points: 5, applied: true });
    totalBonus += 5;
  }

  return { boosters, totalBonus };
}

/**
 * Build a comprehensive description of the combination result.
 */
function buildCombinationDescription(
  engines: StrategyEngineResult[],
  agreement: AgreementLevelV2,
  agreementCount: number,
  consensusDirection: Direction,
  confluenceScore: number,
  boosters: ConfluenceBooster[],
  sessionPriority: SessionPriority,
): string {
  const activeEngines = engines.filter((e) => e.signal);
  const activeCount = activeEngines.length;

  const engineSummary = activeEngines
    .map((e) => `${e.type}(${e.direction})`)
    .join(", ");

  const boosterSummary = boosters
    .filter((b) => b.applied)
    .map((b) => `${b.label}(+${b.points})`)
    .join(", ");

  return (
    `${agreement} — ${agreementCount}/6 engines agree. ` +
    `Direction: ${consensusDirection}. ` +
    `Active: ${activeCount}/6 (${engineSummary}). ` +
    `Confluence: ${confluenceScore}/100. ` +
    `Session: ${sessionPriority}.` +
    (boosterSummary ? ` Boosters: ${boosterSummary}.` : "")
  );
}

/**
 * Full combination analysis: run all 6 strategy engines and produce a combined result.
 *
 * @param symbol - Trading symbol
 * @param candles - Candlestick data
 * @param precomputed - Optional pre-computed analysis results to avoid redundant computation
 * @returns CombinationResult with agreement, boosters, and tradeability
 */
export function runCombinationEngine(
  symbol: string,
  candles: Candle[],
  precomputed?: {
    structure: MarketStructureResult;
    liquidity: LiquidityResult;
    orderFlow: OrderFlowResult;
  },
): CombinationResult {
  // Run or use pre-computed core analysis engines
  const structure = precomputed?.structure ?? analyzeMarketStructure(candles, symbol);
  const liquidity = precomputed?.liquidity ?? analyzeLiquidity(candles, symbol);
  const orderFlow = precomputed?.orderFlow ?? analyzeOrderFlow(candles, liquidity.sweepDirection, symbol);

  // Run all 6 strategy engines
  const engines: StrategyEngineResult[] = [
    mssFvgToEngineResult(symbol, candles, structure, liquidity, orderFlow),
    analyzeJudasSwingReversal(candles, structure, liquidity, orderFlow, symbol),
    analyzeBreakerBlockExecution(candles, structure, liquidity, orderFlow, symbol),
    analyzeVWAPReversion(candles, symbol),
    analyzeDailyRangeExpansion(candles, structure, symbol),
    analyzeTurtleBreakout(candles, structure, symbol),
  ];

  // Count agreement per direction
  const agreedEngines = engines.filter((e) => e.signal && e.direction !== "NEUTRAL");
  const buyCount = agreedEngines.filter((e) => e.direction === "BUY").length;
  const sellCount = agreedEngines.filter((e) => e.direction === "SELL").length;
  const agreementCount = Math.max(buyCount, sellCount);

  // Determine consensus direction
  let consensusDirection: Direction = "NEUTRAL";
  if (buyCount > sellCount && buyCount >= 3) {
    consensusDirection = "BUY";
  } else if (sellCount > buyCount && sellCount >= 3) {
    consensusDirection = "SELL";
  }

  // Compute agreement level
  const agreement = computeAgreement(agreementCount);

  // Session priority
  const { hour, minute } = getCurrentNYHour();
  const sessionPriority = getSessionPriority(hour, minute);
  const approvedSession = sessionPriority !== "LOWEST";

  // Base confluence score from number of engines agreeing
  const baseScore = Math.round((agreementCount / 6) * 100);

  // Evaluate boosters
  const { boosters, totalBonus } = evaluateBoosters(engines, structure, sessionPriority);

  // Final confluence score (capped at 100)
  const confluenceScore = Math.min(baseScore + totalBonus, 100);

  // Tradeability
  const tradeable =
    agreementCount >= 3 &&
    consensusDirection !== "NEUTRAL" &&
    approvedSession;

  const description = buildCombinationDescription(
    engines,
    agreement,
    agreementCount,
    consensusDirection,
    confluenceScore,
    boosters,
    sessionPriority,
  );

  return {
    engines,
    agreement,
    agreementCount,
    consensusDirection,
    confluenceScore,
    boostersApplied: boosters,
    sessionPriority,
    tradeable,
    description,
  };
}

/**
 * Get a summary of engine agreement for display purposes.
 */
export function getEngineSummary(combination: CombinationResult): {
  totalEngines: number;
  activeEngines: number;
  agreementLabel: string;
  consensus: string;
  score: number;
  tradeable: boolean;
  engineDetails: { type: string; dir: string; conf: number; signal: boolean }[];
} {
  const getDirSymbol = (d: string) =>
    d === "BUY" ? "▲" : d === "SELL" ? "▼" : "—";

  const getAgreementLabel = (agreement: AgreementLevelV2) => {
    switch (agreement) {
      case "ELITE": return "Elite Setup";
      case "INSTITUTIONAL_GRADE": return "Institutional Grade";
      case "HIGH_PROBABILITY": return "High Probability";
      case "MODERATE_PROBABILITY": return "Moderate Probability";
      case "NO_TRADE": return "NO TRADE";
    }
  };

  return {
    totalEngines: combination.engines.length,
    activeEngines: combination.engines.filter((e) => e.signal).length,
    agreementLabel: getAgreementLabel(combination.agreement),
    consensus: getDirSymbol(combination.consensusDirection),
    score: combination.confluenceScore,
    tradeable: combination.tradeable,
    engineDetails: combination.engines.map((e) => ({
      type: e.type,
      dir: getDirSymbol(e.direction),
      conf: e.confidence,
      signal: e.signal,
    })),
  };
}
