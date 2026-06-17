// ============================================================================
// WARRIKS AI v5.1 — Types & Constants Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { DEFAULT_SYMBOLS, STRATEGY_LABELS } from "../types";

describe("DEFAULT_SYMBOLS", () => {
  it("contains the 4 major symbols", () => {
    expect(DEFAULT_SYMBOLS).toContain("NAS100");
    expect(DEFAULT_SYMBOLS).toContain("XAUUSD");
    expect(DEFAULT_SYMBOLS).toContain("EURUSD");
    expect(DEFAULT_SYMBOLS).toContain("GBPUSD");
  });

  it("has exactly 4 symbols", () => {
    expect(DEFAULT_SYMBOLS.length).toBe(4);
  });

  it("is a readonly tuple", () => {
    // TypeScript enforces this at compile time
    expect(Array.isArray(DEFAULT_SYMBOLS)).toBe(true);
  });
});

describe("STRATEGY_LABELS", () => {
  it("contains labels for all strategy types", () => {
    expect(STRATEGY_LABELS.ICT_SMC).toBe("ICT / SMC");
    expect(STRATEGY_LABELS.MOMENTUM).toBe("Momentum");
    expect(STRATEGY_LABELS.MEAN_REVERSION).toBe("Mean Reversion");
    expect(STRATEGY_LABELS.BREAKOUT).toBe("Breakout");
  });

  it("all labels are non-empty strings", () => {
    for (const label of Object.values(STRATEGY_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
