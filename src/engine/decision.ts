// ============================================================================
// WARRIKS AI v5.1 — Central Decision Engine (Final Logic)
// Purpose: Combine all engine outputs into a final trade/no-trade decision
// ============================================================================

import type {
  Candle,
  MarketStructureResult,
  LiquidityResult,
  OrderFlowResult,
  SessionResult,
  ProbabilityResult,
  TradeDecision,
} from "./types";
import { analyzeMarketStructure } from "./marketStructure";
import { analyzeLiquidity } from "./liquidity";
import { analyzeOrderFlow } from "./orderFlow";
import { analyzeSession } from "./session";
import { calculateProbability } from "./probability";

/**
 * Run the full WARRIKS AI decision pipeline across all 5 engines.
 *
 * @returns A strict TradeDecision with status TRADE or NO_TRADE
 */
export function runDecisionEngine(
  symbol: string,
  candles: Candle[],
): TradeDecision {
  // Run all 4 strategy engines in sequence
  const structure = analyzeMarketStructure(candles, symbol);
  const liquidity = analyzeLiquidity(candles, symbol);
  const orderFlow = analyzeOrderFlow(
    candles,
    liquidity.sweepDirection,
    symbol,
  );
  const session = analyzeSession();
  const probability = calculateProbability(
    structure,
    liquidity,
    orderFlow,
    session,
  );

  // All conditions must be met for a TRADE
  const conditionsMet = checkAllConditions(
    structure,
    liquidity,
    orderFlow,
    session,
    probability,
  );

  if (!conditionsMet) {
    return {
      symbol,
      direction: "NEUTRAL",
      marketBias: structure.bias,
      structureState: structure.structureState,
      liquiditySweep: liquidity.liquidityTaken,
      orderFlowModel: orderFlow.entryModel,
      entryZone: orderFlow.entryZone,
      stopLoss: 0,
      takeProfit: { tp1: 0, tp2: 0, tp3: 0 },
      riskReward: 0,
      confluenceScore: probability.totalConfluence,
      probabilityScore: Math.round(
        (probability.structureQuality +
          probability.liquidityClarity +
          probability.entryPrecision +
          probability.sessionQuality) /
          4,
      ),
      tradeQuality: probability.tradeQuality,
      status: "NO_TRADE",
      reason: buildNoTradeReason(
        structure,
        liquidity,
        orderFlow,
        session,
        probability,
      ),
    };
  }

  // Calculate trade parameters
  const direction = determineDirection(
    structure,
    liquidity,
    orderFlow,
  );
  const { stopLoss, takeProfit } = calculateRiskParameters(
    direction,
    orderFlow.entryZone,
    candles,
  );
  const riskReward = calculateRiskReward(
    direction,
    orderFlow.entryZone.midpoint,
    stopLoss,
    takeProfit.tp1,
  );

  return {
    symbol,
    direction,
    marketBias: structure.bias,
    structureState: structure.structureState,
    liquiditySweep: liquidity.liquidityTaken,
    orderFlowModel: orderFlow.entryModel,
    entryZone: orderFlow.entryZone,
    stopLoss,
    takeProfit,
    riskReward: Math.round(riskReward * 10) / 10,
    confluenceScore: probability.totalConfluence,
    probabilityScore: Math.round(
      (probability.structureQuality +
        probability.liquidityClarity +
        probability.entryPrecision +
        probability.sessionQuality) /
        4,
    ),
    tradeQuality: probability.tradeQuality,
    status: "TRADE",
    reason: buildTradeReason(
      symbol,
      direction,
      structure,
      orderFlow,
      probability,
    ),
  };
}

export function checkAllConditions(
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  session: SessionResult,
  probability: ProbabilityResult,
): boolean {
  // 1. Market structure bias is clear
  if (structure.bias === "NEUTRAL" || structure.structureState === "UNCLEAR") return false;

  // 2. Liquidity sweep is confirmed
  if (!liquidity.liquidityTaken) return false;

  // 3. Order flow entry exists
  if (!orderFlow.confirmationStatus) return false;

  // 4. Timing is within killzone (NY time)
  if (!session.inKillzone) return false;

  // 5. Confluence score ≥ 75
  if (probability.totalConfluence < 75) return false;

  // 6. At least 3 of 4 engines agree
  if (probability.enginesAgreed < 3) return false;

  return true;
}

