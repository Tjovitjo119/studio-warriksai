// ============================================================================
// WARRIKS AI v5.2 — Session & Timing Engine Unit Tests
// Tests: killzone detection, session priority matrix, time edge cases
// ============================================================================

import { describe, it, expect } from "vitest";
import { getSessionPriority, isInApprovedSession } from "./session";

describe("Session Priority Matrix", () => {
  describe("getSessionPriority", () => {
    it("returns HIGHEST for 08:30–11:00 NY time window", () => {
      // 08:30 = 510 minutes
      expect(getSessionPriority(8, 30)).toBe("HIGHEST");
      // 09:00
      expect(getSessionPriority(9, 0)).toBe("HIGHEST");
      // 10:59
      expect(getSessionPriority(10, 59)).toBe("HIGHEST");
    });

    it("returns SECOND for 07:00–08:30 NY time window", () => {
      expect(getSessionPriority(7, 0)).toBe("SECOND");
      expect(getSessionPriority(7, 30)).toBe("SECOND");
      expect(getSessionPriority(8, 29)).toBe("SECOND");
    });

    it("returns THIRD for 13:00–15:00 NY time window", () => {
      expect(getSessionPriority(13, 0)).toBe("THIRD");
      expect(getSessionPriority(14, 0)).toBe("THIRD");
      expect(getSessionPriority(14, 59)).toBe("THIRD");
    });

    it("returns LOWEST for all other times", () => {
      // Outside all approved sessions
      expect(getSessionPriority(3, 0)).toBe("LOWEST");
      expect(getSessionPriority(6, 0)).toBe("LOWEST");
      expect(getSessionPriority(16, 0)).toBe("LOWEST");
      expect(getSessionPriority(23, 0)).toBe("LOWEST");
    });

    it("handles minute boundary exactly at 08:30", () => {
      expect(getSessionPriority(8, 30)).toBe("HIGHEST");
    });

    it("handles minute boundary exactly at 07:00", () => {
      expect(getSessionPriority(7, 0)).toBe("SECOND");
    });

    it("handles the 15:00 boundary correctly", () => {
      // 15:00 is outside THIRD (THIRD is 13:00-15:00, so 15:00 = 900 min is excluded)
      expect(getSessionPriority(15, 0)).toBe("LOWEST");
      expect(getSessionPriority(14, 59)).toBe("THIRD");
    });

    it("handles midnight correctly", () => {
      expect(getSessionPriority(0, 0)).toBe("LOWEST");
    });

    it("handles 11:00 boundary (end of HIGHEST)", () => {
      // 11:00 = 660 minutes, which is the upper bound (exclusive)
      expect(getSessionPriority(11, 0)).toBe("LOWEST");
      expect(getSessionPriority(10, 59)).toBe("HIGHEST");
    });
  });

  describe("isInApprovedSession", () => {
    it("returns true for HIGHEST priority times", () => {
      expect(isInApprovedSession(9, 0)).toBe(true);
      expect(isInApprovedSession(10, 0)).toBe(true);
    });

    it("returns true for SECOND priority times", () => {
      expect(isInApprovedSession(7, 15)).toBe(true);
      expect(isInApprovedSession(8, 0)).toBe(true);
    });

    it("returns true for THIRD priority times", () => {
      expect(isInApprovedSession(13, 30)).toBe(true);
      expect(isInApprovedSession(14, 0)).toBe(true);
    });

    it("returns false for LOWEST priority times", () => {
      expect(isInApprovedSession(3, 0)).toBe(false);
      expect(isInApprovedSession(16, 0)).toBe(false);
      expect(isInApprovedSession(5, 0)).toBe(false);
    });
  });
});
