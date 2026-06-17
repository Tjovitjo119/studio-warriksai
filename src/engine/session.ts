// ============================================================================
// WARRIKS AI v5.1 — Session & Timing Engine (NY Time Based)
// Purpose: Ensure trades only occur in high liquidity windows
// ============================================================================

import type { Killzone, SessionResult } from "./types";

/**
 * Get current New York time for session analysis.
 * Returns the current hour in NY timezone.
 */
function getCurrentNYHour(): { hour: number; minute: number } {
  const now = new Date();
  const nyOffset = -4; // EDT (UTC-4) during DST, EST (UTC-5) otherwise
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcDay = now.getUTCDay();

  // Approximate NY time
  let nyHour = (utcHour + nyOffset) % 24;
  if (nyHour < 0) nyHour += 24;

  // Check DST (simplified: April-October)
  const month = now.getUTCMonth() + 1;
  const isDST = month >= 3 && month <= 10;
  if (isDST) nyHour = (utcHour - 4) % 24;
  else nyHour = (utcHour - 5) % 24;
  if (nyHour < 0) nyHour += 24;

  return { hour: nyHour, minute: utcMinute };
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
    // 7-9 is overlap, 9-11 is regular
    if (minute >= 0 && minute < 120) return "HIGH";
    return "MEDIUM";
  }
  if (killzone === "NEW_YORK") {
    // 13-14 is open, 14-16 is regular
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
 * Analyze whether current time is suitable for trading based on killzone windows.
 */
export function analyzeSession(): SessionResult {
  const { hour, minute } = getCurrentNYHour();
  const currentKillzone = getCurrentKillzone(hour, minute);
  const inKillzone = isInKillzone(currentKillzone);
  const volatility = getVolatility(currentKillzone, minute);

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
    description: buildSessionDescription(currentKillzone, inKillzone, volatility),
  };
}

function buildSessionDescription(
  killzone: Killzone,
  inKZ: boolean,
  volatility: string,
): string {
  if (!inKZ) return `Outside killzone (${killzone}), volatility: ${volatility}`;
  return `${killzone} killzone active, volatility: ${volatility}`;
}
