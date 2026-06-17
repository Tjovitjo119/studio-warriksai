// ============================================================================
// WARRIKS AI — Live Market Data Fetcher (Twelve Data API)
// Runs as a Convex action so the API key stays server-side
// ============================================================================

import { action } from "./_generated/server";
import type { Candle } from "../engine/types";

/**
 * Map from internal symbol names to Twelve Data API symbols.
 */
const SYMBOL_MAP: Record<string, string> = {
  NAS100: "US100",
  XAUUSD: "XAU/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
};

interface TwelveDataValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TwelveDataResponse {
  meta?: { symbol: string };
  values?: TwelveDataValue[];
  status: string;
  code?: number;
  message?: string;
}

/**
 * Fetch candlestick data for a single symbol from Twelve Data.
 */
async function fetchSymbolCandles(
  symbol: string,
  twelveSymbol: string,
  apiKey: string,
  outputSize: number = 80,
): Promise<Candle[]> {
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(twelveSymbol)}&interval=1min&outputsize=${outputSize}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = (await response.json()) as TwelveDataResponse;

  if (data.status !== "ok" || !data.values || data.values.length === 0) {
    console.warn(`[TwelveData] ${symbol}: API error`, data.message || data.status);
    return [];
  }

  // Sort by timestamp ascending
  const candles = data.values.map((v) => ({
    timestamp: new Date(v.datetime).getTime(),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: parseInt(v.volume, 10) || 0,
  }));

  // Ensure ascending order
  candles.sort((a, b) => a.timestamp - b.timestamp);

  return candles;
}

/**
 * Fetch live 1-min candlestick data for all tracked symbols.
 * Returns a map of symbol → candle array.
 * Falls back to empty arrays for symbols that fail.
 */
export const fetchLiveCandles = action({
  args: {},
  handler: async (): Promise<Record<string, Candle[]>> => {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      console.warn("[TwelveData] TWELVE_DATA_API_KEY not configured in Convex env");
      return {};
    }

    const result: Record<string, Candle[]> = {};
    const entries = Object.entries(SYMBOL_MAP);

    // Fetch sequentially to avoid hitting free-tier rate limits
    for (const [symbol, twelveSymbol] of entries) {
      try {
        const candles = await fetchSymbolCandles(symbol, twelveSymbol, apiKey);
        if (candles.length > 0) {
          result[symbol] = candles;
        }
      } catch (error) {
        console.error(`[TwelveData] Failed to fetch ${symbol}:`, error);
      }
    }

    return result;
  },
});
