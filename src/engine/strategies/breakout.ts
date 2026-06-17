// ============================================================================
// WARRIKS AI v5.1 — Breakout / Volatility Expansion Strategy
// Uses: Donchian Channel breakout + Volume confirmation + ATR expansion
// Concept: "Breakouts with volume are real" — trade volatility expansions
// ============================================================================

import type { Candle, StrategyResult } from "../types";
import { calculateAllIndicators } from "../indicators";

/**
 * Breakout / Volatility Expansion Strategy.
 *
 * Entry conditions:
 * 1. Price breaks above Donchian upper (BUY) or below Donchian lower (SELL)
 * 2. Volume > 1.5x average volume (confirmation)
 * 3. ATR expanding (volatility increasing)
 * 4. Price holds above/below breakout level (no false breakout)
 *
 * Higher confidence when:
 * - Volume significantly above average
 * - ATR expanding from contraction
 * - Multiple timeframe confluence
 */
export function analyzeBreakout(
  candles: Candle[],
  symbol: string,
): StrategyResult {
  if (candles.length < 30) {
    return {
      type: "BREAKOUT",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Insufficient data for breakout analysis`,
      indicators: {},
      active: false,
    };
  }

  const ind = calculateAllIndicators(candles);

  if (ind.donchian.upper === ind.donchian.lower) {
    return {
      type: "BREAKOUT",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Cannot compute Donchian channel`,
      indicators: { donchianUpper: 0, donchianLower: 0, volumeRatio: 0 },
      active: false,
    };
  }

  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const lastVolume = lastCandle.volume;

  // Volume confirmation
  const volumeRatio = ind.volumeAvg > 0 ? lastVolume / ind.volumeAvg : 1;
  const volumeConfirmed = volumeRatio >= 1.4;
  const volumeStrong = volumeRatio >= 2.0;

  // ATR volatility context
  const prevCandles = candles.slice(-30, -1);
  const prevAtr = prevCandles.length > 14
    ? calculateATRSimple(prevCandles, 14)
    : ind.atr;
  const atrExpanding = ind.atr > prevAtr * 1.05;

  // Check if price broke out in the last few candles
  const recentCandles = candles.slice(-5, -1);
  const brokeUpper = recentCandles.some((c) => c.high > ind.donchian.upper * 0.999);
  const brokeLower = recentCandles.some((c) => c.low < ind.donchian.lower * 1.001);
  const holdingAbove = lastPrice > ind.donchian.upper * 0.998;
  const holdingBelow = lastPrice < ind.donchian.lower * 1.002;

  // Channel width (tight = potential squeeze)
  const channelWidth = ((ind.donchian.upper - ind.donchian.lower) / ind.donchian.middle) * 100;
  const squeezeDetected = channelWidth < 3.0; // Tight range

  let confidence = 0;
  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let reason = "";

  // ─── Bullish Breakout ────────────────────────────────────────────────
  if (brokeUpper && holdingAbove && volumeConfirmed) {
    direction = "BUY";
    confidence = 50;

    // Volume strength bonus
    if (volumeStrong) confidence += 15;
    else confidence += 8;

    // ATR expansion bonus
    if (atrExpanding) confidence += 10;

    // Squeeze breakout bonus (more powerful)
    if (squeezeDetected) confidence += 15;

    // Holding above breakout level = conviction
    const barsAbove = recentCandles.filter((c) => c.close > ind.donchian.upper).length;
    if (barsAbove >= 2) confidence += 10;
    else if (barsAbove >= 1) confidence += 5;

    confidence = Math.min(Math.round(confidence), 100);

    reason = `${symbol} BUY (Breakout): Price above Donchian ${ind.donchian.upper.toFixed(2)}, Volume ${volumeRatio.toFixed(1)}x avg${volumeStrong ? " (strong)" : ""}. Channel width ${channelWidth.toFixed(1)}%${squeezeDetected ? " (squeeze)" : ""}. Confidence ${confidence}%`;
  }
  // ─── Bearish Breakdown ───────────────────────────────────────────────
  else if (brokeLower && holdingBelow && volumeConfirmed) {
    direction = "SELL";
    confidence = 50;

    if (volumeStrong) confidence += 15;
    else confidence += 8;

    if (atrExpanding) confidence += 10;

    if (squeezeDetected) confidence += 15;

    const barsBelow = recentCandles.filter((c) => c.close < ind.donchian.lower).length;
    if (barsBelow >= 2) confidence += 10;
    else if (barsBelow >= 1) confidence += 5;

    confidence = Math.min(Math.round(confidence), 100);

    reason = `${symbol} SELL (Breakdown): Price below Donchian ${ind.donchian.lower.toFixed(2)}, Volume ${volumeRatio.toFixed(1)}x avg${volumeStrong ? " (strong)" : ""}. Channel width ${channelWidth.toFixed(1)}%${squeezeDetected ? " (squeeze)" : ""}. Confidence ${confidence}%`;
  }
  // ─── Partial / Weak Setup ────────────────────────────────────────────
  else if (brokeUpper && holdingAbove && !volumeConfirmed) {
    direction = "NEUTRAL";
    confidence = 35;
    reason = `${symbol}: Price broke Donchian upper but volume low (${volumeRatio.toFixed(1)}x avg). Possible false breakout.`;
  }
  else if (brokeLower && holdingBelow && !volumeConfirmed) {
    direction = "NEUTRAL";
    confidence = 35;
    reason = `${symbol}: Price broke Donchian lower but volume low (${volumeRatio.toFixed(1)}x avg). Possible false breakdown.`;
  }
  // ─── No Breakout ─────────────────────────────────────────────────────
  else {
    const reasons: string[] = [];
    if (!brokeUpper && !brokeLower) reasons.push("No channel break");
    if (!volumeConfirmed && brokeUpper || brokeLower) reasons.push("Volume insufficient");
    if (squeezeDetected) reasons.push("Range squeeze (watch for breakout)");

    reason = `${symbol}: No breakout. ${reasons.join(", ")}`;
    confidence = squeezeDetected ? 20 : 5;
  }

  return {
    type: "BREAKOUT",
    direction,
    confidence,
    reason,
    indicators: {
      donchianUpper: Math.round(ind.donchian.upper * 100) / 100,
      donchianLower: Math.round(ind.donchian.lower * 100) / 100,
      channelWidth: Math.round(channelWidth * 10) / 10,
      volumeRatio: Math.round(volumeRatio * 10) / 10,
      atr: Math.round(ind.atr * 100) / 100,
      atrExpanding: atrExpanding ? 1 : 0,
      squeezeDetected: squeezeDetected ? 1 : 0,
    },
    active: confidence >= 60,
  };
}

function calculateATRSimple(candles: Candle[], period: number): number {
  if (candles.length < 2) return 0;
  const trValues: number[] = [];
  for (let i = Math.max(1, candles.length - period); i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    );
    trValues.push(tr);
  }
  if (trValues.length === 0) return 0;
  return trValues.reduce((s, v) => s + v, 0) / trValues.length;
}
