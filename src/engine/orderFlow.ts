// ============================================================================
// WARRIKS AI v5.1 — Order Flow Engine (5M / 1M)
// Purpose: Detect execution zones, FVGs, order blocks, confirm displacement
// ============================================================================

import type { Candle, OrderFlowModel, OrderFlowResult, PriceZone } from "./types";

/**
 * Analyze order flow to find valid entry models after a liquidity sweep.
 */
export function analyzeOrderFlow(
  candles: Candle[],
  sweepDirection: "BUY" | "SELL" | "NEUTRAL",
  symbol: string,
): OrderFlowResult {
  if (candles.length < 15) {
    return {
      entryModel: "NONE",
      entryZone: { high: 0, low: 0, midpoint: 0 },
      confirmationStatus: false,
      displacement: false,
      mitigation: false,
      description: "Insufficient data for order flow analysis",
    };
  }

  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const recentCandles = sorted.slice(-20);

  // Detect Fair Value Gaps (FVG)
  const fvgs = detectFVGs(recentCandles);

  // Detect Order Blocks
  const obs = detectOrderBlocks(recentCandles);

  // Detect Breaker Blocks
  const breakers = detectBreakers(recentCandles);

  // Select the best entry model based on sweep direction
  let entryModel: OrderFlowModel = "NONE";
  let entryZone: PriceZone = { high: 0, low: 0, midpoint: 0 };
  let displacement = false;
  let mitigation = false;

  const lastCandle = recentCandles[recentCandles.length - 1];

  if (sweepDirection === "BUY") {
    // After a sell-side sweep (buying opportunity), look for bullish setups
    const bullishFvg = fvgs.find(
      (f) => f.high >= lastCandle.low && f.low <= lastCandle.high,
    );
    const bullishOb = obs.find(
      (o) => o.high >= lastCandle.low && o.low <= lastCandle.high,
    );
    const bullishBreaker = breakers.find(
      (b) => b.high >= lastCandle.low && b.low <= lastCandle.high,
    );

    if (bullishFvg) {
      entryModel = "FVG";
      entryZone = bullishFvg;
      displacement = true;
      mitigation = lastCandle.close > bullishFvg.midpoint;
    } else if (bullishOb) {
      entryModel = "OB";
      entryZone = bullishOb;
      displacement = true;
      mitigation = lastCandle.close > bullishOb.midpoint;
    } else if (bullishBreaker) {
      entryModel = "BREAKER";
      entryZone = bullishBreaker;
      displacement = true;
      mitigation = lastCandle.close > bullishBreaker.midpoint;
    }
  } else if (sweepDirection === "SELL") {
    // After a buy-side sweep (selling opportunity), look for bearish setups
    const bearishFvg = fvgs.find(
      (f) => f.high >= lastCandle.high && f.low <= lastCandle.high,
    );
    const bearishOb = obs.find(
      (o) => o.high >= lastCandle.high && o.low <= lastCandle.high,
    );
    const bearishBreaker = breakers.find(
      (b) => b.high >= lastCandle.high && b.low <= lastCandle.high,
    );

    if (bearishFvg) {
      entryModel = "FVG";
      entryZone = bearishFvg;
      displacement = true;
      mitigation = lastCandle.close < bearishFvg.midpoint;
    } else if (bearishOb) {
      entryModel = "OB";
      entryZone = bearishOb;
      displacement = true;
      mitigation = lastCandle.close < bearishOb.midpoint;
    } else if (bearishBreaker) {
      entryModel = "BREAKER";
      entryZone = bearishBreaker;
      displacement = true;
      mitigation = lastCandle.close < bearishBreaker.midpoint;
    }
  }

  const confirmationStatus = entryModel !== "NONE";

  return {
    entryModel,
    entryZone,
    confirmationStatus,
    displacement,
    mitigation,
    description: buildOrderFlowDescription(entryModel, entryZone, symbol),
  };
}

function detectFVGs(candles: Candle[]): PriceZone[] {
  const fvgs: PriceZone[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // Bullish FVG: prev high < curr low (gap up)
    if (prev.high < curr.low) {
      fvgs.push({
        high: curr.low,
        low: prev.high,
        midpoint: (curr.low + prev.high) / 2,
      });
    }

    // Bearish FVG: prev low > curr high (gap down)
    if (prev.low > curr.high) {
      fvgs.push({
        high: prev.low,
        low: curr.high,
        midpoint: (prev.low + curr.high) / 2,
      });
    }
  }

  return fvgs;
}

function detectOrderBlocks(candles: Candle[]): PriceZone[] {
  const obs: PriceZone[] = [];

  for (let i = 3; i < candles.length; i++) {
    const prevCandle = candles[i - 1];
    const candle = candles[i];
    const nextCandle = candles[i + 1] || candle;

    // Bullish OB: last bearish candle before a bullish move
    if (
      prevCandle.close < prevCandle.open &&
      candle.close > candle.open &&
      candle.high > prevCandle.high
    ) {
      obs.push({
        high: prevCandle.high,
        low: prevCandle.low,
        midpoint: (prevCandle.high + prevCandle.low) / 2,
      });
    }

    // Bearish OB: last bullish candle before a bearish move
    if (
      prevCandle.close > prevCandle.open &&
      candle.close < candle.open &&
      candle.low < prevCandle.low
    ) {
      obs.push({
        high: prevCandle.high,
        low: prevCandle.low,
        midpoint: (prevCandle.high + prevCandle.low) / 2,
      });
    }
  }

  return obs;
}

function detectBreakers(candles: Candle[]): PriceZone[] {
  const breakers: PriceZone[] = [];

  for (let i = 2; i < candles.length; i++) {
    const candle2 = candles[i - 2];
    const candle1 = candles[i - 1];
    const candle = candles[i];

    // Breaker block: order block that got mitigated
    const isBullishBreaker =
      candle1.close < candle1.open &&
      candle.close > candle.open &&
      candle.close > candle2.high;

    const isBearishBreaker =
      candle1.close > candle1.open &&
      candle.close < candle.open &&
      candle.close < candle2.low;

    if (isBullishBreaker) {
      breakers.push({
        high: candle.high,
        low: candle.low,
        midpoint: (candle.high + candle.low) / 2,
      });
    }

    if (isBearishBreaker) {
      breakers.push({
        high: candle.high,
        low: candle.low,
        midpoint: (candle.high + candle.low) / 2,
      });
    }
  }

  return breakers;
}

function buildOrderFlowDescription(
  model: OrderFlowModel,
  zone: PriceZone,
  symbol: string,
): string {
  if (model === "NONE") return `${symbol}: No valid entry model detected`;
  return `${symbol}: ${model} detected at ${zone.midpoint.toFixed(2)}`;
}
