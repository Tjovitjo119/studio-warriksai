// ============================================================================
// WARRIKS AI v5.1 — Momentum / Trend Following Strategy
// Uses: MACD crossover + ADX trend strength + EMA alignment
// Concept: "The trend is your friend" — enter on pullbacks in strong trends
// ============================================================================

import type { Candle, StrategyResult } from "../types";
import { calculateAllIndicators } from "../indicators";

/**
 * Momentum / Trend Following Strategy.
 *
 * Entry conditions:
 * 1. ADX > 25 (trending market)
 * 2. MACD histogram > 0 for bullish, < 0 for bearish
 * 3. EMA alignment: 9 > 21 for bullish, 9 < 21 for bearish
 * 4. Price near EMA21 (pullback) within 1 ATR
 *
 * Confidence weighted by ADX strength and MACD consistency.
 */
export function analyzeMomentum(
  candles: Candle[],
  symbol: string,
): StrategyResult {
  if (candles.length < 50) {
    return {
      type: "MOMENTUM",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Insufficient data for momentum analysis`,
      indicators: {},
      active: false,
    };
  }

  const ind = calculateAllIndicators(candles);

  if (ind.adx === 0) {
    return {
      type: "MOMENTUM",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Cannot compute ADX`,
      indicators: { adx: 0, macdHistogram: 0, ema9: 0, ema21: 0 },
      active: false,
    };
  }

  const isTrending = ind.adx >= 25;
  const macdBullish = ind.macd.histogram > 0;
  const macdBearish = ind.macd.histogram < 0;
  const emaBullish = ind.ema9 > ind.ema21;
  const emaBearish = ind.ema9 < ind.ema21;

  const lastPrice = candles[candles.length - 1].close;

  // Distance from EMA21 as % (for pullback detection)
  const distFromEma21 = ((lastPrice - ind.ema21) / ind.ema21) * 100;
  const nearEma21 = ind.atr > 0
    ? (ind.atr / ind.ema21) * 100 * 1.5
    : 0.5;

  // Score: 0–100
  let confidence = 0;
  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let reason = "";

  // ─── Bullish Momentum ──────────────────────────────────────────────────
  if (isTrending && macdBullish && emaBullish) {
    direction = "BUY";

    // Base score for meeting criteria
    confidence = 55;

    // ADX strength bonus
    if (ind.adx >= 35) confidence += 15;
    else if (ind.adx >= 30) confidence += 10;
    else confidence += 5;

    // MACD strength (histogram magnitude scaled)
    const macdStrength = Math.min(Math.abs(ind.macd.histogram) / 0.5, 1) * 15;
    confidence += macdStrength;

    // EMA alignment bonus — wider spread = stronger trend
    const emaSpread = ((ind.ema9 - ind.ema21) / ind.ema21) * 100;
    if (emaSpread > 0.1) confidence += 10;
    else if (emaSpread > 0.05) confidence += 5;

    // Pullback to EMA21 bonus (better entry)
    if (distFromEma21 < 0 && distFromEma21 > -nearEma21) {
      confidence += 5; // Price pulled back to EMA, good entry
    }

    // ADX > 40 = very strong trend
    if (ind.adx >= 40) confidence += 5;

    confidence = Math.min(Math.round(confidence), 100);

    reason = `${symbol} BUY: ADX ${ind.adx.toFixed(1)} (trending), MACD histogram ${ind.macd.histogram.toFixed(2)} (bullish), EMA9 ${ind.ema9.toFixed(2)} > EMA21 ${ind.ema21.toFixed(2)}. Confidence ${confidence}%`;
  }
  // ─── Bearish Momentum ────────────────────────────────────────────────
  else if (isTrending && macdBearish && emaBearish) {
    direction = "SELL";

    confidence = 55;

    if (ind.adx >= 35) confidence += 15;
    else if (ind.adx >= 30) confidence += 10;
    else confidence += 5;

    const macdStrength = Math.min(Math.abs(ind.macd.histogram) / 0.5, 1) * 15;
    confidence += macdStrength;

    const emaSpread = ((ind.ema21 - ind.ema9) / ind.ema21) * 100;
    if (emaSpread > 0.1) confidence += 10;
    else if (emaSpread > 0.05) confidence += 5;

    if (distFromEma21 > 0 && distFromEma21 < nearEma21) {
      confidence += 5;
    }

    if (ind.adx >= 40) confidence += 5;

    confidence = Math.min(Math.round(confidence), 100);

    reason = `${symbol} SELL: ADX ${ind.adx.toFixed(1)} (trending), MACD histogram ${ind.macd.histogram.toFixed(2)} (bearish), EMA9 ${ind.ema9.toFixed(2)} < EMA21 ${ind.ema21.toFixed(2)}. Confidence ${confidence}%`;
  }
  // ─── No Clear Momentum ───────────────────────────────────────────────
  else {
    const reasons: string[] = [];
    if (!isTrending) reasons.push(`ADX ${ind.adx.toFixed(1)} < 25 (no trend)`);
    if (!macdBullish && !macdBearish) reasons.push("MACD flat");
    if (!emaBullish && !emaBearish) reasons.push("EMAs crossing");

    reason = `${symbol}: No momentum signal. ${reasons.join(", ")}`;
    confidence = Math.round(
      isTrending ? 25 : ind.adx >= 20 ? 15 : 5,
    );
  }

  return {
    type: "MOMENTUM",
    direction,
    confidence,
    reason,
    indicators: {
      adx: Math.round(ind.adx * 10) / 10,
      macdHistogram: Math.round(ind.macd.histogram * 10000) / 10000,
      macdLine: Math.round(ind.macd.macdLine * 10000) / 10000,
      signalLine: Math.round(ind.macd.signalLine * 10000) / 10000,
      ema9: Math.round(ind.ema9 * 100) / 100,
      ema21: Math.round(ind.ema21 * 100) / 100,
      emaSpread: Math.round(((ind.ema9 - ind.ema21) / ind.ema21) * 10000) / 100,
    },
    active: confidence >= 60,
  };
}
