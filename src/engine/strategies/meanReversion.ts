// ============================================================================
// WARRIKS AI v5.1 — Mean Reversion Strategy
// Uses: RSI extremes + Bollinger Band touches + Z-score + ATR filter
// Concept: "Buy fear, sell greed" — fade overextended price moves
// ============================================================================

import type { Candle, StrategyResult } from "../types";
import { calculateAllIndicators } from "../indicators";

/**
 * Mean Reversion Strategy.
 *
 * Entry conditions:
 * 1. RSI < 30 (oversold) for BUY, RSI > 70 (overbought) for SELL
 * 2. Price touching/breaking Bollinger Band (upper for sell, lower for buy)
 * 3. Z-score > 2.0 (overextended) or < -2.0
 * 4. Confirmation: price starts reverting (closes back inside band)
 * 5. ADX < 35 (avoid strong trends — trend is your enemy for reversion)
 *
 * Higher confidence when multiple conditions align.
 */
export function analyzeMeanReversion(
  candles: Candle[],
  symbol: string,
): StrategyResult {
  if (candles.length < 30) {
    return {
      type: "MEAN_REVERSION",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Insufficient data for mean reversion analysis`,
      indicators: {},
      active: false,
    };
  }

  const ind = calculateAllIndicators(candles);

  if (ind.rsi === 50 && ind.bollinger.upper === ind.bollinger.lower) {
    return {
      type: "MEAN_REVERSION",
      direction: "NEUTRAL",
      confidence: 0,
      reason: `${symbol}: Cannot compute indicators`,
      indicators: { rsi: 50, zscore: 0, bollingerWidth: 0 },
      active: false,
    };
  }

  const lastPrice = candles[candles.length - 1].close;
  const prevCandle = candles[candles.length - 2];
  const prevClose = prevCandle.close;

  // ADX filter — avoid reversion in very strong trends
  const tooTrending = ind.adx >= 35;
  const moderateTrend = ind.adx >= 25 && ind.adx < 35;

  let confidence = 0;
  let direction: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let reason = "";

  // ─── Oversold — Reversion BUY Signal ─────────────────────────────────
  const oversoldRsi = ind.rsi < 35;
  const touchedLowerBandBool = lastPrice <= ind.bollinger.lower;
  const extremeZscore = ind.zscore < -1.8;
  const reversionConfirm = lastPrice > ind.bollinger.lower && prevClose <= ind.bollinger.lower;

  if ((oversoldRsi || touchedLowerBandBool || extremeZscore) && !tooTrending) {
    direction = "BUY";

    // Base score
    confidence = 40;

    // RSI oversold contribution
    if (ind.rsi < 25) confidence += 20;
    else if (ind.rsi < 30) confidence += 15;
    else if (ind.rsi < 35) confidence += 10;

    // Bollinger Band touch contribution
    if (touchedLowerBandBool) confidence += 15;

    // Z-score contribution
    if (ind.zscore < -2.5) confidence += 15;
    else if (ind.zscore < -2.0) confidence += 10;
    else if (ind.zscore < -1.8) confidence += 5;

    // Reversion confirmation (price already bouncing)
    if (reversionConfirm) confidence += 10;

    // Trend penalty — avoid reversion in strong trends
    if (moderateTrend) confidence -= 5;

    // Multiple confirmation bonus
    const confirmations = [oversoldRsi, touchedLowerBandBool, extremeZscore, reversionConfirm]
      .filter(Boolean).length;
    if (confirmations >= 3) confidence += 10;
    else if (confirmations >= 2) confidence += 5;

    confidence = Math.min(Math.max(Math.round(confidence), 0), 100);

    reason = `${symbol} BUY (Reversion): RSI ${ind.rsi.toFixed(1)} (oversold), Z-score ${ind.zscore.toFixed(2)}, Price at Bollinger lower ${ind.bollinger.lower.toFixed(2)}. ${confirmations}/${4} confirmations. Confidence ${confidence}%`;
  }
  // ─── Overbought — Reversion SELL Signal ──────────────────────────────
  const touchedUpperBandBool = lastPrice >= ind.bollinger.upper;
  if ((ind.rsi > 65 || touchedUpperBandBool || ind.zscore > 1.8) && !tooTrending) {
    direction = "SELL";

    confidence = 40;

    if (ind.rsi > 75) confidence += 20;
    else if (ind.rsi > 70) confidence += 15;
    else if (ind.rsi > 65) confidence += 10;

    if (touchedUpperBandBool) confidence += 15;

    if (ind.zscore > 2.5) confidence += 15;
    else if (ind.zscore > 2.0) confidence += 10;
    else if (ind.zscore > 1.8) confidence += 5;

    // Reversion confirmation
    if (lastPrice < ind.bollinger.upper && prevCandle.close >= ind.bollinger.upper) {
      confidence += 10;
    }

    if (moderateTrend) confidence -= 5;

    const confirmations = [
      ind.rsi > 65,
      touchedUpperBandBool,
      ind.zscore > 1.8,
      lastPrice < ind.bollinger.upper && prevCandle.close >= ind.bollinger.upper,
    ].filter(Boolean).length;
    if (confirmations >= 3) confidence += 10;
    else if (confirmations >= 2) confidence += 5;

    confidence = Math.min(Math.max(Math.round(confidence), 0), 100);

    reason = `${symbol} SELL (Reversion): RSI ${ind.rsi.toFixed(1)} (overbought), Z-score ${ind.zscore.toFixed(2)}, Price at Bollinger upper ${ind.bollinger.upper.toFixed(2)}. ${confirmations}/${4} confirmations. Confidence ${confidence}%`;
  }
  // ─── No Signal ───────────────────────────────────────────────────────
  else {
    const reasons: string[] = [];
    if (ind.rsi >= 35 && ind.rsi <= 65) reasons.push(`RSI ${ind.rsi.toFixed(1)} neutral`);
    if (!touchedLowerBandBool && !touchedUpperBandBool) {
      reasons.push("Price in Bollinger mid-range");
    }
    if (Math.abs(ind.zscore) < 1.8) reasons.push(`Z-score ${ind.zscore.toFixed(2)} not extreme`);
    if (tooTrending) reasons.push(`ADX ${ind.adx.toFixed(1)} too strong for reversion`);

    reason = `${symbol}: No reversion setup. ${reasons.join(", ")}`;
    confidence = Math.round(
      tooTrending ? 10 : Math.max(5, 30 - Math.abs(ind.zscore) * 5),
    );
  }

  return {
    type: "MEAN_REVERSION",
    direction,
    confidence,
    reason,
    indicators: {
      rsi: Math.round(ind.rsi * 10) / 10,
      zscore: Math.round(ind.zscore * 100) / 100,
      bollingerUpper: Math.round(ind.bollinger.upper * 100) / 100,
      bollingerLower: Math.round(ind.bollinger.lower * 100) / 100,
      bollingerWidth: Math.round(((ind.bollinger.upper - ind.bollinger.lower) / ind.bollinger.middle) * 10000) / 100,
      adx: Math.round(ind.adx * 10) / 10,
    },
    active: confidence >= 60,
  };
}
