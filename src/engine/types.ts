// ============================================================================
// WARRIKS AI v5.2 — Core Types & Interfaces
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

// ============================================================================
// Secondary Strategy Engine Types (v5.2)
// ============================================================================

export type StrategyEngineType =
  | "MSS_FVG"
  | "JUDAS_SWING"
  | "BREAKER_BLOCK"
  | "VWAP_REVERSION"
  | "DAILY_RANGE_EXPANSION"
  | "TURTLE_BREAKOUT";

export type VoteStrength =
  | "STRONG_BULLISH"
  | "STRONG_BEARISH"
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL";

export type StrategyPriority = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export type SessionPriority = "HIGHEST" | "SECOND" | "THIRD" | "LOWEST";

// Individual secondary strategy engine output
export interface StrategyEngineResult {
  type: StrategyEngineType;
  direction: Direction;
  voteStrength: VoteStrength;
  confidence: number; // 0–100
  signal: boolean;
  reason: string;
  priority: StrategyPriority;
  indicators: Record<string, number>;
  active: boolean;
}

// Strategy Agreement Matrix
export type AgreementLevelV2 = "ELITE" | "INSTITUTIONAL_GRADE" | "HIGH_PROBABILITY" | "MODERATE_PROBABILITY" | "NO_TRADE";

// Confluence booster record
export interface ConfluenceBooster {
  label: string;
  points: number;
  applied: boolean;
}

// Combined output from the combination engine
export interface CombinationResult {
  engines: StrategyEngineResult[];
  agreement: AgreementLevelV2;
  agreementCount: number; // 0–6
  consensusDirection: Direction;
  confluenceScore: number; // 0–100 after boosters
  boostersApplied: ConfluenceBooster[];
  sessionPriority: SessionPriority;
  tradeable: boolean;
  description: string;
}

// VWAP calculation result
export interface VWAPResult {
  current: number;
  deviation: number; // % distance from VWAP
  above: boolean;
}

// Daily range information
export interface DailyRange {
  high: number;
  low: number;
  mid: number;
  expanded: boolean;
  expansionPercent: number;
}

// Asian session range
export interface AsianRange {
  high: number;
  low: number;
  midpoint: number;
}

// Engine labels for display
export const ENGINE_LABELS: Record<StrategyEngineType, string> = {
  MSS_FVG: "MSS + FVG (Primary)",
  JUDAS_SWING: "Judas Swing Reversal",
  BREAKER_BLOCK: "Breaker Block Execution",
  VWAP_REVERSION: "VWAP Institutional Reversion",
  DAILY_RANGE_EXPANSION: "Daily Range Expansion",
  TURTLE_BREAKOUT: "Turtle Breakout Filter",
};

export const AGREEMENT_LABELS: Record<AgreementLevelV2, string> = {
  ELITE: "Elite Setup — Maximum Confidence",
  INSTITUTIONAL_GRADE: "Institutional Grade Setup",
  HIGH_PROBABILITY: "High Probability Setup",
  MODERATE_PROBABILITY: "Moderate Probability Setup",
  NO_TRADE: "NO TRADE — Insufficient Agreement",
};

export const SESSION_PRIORITY_LABELS: Record<SessionPriority, string> = {
  HIGHEST: "Highest Priority (08:30–11:00 NY)",
  SECOND: "Second Priority (07:00–08:30 NY)",
  THIRD: "Third Priority (13:00–15:00 NY)",
  LOWEST: "Lowest Priority — Outside Approved Sessions",
};
