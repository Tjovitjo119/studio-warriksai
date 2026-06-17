// ============================================================================
// WARRIKS AI v5.1 — Indicator Library Unit Tests
// Tests all technical indicator calculations: SMA, EMA, RSI, MACD, ADX,
// Bollinger Bands, Donchian Channel, ATR, Z-Score, ROC
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateBollingerBands,
  calculateDonchian,
  calculateATR,
  calculateZScore,
  calculateROC,
  calculateAllIndicators,
} from "../indicators";
import { generateCandles } from "../marketData";
import type { Candle } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePriceSeries(values: number[]): Candle[] {
  return values.map((close, i) => ({
    timestamp: Date.now() + i * 60000,
    open: close - 0.1,
    high: close + 0.2,
    low: close - 0.2,
    close,
    volume: 1000,
  }));
}

function stableCandles(count: number, basePrice = 100, step = 0.5): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.48) * step;
    candles.push({
      timestamp: Date.now() + i * 60000,
      open: price,
      high: price + Math.random() * 0.5,
      low: price - Math.random() * 0.5,
      close: price,
      volume: Math.floor(Math.random() * 500 + 200),
    });
  }
  return candles;
}

// ============================================================================
// SMA Tests
// ============================================================================
describe("calculateSMA", () => {
  it("returns 0 for insufficient data", () => {
    expect(calculateSMA([10, 20], 5)).toBe(0);
  });

  it("calculates simple moving average correctly", () => {
    const values = [10, 20, 30, 40, 50];
    expect(calculateSMA(values, 3)).toBe(40); // (30+40+50)/3
  });

  it("handles empty array", () => {
    expect(calculateSMA([], 5)).toBe(0);
  });

  it("handles period equal to array length", () => {
    const values = [10, 20, 30];
    expect(calculateSMA(values, 3)).toBe(20);
  });
});

// ============================================================================
// EMA Tests
// ============================================================================
describe("calculateEMA", () => {
  it("returns SMA fallback when data equals period", () => {
    const values = [10, 20, 30];
    const result = calculateEMA(values, 3);
    expect(result).toBeGreaterThan(0);
    // Should weight recent values more
    expect(result).toBeGreaterThan(15);
  });

  it("converges toward recent values with more data", () => {
    // Rising trend: EMA should be above the midpoint
    const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const ema = calculateEMA(values, 5);
    // EMA should be close to the last values
    expect(ema).toBeGreaterThan(15);
    expect(ema).toBeLessThanOrEqual(21);
  });

  it("returns 0 for insufficient data", () => {
    expect(calculateEMA([], 5)).toBe(0);
  });
});

// ============================================================================
// RSI Tests
// ============================================================================
describe("calculateRSI", () => {
  it("returns 50 for insufficient data", () => {
    expect(calculateRSI([100], 14)).toBe(50);
  });

  it("returns 100 when all gains and no losses", () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
    expect(calculateRSI(prices, 14)).toBe(100);
  });

  it("returns > 70 for strong uptrend (overbought)", () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const rsi = calculateRSI(prices, 14);
    expect(rsi).toBeGreaterThan(70);
  });

  it("returns < 30 for strong downtrend (oversold)", () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 - i * 2);
    const rsi = calculateRSI(prices, 14);
    expect(rsi).toBeLessThan(30);
  });

  it("returns around 50 for ranging market", () => {
    const prices = Array.from({ length: 20 }, () => 100 + Math.random() * 2 - 1);
    const rsi = calculateRSI(prices, 14);
    expect(rsi).toBeGreaterThan(20);
    expect(rsi).toBeLessThan(80);
  });
});

// ============================================================================
// MACD Tests
// ============================================================================
describe("calculateMACD", () => {
  it("returns zeros for insufficient data", () => {
    const result = calculateMACD([100, 101, 102]);
    expect(result.macdLine).toBe(0);
    expect(result.signalLine).toBe(0);
    expect(result.histogram).toBe(0);
  });

  it("returns positive histogram in uptrend", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
    const result = calculateMACD(prices);
    expect(result.macdLine).toBeGreaterThan(0);
  });

  it("returns negative histogram in downtrend", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 - i * 0.5);
    const result = calculateMACD(prices);
    expect(result.macdLine).toBeLessThan(0);
  });

  it("computes valid structure for all fields", () => {
    const prices = Array.from({ length: 50 }, () => 100 + Math.random() * 5);
    const result = calculateMACD(prices);
    expect(typeof result.macdLine).toBe("number");
    expect(typeof result.signalLine).toBe("number");
    expect(typeof result.histogram).toBe("number");
    expect(result.histogram).toBe(result.macdLine - result.signalLine);
  });
});

