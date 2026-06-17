// ============================================================================
// WARRIKS AI — Backtest Persistence (Convex)
// Save, list, and delete backtest run results with user isolation
// ============================================================================

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Save a completed backtest run to the database.
 */
export const saveBacktest = mutation({
  args: {
    name: v.string(),
    symbol: v.string(),
    timeframe: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    iterations: v.number(),
    selectedEngines: v.array(v.string()),
    result: v.object({
      total: v.number(),
      tradeableCount: v.number(),
      tradeablePercent: v.number(),
      avgConfidence: v.number(),
      avgAgreement: v.number(),
      eliteCount: v.number(),
      institutionalCount: v.number(),
      highProbCount: v.number(),
      moderateProbCount: v.number(),
      noTradeCount: v.number(),
      buySignals: v.number(),
      sellSignals: v.number(),
      finalEquity: v.number(),
      totalReturn: v.number(),
      equityCurve: v.array(v.object({
        step: v.number(),
        equity: v.number(),
      })),
      engineStats: v.array(v.object({
        type: v.string(),
        signalCount: v.number(),
        avgConfidence: v.number(),
        buyCount: v.number(),
        sellCount: v.number(),
        neutralCount: v.number(),
        total: v.number(),
      })),
      iterationSamples: v.array(v.object({
        agreement: v.string(),
        agreementCount: v.number(),
        confluenceScore: v.number(),
        tradeable: v.boolean(),
        consensusDirection: v.string(),
        activeEngines: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const backtestId = await ctx.db.insert("backtests", {
      userId: user._id,
      name: args.name,
      symbol: args.symbol,
      timeframe: args.timeframe,
      startDate: args.startDate,
      endDate: args.endDate,
      iterations: args.iterations,
      selectedEngines: args.selectedEngines,
      result: args.result,
      createdAt: Date.now(),
    });

    return backtestId;
  },
});

/**
 * Delete a backtest run.
 */
export const deleteBacktest = mutation({
  args: {
    backtestId: v.id("backtests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const backtest = await ctx.db.get(args.backtestId);
    if (!backtest || backtest.userId !== user._id) throw new Error("Backtest not found");

    await ctx.db.delete(args.backtestId);
  },
});

/**
 * Get all saved backtest runs for the current user, ordered by most recent.
 */
export const getMyBacktests = query({
  args: {
    symbol: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = args.limit ?? 50;

    if (args.symbol) {
      return await ctx.db
        .query("backtests")
        .withIndex("by_user_symbol", (q) => q.eq("userId", user._id).eq("symbol", args.symbol!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("backtests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get a single backtest run by ID.
 */
export const getBacktestById = query({
  args: {
    backtestId: v.id("backtests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const backtest = await ctx.db.get(args.backtestId);
    if (!backtest || backtest.userId !== user._id) return null;

    return backtest;
  },
});
