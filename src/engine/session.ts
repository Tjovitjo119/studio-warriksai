// ============================================================================
// WARRIKS AI v5.2 — Session & Timing Engine (NY Time Based)
// Purpose: Ensure trades only occur in high liquidity windows
// ============================================================================

import type { Killzone, SessionResult, SessionPriority } from "./types";

/**
 * Get current New York time for session analysis.
 * Returns the current hour in NY timezone.
 */
export function getCurrentNYHour(): { hour: number; minute: number } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Check DST (simplified: April-October)
  const month = now.getUTCMonth() + 1;
  const isDST = month >= 3 && month <= 10;
  const nyHourRaw = isDST ? utcHour - 4 : utcHour - 5;
  const nyHour = ((nyHourRaw % 24) + 24) % 24;

  return { hour: nyHour, minute: utcMinute };
}

/**
 * Get total minutes since midnight NY time.
 */
export function getCurrentNYMinutes(): number {
  const { hour, minute } = getCurrentNYHour();
  return hour * 60 + minute;
}

/**
 * Determine which killzone the current time falls in based on NY time.
 *
 * London Killzone: 07:00–11:00 NY time
 * New York Killzone: 13:00–16:00 NY time
 */
function getCurrentKillzone(hour: number, minute: number): Killzone {
  const totalMinutes = hour * 60 + minute;

  // London Killzone: 07:00-11:00
  if (totalMinutes >= 420 && totalMinutes < 660) return "LONDON";
  // New York Killzone: 13:00-16:00
  if (totalMinutes >= 780 && totalMinutes < 960) return "NEW_YORK";
  // Asia session
  if (totalMinutes >= 0 && totalMinutes < 420) return "ASIA";
  return "OFF_HOURS";
}

function isInKillzone(killzone: Killzone): boolean {
  return killzone === "LONDON" || killzone === "NEW_YORK";
}

function getVolatility(killzone: Killzone, minute: number): "HIGH" | "MEDIUM" | "LOW" {
  if (killzone === "LONDON") {
    if (minute >= 0 && minute < 120) return "HIGH";
    return "MEDIUM";
  }
  if (killzone === "NEW_YORK") {
    if (minute >= 0 && minute < 60) return "HIGH";
    return "MEDIUM";
  }
  return "LOW";
}

function getNextKillzone(current: Killzone): { zone: Killzone; timeH: number; timeM: number } {
  switch (current) {
    case "LONDON":
      return { zone: "NEW_YORK", timeH: 13, timeM: 0 };
    case "NEW_YORK":
    case "ASIA":
    case "OFF_HOURS":
    default:
      return { zone: "LONDON", timeH: 7, timeM: 0 };
  }
}

/**
 * Session Priority Matrix (NY Time):
 *
 * Highest Priority: 08:30 – 11:00  (510 – 660 min)
 * Second Priority:  07:00 – 08:30  (420 – 510 min)
 * Third Priority:   13:00 – 15:00  (780 – 900 min)
 * Lowest Priority:  All other times
 *
 * Outside approved sessions → NO TRADE
 */
export function getSessionPriority(hour: number, minute: number): SessionPriority {
  const totalMinutes = hour * 60 + minute;

  // Highest Priority: 08:30 – 11:00 NY
  if (totalMinutes >= 510 && totalMinutes < 660) return "HIGHEST";

  // Second Priority: 07:00 – 08:30 NY
  if (totalMinutes >= 420 && totalMinutes < 510) return "SECOND";

  // Third Priority: 13:00 – 15:00 NY
  if (totalMinutes >= 780 && totalMinutes < 900) return "THIRD";

  // Lowest Priority / No Trade
  return "LOWEST";
}

/**
 * Check if current time is within an approved session window.
 */
export function isInApprovedSession(hour: number, minute: number): boolean {
  const priority = getSessionPriority(hour, minute);
  return priority !== "LOWEST";
}

/**
 * Analyze whether current time is suitable for trading based on killzone windows.
 */
export function analyzeSession(): SessionResult {
  const { hour, minute } = getCurrentNYHour();
  const currentKillzone = getCurrentKillzone(hour, minute);
  const inKillzone = isInKillzone(currentKillzone);
  const volatility = getVolatility(currentKillzone, minute);
  const sessionPriority = getSessionPriority(hour, minute);

  const next = getNextKillzone(currentKillzone);
  const nextKillzoneTime = inKillzone
    ? null
    : `${next.timeH.toString().padStart(2, "0")}:${next.timeM.toString().padStart(2, "0")} NY`;

  return {
    inKillzone,
    currentKillzone,
    volatility,
    nextKillzone: inKillzone ? null : next.zone,
    nextKillzoneTime,
    description: buildSessionDescription(currentKillzone, inKillzone, volatility, sessionPriority),
  };
}

function buildSessionDescription(
  killzone: Killzone,
  inKZ: boolean,
  volatility: string,
  priority: SessionPriority,
): string {
  if (!inKZ) return `Outside killzone (${killzone}), volatility: ${volatility}. Session priority: ${priority}`;
  return `${killzone} killzone active, volatility: ${volatility}. Session priority: ${priority}`;
}
