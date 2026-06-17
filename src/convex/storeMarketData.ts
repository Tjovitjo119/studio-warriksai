// ============================================================================
// WARRIKS AI — Store Market Data in Convex
// Persists fetched candle data into the marketData table for reactive queries
// ============================================================================

import { v } from "convex/values";
import { mutation, action } from "./_generated/server";

/**
 * Store or update market data candles for a symbol.
 */
export const storeCandles = mutation({
  args: {
    symbol: v.string(),
    candles: v.array(v.object({
      timestamp: v.number(),
      open: v.number(),
      high: v.number(),
      low: v.number(),
      close: v.number(),
      volume: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marketData")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        candles: args.candles,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("marketData", {
      symbol: args.symbol,
      candles: args.candles,
      updatedAt: now,
    });
  },
});

/**
 * Get stored market data for a symbol.
 */
export const getCandles = mutation({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("marketData")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    return data?.candles ?? [];
  },
});
