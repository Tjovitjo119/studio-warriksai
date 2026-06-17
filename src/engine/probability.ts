// ============================================================================
// WARRIKS AI v5.1 — Probability Engine (Risk Filter)
// Purpose: Calculate trade quality across all engines and output confluence
// ============================================================================

import type {
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  SessionResult,
  ProbabilityResult,
  TradeQuality,
} from "./types";

/**
 * Calculate the total confluence score and trade quality.
 * Score ≥75 required for valid trade.
 * At least 3 of 4 engines must agree.
 */
export function calculateProbability(
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  session: SessionResult,
): ProbabilityResult {
  // Score each engine component (0–100)
  const structureQuality = scoreStructure(structure);
  const liquidityClarity = scoreLiquidity(liquidity);
  const entryPrecision = scoreOrderFlow(orderFlow);
  const sessionQuality = scoreSession(session);

  // Total confluence score (weighted average)
  const totalConfluence = Math.round(
    structureQuality * 0.25 +
      liquidityClarity * 0.30 +
      entryPrecision * 0.30 +
      sessionQuality * 0.15,
  );

  // Count how many engines agree
  const enginesAgreed = countEnginesAgreed(
    structure,
    liquidity,
    orderFlow,
    session,
  );

  // Determine trade quality
  const tradeQuality = getTradeQuality(totalConfluence, enginesAgreed);

  return {
    structureQuality,
    liquidityClarity,
    entryPrecision,
    sessionQuality,
    totalConfluence,
    tradeQuality,
    enginesAgreed,
  };
}

function scoreStructure(structure: MarketStructureResult): number {
  if (structure.bias === "NEUTRAL" || structure.structureState === "UNCLEAR") return 0;

  let score = 50;

  // Strong trend
  if (structure.trendStrength > 70) score += 25;
  else if (structure.trendStrength > 40) score += 15;

  // Clear structure state
  if (structure.structureState === "BOS") score += 25;
  else if (structure.structureState === "CHOCH") score += 20;
  else if (structure.structureState === "TRENDING") score += 15;

  return Math.min(score, 100);
}

function scoreLiquidity(liquidity: LiquidityResult): number {
  if (!liquidity.liquidityTaken) return 0;

  let score = 40;

  // Strength of sweep
  if (liquidity.strength > 70) score += 30;
  else if (liquidity.strength > 40) score += 20;
  else score += 10;

  // Clear direction
  if (liquidity.sweepDirection !== "NEUTRAL") score += 30;

  return Math.min(score, 100);
}

function scoreOrderFlow(orderFlow: OrderFlowResult): number {
  if (!orderFlow.confirmationStatus) return 0;

  let score = 40;

  // Entry model quality
  if (orderFlow.entryModel === "FVG") score += 25;
  else if (orderFlow.entryModel === "OB") score += 20;
  else if (orderFlow.entryModel === "BREAKER") score += 15;

  // Mitigation confirmation
  if (orderFlow.mitigation) score += 20;

  // Displacement
  if (orderFlow.displacement) score += 15;

  return Math.min(score, 100);
}

function scoreSession(session: SessionResult): number {
  if (!session.inKillzone) return 0;

  let score = 50;

  // Volatility bonus
  if (session.volatility === "HIGH") score += 30;
  else if (session.volatility === "MEDIUM") score += 20;

  // Killzone quality
  if (session.currentKillzone === "NEW_YORK") score += 20;
  else if (session.currentKillzone === "LONDON") score += 15;

  return Math.min(score, 100);
}

function countEnginesAgreed(
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  session: SessionResult,
): number {
  let count = 0;

  // Engine 1: Market Structure
  if (structure.bias !== "NEUTRAL" && structure.structureState !== "UNCLEAR") count++;

  // Engine 2: Liquidity
  if (liquidity.liquidityTaken) count++;

  // Engine 3: Order Flow
  if (orderFlow.confirmationStatus) count++;

  // Engine 4: Session
  if (session.inKillzone) count++;

  return count;
}

function getTradeQuality(score: number, enginesAgreed: number): TradeQuality {
  if (score >= 85 && enginesAgreed >= 4) return "HIGH";
  if (score >= 75 && enginesAgreed >= 3) return "MEDIUM";
  return "LOW";
}
