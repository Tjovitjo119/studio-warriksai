// ============================================================================
// WARRIKS AI — Trading Journal (Convex)
// CRUD operations for journal entries with user isolation
// ============================================================================

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Create a new journal entry.
 */
export const createJournalEntry = mutation({
  args: {
    tradeId: v.optional(v.id("trades")),
    symbol: v.string(),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    mood: v.optional(v.union(
      v.literal("BULLISH"),
      v.literal("BEARISH"),
      v.literal("NEUTRAL"),
      v.literal("FRUSTRATED"),
      v.literal("CONFIDENT"),
    )),
    lessons: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const journalId = await ctx.db.insert("journal", {
      userId: user._id,
      tradeId: args.tradeId,
      symbol: args.symbol,
      title: args.title,
      content: args.content,
      tags: args.tags,
      mood: args.mood,
      lessons: args.lessons,
      createdAt: now,
      updatedAt: now,
    });

    return journalId;
  },
});

/**
 * Update an existing journal entry.
 */
export const updateJournalEntry = mutation({
  args: {
    journalId: v.id("journal"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    mood: v.optional(v.union(
      v.literal("BULLISH"),
      v.literal("BEARISH"),
      v.literal("NEUTRAL"),
      v.literal("FRUSTRATED"),
      v.literal("CONFIDENT"),
    )),
    lessons: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.journalId);
    if (!entry || entry.userId !== user._id) throw new Error("Journal entry not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.content !== undefined) patch.content = args.content;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.mood !== undefined) patch.mood = args.mood;
    if (args.lessons !== undefined) patch.lessons = args.lessons;

    await ctx.db.patch(args.journalId, patch);
  },
});

/**
 * Delete a journal entry.
 */
export const deleteJournalEntry = mutation({
  args: { journalId: v.id("journal") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.journalId);
    if (!entry || entry.userId !== user._id) throw new Error("Journal entry not found");

    await ctx.db.delete(args.journalId);
  },
});

/**
 * Get all journal entries for the current user.
 */
export const getMyJournalEntries = query({
  args: {
    symbol: v.optional(v.string()),
    tradeId: v.optional(v.id("trades")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = args.limit ?? 50;

    if (args.tradeId) {
      return await ctx.db
        .query("journal")
        .withIndex("by_user_trade", (q) => q.eq("userId", user._id).eq("tradeId", args.tradeId))
        .order("desc")
        .take(limit);
    }

    const entries = await ctx.db
      .query("journal")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    if (args.symbol) {
      return entries.filter((e) => e.symbol === args.symbol);
    }

    return entries;
  },
});
