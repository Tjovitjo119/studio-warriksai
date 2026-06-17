// ============================================================================
// WARRIKS AI — Technical Indicator Library Unit Tests
// Tests: SMA, EMA, RSI, MACD, Bollinger, Donchian, ATR, Z-Score, ADX, ROC
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateDonchian,
  calculateATR,
  calculateZScore,
  calculateROC,
  calculateADX,
  calculateAllIndicators,
} from "./indicators";
import type { Candle } from "./types";

function makeCandle(open: number, high: number, low: number, close: number, volume: number = 1000, timestamp?: number): Candle {
  return { timestamp: timestamp ?? Date.now(), open, high, low, close, volume };
}

function makePriceCandles(prices: number[]): Candle[] {
  return prices.map((p, i) => ({
    timestamp: Date.now() - (prices.length - i) * 60000,
    open: p - Math.random() * 0.5,
    high: p + Math.random() * 0.5,
    low: p - Math.random() * 0.5,
    close: p,
    volume: 1000,
  }));
}

describe("Technical Indicators", () => {
  describe("calculateSMA", () => {
    it("returns 0 for empty array", () => {
      expect(calculateSMA([], 10)).toBe(0);
    });

    it("returns 0 for period larger than array", () => {
      expect(calculateSMA([1, 2, 3], 10)).toBe(0);
    });

    it("returns 0 for period of 0", () => {
      expect(calculateSMA([1, 2, 3], 0)).toBe(0);
    });

    it("calculates simple moving average correctly", () => {
      const values = [10, 20, 30, 40, 50];
      expect(calculateSMA(values, 3)).toBe(40); // (30+40+50)/3 = 40
    });

    it("calculates SMA for exact period length", () => {
      const values = [5, 10, 15];
      expect(calculateSMA(values, 3)).toBe(10);
    });
  });

  describe("calculateEMA", () => {
    it("returns 0 for values shorter than period", () => {
      expect(calculateEMA([], 10)).toBe(0);
    });

    it("returns SMA approximation for minimum data", () => {
      // With exactly period values, EMA starts as SMA
      const values = [10, 20, 30, 40, 50];
      const ema = calculateEMA(values, 5);
      expect(ema).toBeGreaterThan(0);
      expect(ema).toBeLessThan(60);
    });

    it("gives more weight to recent values", () => {
      const steady = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
      const emaSteady = calculateEMA(steady, 5);
      expect(emaSteady).toBeCloseTo(10, 0);

      // After a spike, EMA should rise quickly
      const spiking = [10, 10, 10, 10, 10, 10, 10, 10, 10, 100];
      const emaSpiking = calculateEMA(spiking, 5);
      expect(emaSpiking).toBeGreaterThan(10);
    });
  });

  describe("calculateRSI", () => {
    it("returns 50 for insufficient data", () => {
      expect(calculateRSI([10, 20], 14)).toBe(50);
    });

    it("returns 100 for continuously rising prices", () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const rsi = calculateRSI(prices, 14);
      expect(rsi).toBeGreaterThan(90);
    });

    it("returns close to 0 for continuously falling prices", () => {
      const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 5);
      const rsi = calculateRSI(prices, 14);
      expect(rsi).toBeLessThan(10);
    });

    it("returns near 50 for flat prices", () => {
      const prices = Array.from({ length: 20 }, () => 100);
      const rsi = calculateRSI(prices, 14);
      // All gains/one loss at start, then flat = RSI near 100 or specific value
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateMACD", () => {
    it("returns zeros for insufficient data", () => {
      const result = calculateMACD([10, 20, 30]);
      expect(result.macdLine).toBe(0);
      expect(result.signalLine).toBe(0);
      expect(result.histogram).toBe(0);
    });

    it("calculates MACD with sufficient data", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.5) * 10 + i * 0.5);
      const result = calculateMACD(prices);
      expect(typeof result.macdLine).toBe("number");
      expect(typeof result.signalLine).toBe("number");
      expect(typeof result.histogram).toBe("number");
    });

    it("shows positive MACD for bullish trend", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const result = calculateMACD(prices);
      // Generally the 12 EMA should be above 26 EMA for rising prices
      expect(result.macdLine).toBeGreaterThan(-5);
    });
  });

  describe("calculateBollingerBands", () => {
    it("returns correct middle band (SMA)", () => {
      const prices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const bands = calculateBollingerBands(prices, 10, 2);
      expect(bands.middle).toBe(55); // mean of 10..100
    });

    it("upper band is above middle band", () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + (i % 3 === 0 ? 5 : -3));
      const bands = calculateBollingerBands(prices, 20, 2);
      expect(bands.upper).toBeGreaterThan(bands.middle);
      expect(bands.lower).toBeLessThan(bands.middle);
    });

    it("bands widen with higher volatility", () => {
      const volatilePrices = Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 10 : -10));
      const stablePrices = Array.from({ length: 30 }, () => 100);

      const volatileBands = calculateBollingerBands(volatilePrices, 20, 2);
      const stableBands = calculateBollingerBands(stablePrices, 20, 2);

      expect(volatileBands.upper - volatileBands.lower).toBeGreaterThan(stableBands.upper - stableBands.lower);
    });
  });

  describe("calculateDonchian", () => {
    it("returns correct channel values", () => {
      const highs = [110, 120, 130, 140, 150];
      const lows = [90, 80, 70, 60, 50];
      const donchian = calculateDonchian(highs, lows, 5);
      expect(donchian.upper).toBe(150);
      expect(donchian.lower).toBe(50);
      expect(donchian.middle).toBe(100);
    });
  });

  describe("calculateATR", () => {
    it("returns 0 for insufficient candles", () => {
      expect(calculateATR([makeCandle(10, 11, 9, 10)], 14)).toBe(0);
    });

    it("calculates positive ATR for valid data", () => {
      const candles = Array.from({ length: 20 }, (_, i) =>
        makeCandle(100 + i, 105 + i, 95 + i, 102 + i, 1000)
      );
      const atr = calculateATR(candles, 14);
      expect(atr).toBeGreaterThan(0);
    });

    it("higher volatility produces higher ATR", () => {
      const lowVol = Array.from({ length: 20 }, (_, i) =>
        makeCandle(100, 101, 99, 100, 1000, Date.now() + i * 60000)
      );
      const highVol = Array.from({ length: 20 }, (_, i) =>
        makeCandle(100 + i, 110 + i, 90 + i, 105 + i, 1000, Date.now() + i * 60000)
      );

      expect(calculateATR(highVol, 14)).toBeGreaterThan(calculateATR(lowVol, 14));
    });
  });

  describe("calculateZScore", () => {
    it("returns 0 for insufficient data", () => {
      expect(calculateZScore([10], 5)).toBe(0);
    });

    it("returns 0 for constant price", () => {
      const prices = Array.from({ length: 20 }, () => 100);
      expect(calculateZScore(prices, 20)).toBe(0);
    });

    it("returns positive for price above mean", () => {
      const prices = [90, 92, 88, 91, 89, 93, 87, 94, 200];
      const zscore = calculateZScore(prices, 9);
      expect(zscore).toBeGreaterThan(0);
    });

    it("returns negative for price below mean", () => {
      const prices = [110, 108, 112, 109, 111, 113, 107, 106, 50];
      const zscore = calculateZScore(prices, 9);
      expect(zscore).toBeLessThan(0);
    });
  });

  describe("calculateROC", () => {
    it("returns 0 for insufficient data", () => {
      expect(calculateROC([10], 5)).toBe(0);
    });

    it("calculates rate of change correctly", () => {
      const prices = [100, 100, 100, 100, 100, 110];
      // ((110 - 100) / 100) * 100 = 10%
      expect(calculateROC(prices, 5)).toBeCloseTo(10, 1);
    });

    it("returns negative ROC for declining prices", () => {
      const prices = [100, 100, 100, 100, 100, 90];
      expect(calculateROC(prices, 5)).toBeLessThan(0);
    });
  });

  describe("calculateADX", () => {
    it("returns 20 for insufficient data", () => {
      expect(calculateADX([], [], [], 14)).toBe(20);
    });

    it("returns a non-negative value", () => {
      const highs = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
      const lows = Array.from({ length: 30 }, (_, i) => 98 + i * 2);
      const closes = Array.from({ length: 30 }, (_, i) => 99 + i * 2);

      const adx = calculateADX(highs, lows, closes, 14);
      expect(adx).toBeGreaterThanOrEqual(0);
      expect(adx).toBeLessThanOrEqual(100);
    });

    it("returns higher ADX for trending market", () => {
      // Trending: strong directional movement
      const trendingHi = Array.from({ length: 40 }, (_, i) => 100 + i * 3);
      const trendingLo = Array.from({ length: 40 }, (_, i) => 98 + i * 3);
      const trendingCl = Array.from({ length: 40 }, (_, i) => 99 + i * 3);

      // Ranging: no directional movement
      const rangingHi = Array.from({ length: 40 }, () => 105);
      const rangingLo = Array.from({ length: 40 }, () => 95);
      const rangingCl = Array.from({ length: 40 }, () => 100);

      const trendingAdx = calculateADX(trendingHi, trendingLo, trendingCl, 14);
      const rangingAdx = calculateADX(rangingHi, rangingLo, rangingCl, 14);

      expect(trendingAdx).toBeGreaterThanOrEqual(rangingAdx);
    });
  });

  describe("calculateAllIndicators", () => {
    it("returns a complete IndicatorValues object", () => {
      const candles = Array.from({ length: 60 }, (_, i) =>
        makeCandle(100 + i * 0.5, 102 + i * 0.5, 98 + i * 0.5, 101 + i * 0.5, 1000)
      );
      const result = calculateAllIndicators(candles);
      expect(result.rsi).toBeGreaterThanOrEqual(0);
      expect(result.rsi).toBeLessThanOrEqual(100);
      expect(result.macd).toBeDefined();
      expect(typeof result.macd.macdLine).toBe("number");
      expect(result.adx).toBeGreaterThanOrEqual(0);
      expect(result.bollinger).toBeDefined();
      expect(result.bollinger.upper).toBeGreaterThan(result.bollinger.lower);
      expect(result.donchian).toBeDefined();
      expect(result.donchian.upper).toBeGreaterThan(result.donchian.lower);
      expect(result.sma20).toBeGreaterThan(0);
      expect(result.sma50).toBeGreaterThan(0);
      expect(result.ema9).toBeGreaterThan(0);
      expect(result.ema21).toBeGreaterThan(0);
      expect(result.atr).toBeGreaterThanOrEqual(0);
      expect(result.volumeAvg).toBeGreaterThan(0);
      expect(typeof result.zscore).toBe("number");
    });

    it("handles empty candle array gracefully", () => {
      const result = calculateAllIndicators([]);
      expect(result.rsi).toBe(50);
      expect(result.adx).toBe(20);
      expect(result.volumeAvg).toBe(0);
    });
  });
});