function determineDirection(
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
): "BUY" | "SELL" {
  // If structure is bullish and sweep was to the downside → BUY
  if (
    structure.bias === "BULLISH" &&
    liquidity.sweepDirection === "BUY"
  ) {
    return "BUY";
  }
  // If structure is bearish and sweep was to the upside → SELL
  if (
    structure.bias === "BEARISH" &&
    liquidity.sweepDirection === "SELL"
  ) {
    return "SELL";
  }

  // Fallback to order flow direction
  if (structure.bias === "BULLISH") return "BUY";
  if (structure.bias === "BEARISH") return "SELL";

  return liquidity.sweepDirection === "BUY" ? "BUY" : "SELL";
}

function calculateRiskParameters(
  direction: "BUY" | "SELL",
  entryZone: { high: number; low: number; midpoint: number },
  candles: Candle[],
): { stopLoss: number; takeProfit: { tp1: number; tp2: number; tp3: number } } {
  const entry = entryZone.midpoint;
  const recentCandles = candles.slice(-10);
  const atr = calculateATR(recentCandles, 10);

  if (atr <= 0) {
    return {
      stopLoss: entry * (direction === "BUY" ? 0.99 : 1.01),
      takeProfit: { tp1: entry * 1.01, tp2: entry * 1.02, tp3: entry * 1.03 },
    };
  }

  const slDistance = atr * 1.5;

  if (direction === "BUY") {
    const sl = entry - slDistance;
    return {
      stopLoss: Math.round(sl * 100) / 100,
      takeProfit: {
        tp1: Math.round((entry + slDistance * 2) * 100) / 100,
        tp2: Math.round((entry + slDistance * 3) * 100) / 100,
        tp3: Math.round((entry + slDistance * 4.5) * 100) / 100,
      },
    };
  } else {
    const sl = entry + slDistance;
    return {
      stopLoss: Math.round(sl * 100) / 100,
      takeProfit: {
        tp1: Math.round((entry - slDistance * 2) * 100) / 100,
        tp2: Math.round((entry - slDistance * 3) * 100) / 100,
        tp3: Math.round((entry - slDistance * 4.5) * 100) / 100,
      },
    };
  }
}

function calculateATR(candles: Candle[], period: number): number {
  if (candles.length < 2) return 0;

  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
    trValues.push(tr);
  }

  if (trValues.length === 0) return 0;
  return trValues.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trValues.length);
}

function calculateRiskReward(
  direction: "BUY" | "SELL",
  entry: number,
  stopLoss: number,
  takeProfit: number,
): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk === 0) return 0;
  return reward / risk;
}

function buildTradeReason(
  symbol: string,
  direction: string,
  structure: MarketStructureResult,
  orderFlow: OrderFlowResult,
  probability: ProbabilityResult,
): string {
  return `${symbol} ${direction}: ${structure.bias} ${structure.structureState} + ${orderFlow.entryModel} entry. Confluence ${probability.totalConfluence}/100 (${probability.enginesAgreed}/4 engines)`;
}

function buildNoTradeReason(
  structure: MarketStructureResult,
  liquidity: LiquidityResult,
  orderFlow: OrderFlowResult,
  session: SessionResult,
  probability: ProbabilityResult,
): string {
  const reasons: string[] = [];

  if (structure.bias === "NEUTRAL" || structure.structureState === "UNCLEAR") {
    reasons.push("No clear market structure");
  }
  if (!liquidity.liquidityTaken) reasons.push("No liquidity sweep");
  if (!orderFlow.confirmationStatus) reasons.push("No valid entry model");
  if (!session.inKillzone) reasons.push("Outside killzone");
  if (probability.totalConfluence < 75) reasons.push(`Confluence ${probability.totalConfluence}/75`);
  if (probability.enginesAgreed < 3) reasons.push(`Only ${probability.enginesAgreed}/4 engines`);

  return `Insufficient confluence: ${reasons.join(", ")}`;
}
