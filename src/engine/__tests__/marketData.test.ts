// ============================================================================
// WARRIKS AI v5.1 — Market Data Unit Tests
// Tests: generateCandles, generateAllCandles, getMarketSnapshot,
//        getMockTradeHistory, getMockSignals
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  generateCandles,
  generateAllCandles,
  getMarketSnapshot,
  getMockTradeHistory,
  getMockSignals,
} from "../marketData";

// ============================================================================
// generateCandles
// ============================================================================
describe("generateCandles", () => {
  it("generates the requested number of candles", () => {
    const candles = generateCandles("NAS100", 100);
    expect(candles).toHaveLength(100);
  });

  it("generates candles for EURUSD", () => {
    const candles = generateCandles("EURUSD", 50);
    expect(candles).toHaveLength(50);
  });

  it("generates candles with valid structure", () => {
    const candles = generateCandles("NAS100", 10);
    for (const c of candles) {
      expect(c).toHaveProperty("timestamp");
      expect(c).toHaveProperty("open");
      expect(c).toHaveProperty("high");
      expect(c).toHaveProperty("low");
      expect(c).toHaveProperty("close");
      expect(c).toHaveProperty("volume");
    }
  });

  it("generates candles with ascending timestamps", () => {
    const candles = generateCandles("NAS100", 50);
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].timestamp).toBeGreaterThan(candles[i - 1].timestamp);
    }
  });

  it("generates candles with valid OHLC relationship", () => {
    const candles = generateCandles("NAS100", 20);
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
  });

  it("generates candles with positive volume", () => {
    const candles = generateCandles("NAS100", 10);
    for (const c of candles) {
      expect(c.volume).toBeGreaterThan(0);
    }
  });

  it("generates different prices for different symbols", () => {
    const nasCandles = generateCandles("NAS100", 10);
    const eurCandles = generateCandles("EURUSD", 10);

    const nasPrice = nasCandles[nasCandles.length - 1].close;
    const eurPrice = eurCandles[eurCandles.length - 1].close;

    // NAS100 should be much higher price than EURUSD
    expect(nasPrice).toBeGreaterThan(eurPrice * 1000);
  });
});

// ============================================================================
// generateAllCandles
// ============================================================================
describe("generateAllCandles", () => {
  it("generates data for all 4 default symbols", () => {
    const all = generateAllCandles(100);
    expect(all).toHaveProperty("NAS100");
    expect(all).toHaveProperty("XAUUSD");
    expect(all).toHaveProperty("EURUSD");
    expect(all).toHaveProperty("GBPUSD");
  });

  it("generates the requested count for each symbol", () => {
    const all = generateAllCandles(50);
    expect(all.NAS100).toHaveLength(50);
    expect(all.XAUUSD).toHaveLength(50);
    expect(all.EURUSD).toHaveLength(50);
    expect(all.GBPUSD).toHaveLength(50);
  });
});

// ============================================================================
// getMarketSnapshot
// ============================================================================
describe("getMarketSnapshot", () => {
  it("returns valid market data from candles", () => {
    const candles = generateCandles("NAS100", 50);
    const snapshot = getMarketSnapshot("NAS100", candles);

    expect(snapshot.symbol).toBe("NAS100");
    expect(snapshot.price).toBeGreaterThan(0);
    expect(typeof snapshot.change).toBe("number");
    expect(typeof snapshot.changePercent).toBe("number");
    expect(snapshot.high).toBeGreaterThan(snapshot.low);
    expect(snapshot.volume).toBeGreaterThan(0);
  });

  it("falls back for insufficient candles", () => {
    const snapshot = getMarketSnapshot("NAS100", []);
    expect(snapshot.price).toBeGreaterThan(0);
    expect(snapshot.change).toBe(0);
  });

  it("calculates change correctly", () => {
    const candles = generateCandles("EURUSD", 5);
    if (candles.length >= 2) {
      const snapshot = getMarketSnapshot("EURUSD", candles);
      const expectedChange =
        candles[candles.length - 1].close - candles[candles.length - 2].close;
      expect(snapshot.change).toBe(expectedChange);
    }
  });
});

// ============================================================================
// Mock Data
// ============================================================================
describe("getMockTradeHistory", () => {
  it("returns an array of trade records", () => {
    const trades = getMockTradeHistory();
    expect(Array.isArray(trades)).toBe(true);
    expect(trades.length).toBeGreaterThan(0);
  });

  it("each trade has required fields", () => {
    const trades = getMockTradeHistory();
    for (const t of trades) {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("symbol");
      expect(t).toHaveProperty("direction");
      expect(t).toHaveProperty("entryPrice");
      expect(t).toHaveProperty("pnl");
      expect(t).toHaveProperty("status");
    }
  });
});

describe("getMockSignals", () => {
  it("returns an array of signals", () => {
    const signals = getMockSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("each signal has required fields", () => {
    const signals = getMockSignals();
    for (const s of signals) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("symbol");
      expect(s).toHaveProperty("direction");
      expect(s).toHaveProperty("entryZone");
      expect(s).toHaveProperty("stopLoss");
      expect(s).toHaveProperty("takeProfit");
      expect(s).toHaveProperty("confidence");
      expect(s).toHaveProperty("status");
    }
  });

  it("signals have valid confidence ranges", () => {
    const signals = getMockSignals();
    for (const s of signals) {
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(100);
    }
  });
});
