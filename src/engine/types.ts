// ============================================================================
// WARRIKS AI v5.1 — Core Types & Interfaces
// ============================================================================

export type Direction = "BUY" | "SELL" | "NEUTRAL";
export type MarketBias = "BULLISH" | "BEARISH" | "NEUTRAL";
export type StructureState = "BOS" | "CHOCH" | "RANGE" | "TRENDING" | "UNCLEAR";
export type OrderFlowModel = "FVG" | "OB" | "BREAKER" | "NONE";
export type TradeQuality = "LOW" | "MEDIUM" | "HIGH";
export type Status = "TRADE" | "NO_TRADE";
export type Killzone = "LONDON" | "NEW_YORK" | "ASIA" | "OFF_HOURS";
export type EntryStatus = "Active" | "Waiting" | "Invalid";

// ============================================================================
// Market Structure Engine
// ============================================================================
export interface MarketStructureResult {
  bias: MarketBias;
  structureState: StructureState;
  trendStrength: number; // 0–100
  description: string;
}

// ============================================================================
// Liquidity Engine
// ============================================================================
export interface LiquidityResult {
  sweepDirection: Direction;
  liquidityTaken: boolean;
  strength: number; // 0–100
  pools: LiquidityPool[];
  description: string;
}

export interface LiquidityPool {
  type: "EQUAL_HIGH" | "EQUAL_LOW" | "SESSION_HIGH" | "SESSION_LOW" | "ASIA_RANGE";
  price: number;
  taken: boolean;
}

// ============================================================================
// Order Flow Engine
// ============================================================================
export interface OrderFlowResult {
  entryModel: OrderFlowModel;
  entryZone: PriceZone;
  confirmationStatus: boolean;
  displacement: boolean;
  mitigation: boolean;
  description: string;
}

export interface PriceZone {
  high: number;
  low: number;
  midpoint: number;
}

// ============================================================================
// Session & Timing Engine
// ============================================================================
export interface SessionResult {
  inKillzone: boolean;
  currentKillzone: Killzone;
  volatility: "HIGH" | "MEDIUM" | "LOW";
  nextKillzone: Killzone | null;
  nextKillzoneTime: string | null;
  description: string;
}

// ============================================================================
// Probability Engine
// ============================================================================
export interface ProbabilityResult {
  structureQuality: number;
  liquidityClarity: number;
  entryPrecision: number;
  sessionQuality: number;
  totalConfluence: number; // 0–100
  tradeQuality: TradeQuality;
  enginesAgreed: number; // 0-4
}

// ============================================================================
// Final Trade Decision
// ============================================================================
export interface TradeDecision {
  symbol: string;
  direction: Direction;
  marketBias: MarketBias;
  structureState: StructureState;
  liquiditySweep: boolean;
  orderFlowModel: OrderFlowModel;
  entryZone: PriceZone;
  stopLoss: number;
  takeProfit: TPLevels;
  riskReward: number;
  confluenceScore: number;
  probabilityScore: number;
  tradeQuality: TradeQuality;
  status: Status;
  reason: string;
}

export interface TPLevels {
  tp1: number;
  tp2: number;
  tp3: number;
}

// ============================================================================
// Market Data / Candle
// ============================================================================
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  id: string;
  symbol: string;
  direction: Direction;
  entryZone: PriceZone;
  stopLoss: number;
  takeProfit: TPLevels;
  riskReward: number;
  confidence: number;
  enginesAgreed: number;
  killzone: Killzone;
  entryModel: OrderFlowModel;
  status: EntryStatus;
  timestamp: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  riskReward: number;
  status: "WIN" | "LOSS" | "OPEN";
  timestamp: number;
  exitTimestamp: number | null;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

// ============================================================================
// Multi-Strategy Engine Types
// ============================================================================
export type StrategyType = "ICT_SMC" | "MOMENTUM" | "MEAN_REVERSION" | "BREAKOUT";
export type AgreementLevel = "STRONG" | "MODERATE" | "WEAK" | "CONFLICT";

// Individual strategy output
export interface StrategyResult {
  type: StrategyType;
  direction: Direction;
  confidence: number; // 0–100
  reason: string;
  indicators: Record<string, number>;
  active: boolean;
}

// Combined multi-strategy output
export interface MultiStrategyOutput {
  strategies: StrategyResult[];
  agreement: AgreementLevel;
  consensusDirection: Direction;
  buyVotes: number;
  sellVotes: number;
  neutralVotes: number;
  topStrategy: StrategyType;
  avgConfidence: number;
}

// Technical indicator values
export interface IndicatorValues {
  rsi: number;
  macd: { macdLine: number; signalLine: number; histogram: number };
  adx: number;
  bollinger: { upper: number; middle: number; lower: number };
  donchian: { upper: number; middle: number; lower: number };
  sma20: number;
  sma50: number;
  ema9: number;
  ema21: number;
  atr: number;
  volumeAvg: number;
  zscore: number;
}

export const DEFAULT_SYMBOLS = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"] as const;
export type SymbolName = (typeof DEFAULT_SYMBOLS)[number];

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  ICT_SMC: "ICT / SMC",
  MOMENTUM: "Momentum",
  MEAN_REVERSION: "Mean Reversion",
  BREAKOUT: "Breakout",
};
