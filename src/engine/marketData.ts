// ============================================================================
// WARRIKS AI — Market Data Generator
// Creates realistic synthetic candlestick data for all trading symbols
// ============================================================================

import type { Candle, MarketData, Signal, TradeRecord } from "./types";

// Base prices for each symbol
const BASE_PRICES: Record<string, number> = {
  NAS100: 19550.0,
  XAUUSD: 2340.0,
  EURUSD: 1.0850,
  GBPUSD: 1.2650,
};

// Typical pip values
const VOLATILITY: Record<string, number> = {
  NAS100: 80,
  XAUUSD: 12,
  EURUSD: 0.0020,
  GBPUSD: 0.0025,
};

/**
 * Generate realistic candlestick data for a symbol.
 */
export function generateCandles(
  symbol: string,
  count: number = 100,
): Candle[] {
  const basePrice = BASE_PRICES[symbol] || 100;
  const volatility = VOLATILITY[symbol] || 1;
  const now = Date.now();
  const candles: Candle[] = [];
  let price = basePrice;

  // Trend bias (random walk with slight drift)
  const drift = (Math.random() - 0.48) * volatility * 0.1;

  for (let i = count; i > 0; i--) {
    const timestamp = now - i * 60000; // 1-minute candles
    const open = price;
    const change = drift + (Math.random() - 0.5) * volatility * 0.5;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.8;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.8;
    const volume = Math.floor(Math.random() * 1000 + 100);

    candles.push({
      timestamp,
      open: Math.round(open * 10000) / 10000,
      high: Math.round(high * 10000) / 10000,
      low: Math.round(low * 10000) / 10000,
      close: Math.round(close * 10000) / 10000,
      volume,
    });

    price = close;
  }

  return candles;
}

/**
 * Generate all symbol candles in batch.
 */
export function generateAllCandles(
  count: number = 100,
): Record<string, Candle[]> {
  return {
    NAS100: generateCandles("NAS100", count),
    XAUUSD: generateCandles("XAUUSD", count),
    EURUSD: generateCandles("EURUSD", count),
    GBPUSD: generateCandles("GBPUSD", count),
  };
}

/**
 * Get current market snapshot for all symbols.
 */
export function getMarketSnapshot(
  symbol: string,
  candles: Candle[],
): MarketData {
  if (candles.length < 2) {
    return {
      symbol,
      price: BASE_PRICES[symbol] || 100,
      change: 0,
      changePercent: 0,
      high: BASE_PRICES[symbol] || 100,
      low: BASE_PRICES[symbol] || 100,
      volume: 0,
    };
  }

  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = latest.close - prev.close;
  const changePercent = (change / prev.close) * 100;

  return {
    symbol,
    price: latest.close,
    change,
    changePercent,
    high: Math.max(...candles.map((c) => c.high)),
    low: Math.min(...candles.map((c) => c.low)),
    volume: candles.slice(-24).reduce((s, c) => s + c.volume, 0),
  };
}

// Mock trade storage for history
const mockTradeHistory: TradeRecord[] = [
  {
    id: "TR-001",
    symbol: "NAS100",
    direction: "BUY",
    entryPrice: 19420.5,
    exitPrice: 19580.3,
    stopLoss: 19350.0,
    takeProfit: 19650.0,
    quantity: 0.5,
    pnl: 79.9,
    pnlPercent: 0.82,
    riskReward: 1.8,
    status: "WIN",
    timestamp: Date.now() - 7200000,
    exitTimestamp: Date.now() - 3600000,
  },
  {
    id: "TR-002",
    symbol: "XAUUSD",
    direction: "SELL",
    entryPrice: 2355.2,
    exitPrice: 2338.9,
    stopLoss: 2365.0,
    takeProfit: 2325.0,
    quantity: 2.0,
    pnl: 32.6,
    pnlPercent: 0.69,
    riskReward: 1.5,
    status: "WIN",
    timestamp: Date.now() - 14400000,
    exitTimestamp: Date.now() - 10800000,
  },
  {
    id: "TR-003",
    symbol: "EURUSD",
    direction: "BUY",
    entryPrice: 1.0830,
    exitPrice: 1.0805,
    stopLoss: 1.0800,
    takeProfit: 1.0890,
    quantity: 10000,
    pnl: -25.0,
    pnlPercent: -0.23,
    riskReward: 2.0,
    status: "LOSS",
    timestamp: Date.now() - 21600000,
    exitTimestamp: Date.now() - 18000000,
  },
  {
    id: "TR-004",
    symbol: "GBPUSD",
    direction: "SELL",
    entryPrice: 1.2680,
    exitPrice: 1.2640,
    stopLoss: 1.2720,
    takeProfit: 1.2580,
    quantity: 15000,
    pnl: 60.0,
    pnlPercent: 0.32,
    riskReward: 1.0,
    status: "WIN",
    timestamp: Date.now() - 36000000,
    exitTimestamp: Date.now() - 28800000,
  },
  {
    id: "TR-005",
    symbol: "NAS100",
    direction: "SELL",
    entryPrice: 19600.0,
    exitPrice: 19680.0,
    stopLoss: 19680.0,
    takeProfit: 19450.0,
    quantity: 0.3,
    pnl: -24.0,
    pnlPercent: -0.41,
    riskReward: 2.5,
    status: "LOSS",
    timestamp: Date.now() - 43200000,
    exitTimestamp: Date.now() - 39600000,
  },
];

export function getMockTradeHistory(): TradeRecord[] {
  return mockTradeHistory;
}

export function getMockSignals(): Signal[] {
  return [
    {
      id: "SIG-001",
      symbol: "NAS100",
      direction: "BUY",
      entryZone: { high: 19520.0, low: 19480.0, midpoint: 19500.0 },
      stopLoss: 19380.0,
      takeProfit: { tp1: 19620.0, tp2: 19700.0, tp3: 19850.0 },
      riskReward: 2.4,
      confidence: 87,
      enginesAgreed: 4,
      killzone: "NEW_YORK",
      entryModel: "FVG",
      status: "Active",
      timestamp: Date.now() - 1800000,
    },
    {
      id: "SIG-002",
      symbol: "XAUUSD",
      direction: "SELL",
      entryZone: { high: 2350.0, low: 2344.0, midpoint: 2347.0 },
      stopLoss: 2360.0,
      takeProfit: { tp1: 2330.0, tp2: 2320.0, tp3: 2305.0 },
      riskReward: 2.0,
      confidence: 82,
      enginesAgreed: 3,
      killzone: "LONDON",
      entryModel: "OB",
      status: "Active",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "SIG-003",
      symbol: "EURUSD",
      direction: "BUY",
      entryZone: { high: 1.0865, low: 1.0850, midpoint: 1.0858 },
      stopLoss: 1.0820,
      takeProfit: { tp1: 1.0900, tp2: 1.0925, tp3: 1.0960 },
      riskReward: 2.5,
      confidence: 76,
      enginesAgreed: 3,
      killzone: "NEW_YORK",
      entryModel: "BREAKER",
      status: "Waiting",
      timestamp: Date.now() - 5400000,
    },
    {
      id: "SIG-004",
      symbol: "GBPUSD",
      direction: "SELL",
      entryZone: { high: 1.2690, low: 1.2675, midpoint: 1.2682 },
      stopLoss: 1.2730,
      takeProfit: { tp1: 1.2630, tp2: 1.2590, tp3: 1.2530 },
      riskReward: 2.1,
      confidence: 91,
      enginesAgreed: 4,
      killzone: "LONDON",
      entryModel: "FVG",
      status: "Active",
      timestamp: Date.now() - 600000,
    },
  ];
}