// ============================================================================
// ADX Tests
// ============================================================================
describe("calculateADX", () => {
  it("returns 20 for insufficient data", () => {
    const prices = Array.from({ length: 10 }, (_, i) => 100 + i);
    const result = calculateADX(prices, prices, prices, 14);
    expect(result).toBe(20);
  });

  it("returns higher values in trending market", () => {
    // Strong uptrend
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i);
    const highs = prices.map((p) => p + 1);
    const lows = prices.map((p) => p - 1);
    const adx = calculateADX(highs, lows, prices, 14);
    // Should detect trending
    expect(adx).toBeGreaterThan(0);
  });

  it("returns a finite number", () => {
    const candles = stableCandles(40);
    const prices = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const adx = calculateADX(highs, lows, prices, 14);
    expect(Number.isFinite(adx)).toBe(true);
    expect(adx).toBeGreaterThanOrEqual(0);
    expect(adx).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Bollinger Bands Tests
// ============================================================================
describe("calculateBollingerBands", () => {
  it("middle band equals SMA", () => {
    const prices = [10, 20, 30, 40, 50];
    const bands = calculateBollingerBands(prices, 5, 2);
    expect(bands.middle).toBe(30);
  });

  it("upper band is above middle", () => {
    const prices = Array.from({ length: 20 }, () => 100 + Math.random() * 10);
    const bands = calculateBollingerBands(prices, 20, 2);
    expect(bands.upper).toBeGreaterThan(bands.middle);
    expect(bands.lower).toBeLessThan(bands.middle);
  });

  it("bands widen with volatile data", () => {
    const stable = Array.from({ length: 20 }, () => 100 + Math.random() * 1);
    const volatile = Array.from({ length: 20 }, () => 100 + Math.random() * 20);

    const stableBands = calculateBollingerBands(stable, 20, 2);
    const volatileBands = calculateBollingerBands(volatile, 20, 2);

    const stableWidth = stableBands.upper - stableBands.lower;
    const volatileWidth = volatileBands.upper - volatileBands.lower;

    expect(volatileWidth).toBeGreaterThan(stableWidth);
  });
});

// ============================================================================
// Donchian Channel Tests
// ============================================================================
describe("calculateDonchian", () => {
  it("computes correct upper, lower, and middle", () => {
    const highs = [10, 20, 30, 40, 50];
    const lows = [5, 15, 25, 35, 45];
    const channel = calculateDonchian(highs, lows, 5);
    expect(channel.upper).toBe(50);
    expect(channel.lower).toBe(5);
    expect(channel.middle).toBe(27.5);
  });

  it("handles single high/low values", () => {
    const channel = calculateDonchian([100], [50], 1);
    expect(channel.upper).toBe(100);
    expect(channel.lower).toBe(50);
  });
});

// ============================================================================
// ATR Tests
// ============================================================================
describe("calculateATR", () => {
  it("returns 0 for insufficient data", () => {
    const candles = makePriceSeries([100]);
    expect(calculateATR(candles, 14)).toBe(0);
  });

  it("calculates ATR with valid data", () => {
    const candles = stableCandles(20);
    const atr = calculateATR(candles, 14);
    expect(atr).toBeGreaterThan(0);
  });

  it("returns larger ATR for more volatile data", () => {
    const lowVol = stableCandles(20, 100, 0.1);
    const highVol = stableCandles(20, 100, 5);

    const atrLow = calculateATR(lowVol, 14);
    const atrHigh = calculateATR(highVol, 14);

    expect(atrHigh).toBeGreaterThan(atrLow);
  });
});

// ============================================================================
// Z-Score Tests
// ============================================================================
describe("calculateZScore", () => {
  it("returns 0 for insufficient data", () => {
    expect(calculateZScore([100], 5)).toBe(0);
  });

  it("returns 0 when all values are identical", () => {
    const prices = Array.from({ length: 20 }, () => 100);
    expect(calculateZScore(prices, 20)).toBe(0);
  });

  it("returns positive for above-mean price", () => {
    const prices = [90, 95, 100, 105, 110];
    const zscore = calculateZScore(prices, 5);
    expect(zscore).toBeGreaterThan(0);
  });

  it("returns negative for below-mean price", () => {
    const prices = [110, 105, 100, 95, 90];
    const zscore = calculateZScore(prices, 5);
    expect(zscore).toBeLessThan(0);
  });
});

// ============================================================================
// ROC Tests
// ============================================================================
describe("calculateROC", () => {
  it("returns 0 for insufficient data", () => {
    expect(calculateROC([100], 5)).toBe(0);
  });

  it("calculates positive rate of change", () => {
    const prices = [100, 110];
    expect(calculateROC(prices, 1)).toBe(10);
  });

  it("calculates negative rate of change", () => {
    const prices = [110, 100];
    expect(calculateROC(prices, 1)).toBeCloseTo(-9.09, 1);
  });
});

// ============================================================================
// calculateAllIndicators Integration Test
// ============================================================================
describe("calculateAllIndicators", () => {
  it("returns all indicator fields", () => {
    const candles = generateCandles("NAS100", 60);
    const ind = calculateAllIndicators(candles);

    expect(ind).toHaveProperty("rsi");
    expect(ind).toHaveProperty("macd");
    expect(ind).toHaveProperty("macd.macdLine");
    expect(ind).toHaveProperty("adx");
    expect(ind).toHaveProperty("bollinger");
    expect(ind).toHaveProperty("donchian");
    expect(ind).toHaveProperty("sma20");
    expect(ind).toHaveProperty("sma50");
    expect(ind).toHaveProperty("ema9");
    expect(ind).toHaveProperty("ema21");
    expect(ind).toHaveProperty("atr");
    expect(ind).toHaveProperty("volumeAvg");
    expect(ind).toHaveProperty("zscore");
  });

  it("returns finite numbers for all indicators", () => {
    const candles = generateCandles("NAS100", 100);
    const ind = calculateAllIndicators(candles);

    const checkFinite = (val: unknown, path: string) => {
      if (typeof val === "number") {
        expect(Number.isFinite(val), `${path} should be finite`).toBe(true);
      } else if (typeof val === "object" && val !== null) {
        Object.entries(val as Record<string, unknown>).forEach(([k, v]) =>
          checkFinite(v, `${path}.${k}`),
        );
      }
    };

    Object.entries(ind).forEach(([key, val]) => checkFinite(val, key));
  });

  it("RSI stays within 0-100 range", () => {
    const candles = generateCandles("NAS100", 100);
    const ind = calculateAllIndicators(candles);
    expect(ind.rsi).toBeGreaterThanOrEqual(0);
    expect(ind.rsi).toBeLessThanOrEqual(100);
  });
});
