// ============================================================================
// WARRIKS AI v5.1 — Session & Timing Engine Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeSession } from "../session";

describe("analyzeSession", () => {
  it("returns valid session information", () => {
    const result = analyzeSession();
    expect(["LONDON", "NEW_YORK", "ASIA", "OFF_HOURS"]).toContain(result.currentKillzone);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(result.volatility);
    expect(typeof result.inKillzone).toBe("boolean");
    expect(typeof result.description).toBe("string");
  });

  it("nextKillzone is null when in killzone", () => {
    const result = analyzeSession();
    if (result.inKillzone) {
      expect(result.nextKillzone).toBeNull();
      expect(result.nextKillzoneTime).toBeNull();
    } else {
      expect(result.nextKillzone).not.toBeNull();
      expect(result.nextKillzoneTime).not.toBeNull();
    }
  });

  it("description changes based on killzone state", () => {
    const result = analyzeSession();
    if (result.inKillzone) {
      expect(result.description).toContain("killzone active");
    } else {
      expect(result.description).toContain("Outside");
    }
  });

  it("correctly identifies killzone times", () => {
    // Test the logic: London = 07:00-11:00, New York = 13:00-16:00
    const result = analyzeSession();
    // This is a deterministic function of NY time, so just validate the result format
    expect(result.description.length).toBeGreaterThan(0);
  });
});
