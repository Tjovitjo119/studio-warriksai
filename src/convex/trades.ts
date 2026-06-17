// ============================================================================
// WARRIKS AI — Trade Execution & Management (Convex)
// CRUD operations for trade records with user isolation
// ============================================================================

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Open a new trade position.
 */
export const openTrade = mutation({
  args: {
    symbol: v.string(),
    direction: v.union(v.literal("BUY"), v.literal("SELL")),
    entryPrice: v.number(),
    stopLoss: v.number(),
    takeProfit: v.number(),
    quantity: v.number(),
    riskReward: v.number(),
    entryModel: v.optional(v.string()),
    killzone: v.optional(v.string()),
    confluenceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const tradeId = await ctx.db.insert("trades", {
      userId: user._id,
      symbol: args.symbol,
      direction: args.direction,
      entryPrice: args.entryPrice,
      stopLoss: args.stopLoss,
      takeProfit: args.takeProfit,
      quantity: args.quantity,
      riskReward: args.riskReward,
      entryModel: args.entryModel,
      killzone: args.killzone,
      confluenceScore: args.confluenceScore,
      status: "OPEN",
      openedAt: Date.now(),
    });

    return tradeId;
  },
});

/**
 * Close an existing trade with exit price and P&L calculation.
 */
export const closeTrade = mutation({
  args: {
    tradeId: v.id("trades"),
    exitPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const trade = await ctx.db.get(args.tradeId);
    if (!trade || trade.userId !== user._id) throw new Error("Trade not found");
    if (trade.status === "WIN" || trade.status === "LOSS") throw new Error("Trade already closed");

    const isBuy = trade.direction === "BUY";
    const pnl = isBuy
      ? (args.exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - args.exitPrice) * trade.quantity;
    const pnlPercent = ((args.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (isBuy ? 1 : -1);
    const status = pnl >= 0 ? "WIN" : "LOSS";

    await ctx.db.patch(args.tradeId, {
      exitPrice: args.exitPrice,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      status,
      closedAt: Date.now(),
    });

    return { tradeId: args.tradeId, pnl, status };
  },
});

/**
 * Update trade notes and tags.
 */
export const updateTradeNotes = mutation({
  args: {
    tradeId: v.id("trades"),
    notes: v.optional(v.string()),
    screenshot: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const trade = await ctx.db.get(args.tradeId);
    if (!trade || trade.userId !== user._id) throw new Error("Trade not found");

    const patch: Record<string, string> = {};
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.screenshot !== undefined) patch.screenshot = args.screenshot;

    await ctx.db.patch(args.tradeId, patch);
  },
});

/**
 * Get all trades for the current user.
 */
export const getMyTrades = query({
  args: {
    status: v.optional(v.union(v.literal("OPEN"), v.literal("WIN"), v.literal("LOSS"))),
    symbol: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = args.limit ?? 50;

    if (args.status) {
      const s: "OPEN" | "WIN" | "LOSS" = args.status;
      return await ctx.db
        .query("trades")
        .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", s))
        .order("desc")
        .take(limit);
    }

    if (args.symbol) {
      const sym: string = args.symbol;
      return await ctx.db
        .query("trades")
        .withIndex("by_user_symbol", (q) => q.eq("userId", user._id).eq("symbol", sym))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

// ============================================================================
// Backtest Persistence (stored in trades module for type safety)
// ============================================================================

/**
 * Save a completed backtest run.
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
 * Delete a saved backtest run.
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
 * Get all saved backtest runs for the current user.
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
 * Get trade statistics for the current user.
 */
export const getTradeStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        total: 0, wins: 0, losses: 0, winRate: 0,
        totalPnl: 0, avgRR: 0, profitFactor: 0,
        bestTrade: 0, worstTrade: 0, sharpe: 0, maxDD: 0,
      };
    }

    const trades = await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(200);

    const closed = trades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.status === "WIN");
    const losses = closed.filter((t) => t.status === "LOSS");

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgRR = closed.length > 0
      ? closed.reduce((s, t) => s + t.riskReward, 0) / closed.length
      : 0;

    const totalWinPnl = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const totalLossPnl = losses.reduce((s, t) => s + Math.abs(t.pnl ?? 0), 0);
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;

    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl ?? 0)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl ?? 0)) : 0;

    // Sharpe ratio approximation
    const returns = closed.map((t) => t.pnlPercent ?? 0);
    const avgReturn = returns.length > 0
      ? returns.reduce((s, r) => s + r, 0) / returns.length
      : 0;
    const variance = returns.length > 0
      ? returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Max drawdown
    let peak = -Infinity;
    let maxDD = 0;
    let runningPnl = 0;
    for (const t of closed) {
      runningPnl += t.pnl ?? 0;
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak !== 0 ? ((peak - runningPnl) / Math.abs(peak)) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    }

    return {
      total: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: Math.round(winRate * 10) / 10,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgRR: Math.round(avgRR * 100) / 100,
      profitFactor: profitFactor === Infinity ? Infinity : Math.round(profitFactor * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
      maxDD: Math.round(maxDD * 10) / 10,
    };
  },
});
