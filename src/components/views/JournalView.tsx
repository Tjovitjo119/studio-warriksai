// ============================================================================
// WARRIKS AI — Journal View (Full Page)
// Trading journal with analytics, streaks, mood tracking, lessons learned
// ============================================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  Meh,
  Zap,
  Brain,
  BarChart3,
  Calendar,
  Tag,
  Search,
  Moon,
  Sun,
} from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  symbol: string;
  tags: string[];
  mood: "BULLISH" | "BEARISH" | "NEUTRAL" | "CONFIDENT" | "FRUSTRATED";
  lessons: string;
  createdAt: Date;
  tradeResult?: "WIN" | "LOSS";
}

const MOOD_CONFIG: Record<string, { icon: typeof Smile; color: string; label: string }> = {
  BULLISH: { icon: TrendingUp, color: "#10b981", label: "Bullish" },
  BEARISH: { icon: TrendingDown, color: "#ef4444", label: "Bearish" },
  NEUTRAL: { icon: Meh, color: "#64748b", label: "Neutral" },
  CONFIDENT: { icon: Zap, color: "#06b6d4", label: "Confident" },
  FRUSTRATED: { icon: Frown, color: "#f59e0b", label: "Frustrated" },
};

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: "J1", title: "NASDAQ Breakout Trade Review", content: "Excellent trade execution. The FVG formed perfectly during NY killzone and price respected the order block. Entry was precise at 19480. TP1 hit within 45 minutes. Key lesson: patience during killzone setup pays off.",
    symbol: "NAS100", tags: ["breakout", "FVG", "NY-killzone"], mood: "CONFIDENT", lessons: "Always wait for killzone confirmation before entry. The FVG + OB confluence is powerful.",
    createdAt: new Date(Date.now() - 3600000), tradeResult: "WIN",
  },
  {
    id: "J2", title: "EURUSD - Stopped Out Too Early", content: "Moved stop loss too tight before the news release. The analysis was correct but position management needs improvement. Should have given more room during high-impact news.",
    symbol: "EURUSD", tags: ["mistake", "stoploss", "management"], mood: "FRUSTRATED", lessons: "Widen stops during news events. Trust the analysis but manage risk accordingly.",
    createdAt: new Date(Date.now() - 7200000), tradeResult: "LOSS",
  },
  {
    id: "J3", title: "Gold Short During London Session", content: "London session provided excellent liquidity sweep above 2350. Order block held perfectly. Quick 1:2 R:R achieved in 2 hours.",
    symbol: "XAUUSD", tags: ["gold", "london", "sweep"], mood: "BULLISH", lessons: "London killzone sweeps are reliable entry points for gold. Watch for equal highs.",
    createdAt: new Date(Date.now() - 14400000), tradeResult: "WIN",
  },
  {
    id: "J4", title: "Weekly Strategy Review", content: "Overall good week. 4 wins, 2 losses. Main issue was overtrading on lower timeframes. Need to focus on 1H+ setups with higher confluence.",
    symbol: "ALL", tags: ["weekly-review", "discipline"], mood: "NEUTRAL", lessons: "Quality over quantity. Minimum 4H chart analysis before any trade.",
    createdAt: new Date(Date.now() - 86400000),
  },
];

export default function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    title: "", content: "", symbol: "NAS100", tags: "", mood: "NEUTRAL" as JournalEntry["mood"], lessons: "",
  });

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.symbol.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const stats = useMemo(() => {
    const wins = entries.filter((e) => e.tradeResult === "WIN").length;
    const losses = entries.filter((e) => e.tradeResult === "LOSS").length;
    const total = wins + losses;
    return { total: entries.length, wins, losses, winRate: total > 0 ? (wins / total) * 100 : 0 };
  }, [entries]);

  const tags = useMemo(() => {
    const all = entries.flatMap((e) => e.tags);
    return [...new Set(all)].slice(0, 20);
  }, [entries]);

  const createEntry = () => {
    if (!newEntry.title.trim()) return;
    const entry: JournalEntry = {
      id: `J${Date.now()}`,
      title: newEntry.title,
      content: newEntry.content,
      symbol: newEntry.symbol,
      tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean),
      mood: newEntry.mood,
      lessons: newEntry.lessons,
      createdAt: new Date(),
    };
    setEntries([entry, ...entries]);
    setNewEntry({ title: "", content: "", symbol: "NAS100", tags: "", mood: "NEUTRAL", lessons: "" });
    setShowNew(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Trading Journal</span>
          <span className="text-[10px] text-[#475569]">{stats.total} entries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[8px] text-[#475569] mr-2">
            <span className="text-[#10b981]">▲ {stats.wins} wins</span>
            <span className="w-px h-2.5 bg-[#1e2d3d]" />
            <span className="text-[#ef4444]">▼ {stats.losses} losses</span>
            <span className="w-px h-2.5 bg-[#1e2d3d]" />
            <span className="text-[#f59e0b]">{stats.winRate.toFixed(0)}% WR</span>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all">
            <Plus className="w-3 h-3" /> New Entry
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="h-9 bg-[#0a0e17] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3 h-3 text-[#475569]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search journal entries..."
            className="bg-transparent text-[10px] text-[#e2e8f0] placeholder:text-[#475569] border-none outline-none w-full" />
        </div>
        <div className="flex items-center gap-1">
          {tags.slice(0, 6).map((tag) => (
            <button key={tag} onClick={() => setSearch(tag)}
              className="px-1.5 py-0.5 text-[8px] text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:border-[#06b6d4]/30 hover:text-[#06b6d4] transition-all">
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* New Entry Form */}
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-3 p-3 glass-card rounded-sm">
            <div className="space-y-2">
              <input value={newEntry.title} onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="Entry title..." className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
              <div className="flex items-center gap-2">
                <input value={newEntry.symbol} onChange={(e) => setNewEntry({ ...newEntry, symbol: e.target.value.toUpperCase() })}
                  placeholder="Symbol" className="w-20 bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30" />
                <select value={newEntry.mood} onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value as any })}
                  className="bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 outline-none">
                  {Object.entries(MOOD_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input value={newEntry.tags} onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                  placeholder="Tags (comma separated)" className="flex-1 bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30" />
              </div>
              <textarea value={newEntry.content} onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Write your trade analysis, thoughts, and observations..."
                className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1.5 h-24 outline-none focus:border-[#06b6d4]/30 resize-none" />
              <textarea value={newEntry.lessons} onChange={(e) => setNewEntry({ ...newEntry, lessons: e.target.value })}
                placeholder="Key lessons learned..."
                className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1.5 h-12 outline-none focus:border-[#06b6d4]/30 resize-none" />
              <div className="flex items-center gap-2">
                <button onClick={createEntry}
                  className="px-3 py-1.5 text-[9px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all">
                  Save Entry
                </button>
                <button onClick={() => setShowNew(false)}
                  className="px-3 py-1.5 text-[9px] text-[#64748b] hover:text-[#e2e8f0]">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Entries List */}
        <div className="p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-10 h-10 text-[#475569] mb-2 opacity-30" />
              <span className="text-[10px] text-[#64748b]">No journal entries found</span>
              <button onClick={() => setShowNew(true)} className="mt-2 text-[9px] text-[#06b6d4] hover:underline">
                Create your first entry
              </button>
            </div>
          ) : (
            filtered.map((entry) => {
              const moodCfg = MOOD_CONFIG[entry.mood];
              const MoodIcon = moodCfg.icon;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-sm overflow-hidden"
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MoodIcon className="w-3.5 h-3.5 shrink-0" style={{ color: moodCfg.color }} />
                        <span className="text-[11px] font-semibold text-[#e2e8f0] truncate">{entry.title}</span>
                        <span className="text-[9px] px-1 py-0.5 bg-[#111d2e] border border-[#1e2d3d] text-[#64748b]">{entry.symbol}</span>
                        {entry.tradeResult && (
                          <span className={`text-[8px] px-1 py-0.5 font-semibold ${
                            entry.tradeResult === "WIN" ? "text-[#10b981] bg-[#10b981]/10" : "text-[#ef4444] bg-[#ef4444]/10"
                          }`}>{entry.tradeResult}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[8px] text-[#475569]">
                          {entry.createdAt.toLocaleDateString()}
                        </span>
                        <button onClick={() => deleteEntry(entry.id)}
                          className="p-1 text-[#475569] hover:text-[#ef4444] transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] text-[#64748b] leading-relaxed mb-2">{entry.content}</p>
                    {entry.lessons && (
                      <div className="bg-[#06b6d4]/6 border border-[#06b6d4]/10 px-2 py-1.5 mb-2">
                        <span className="text-[8px] font-semibold text-[#06b6d4] uppercase tracking-wider">Lessons Learned</span>
                        <p className="text-[9px] text-[#94a3b8] mt-0.5">{entry.lessons}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 text-[7px] text-[#64748b] bg-[#111d2e] border border-[#1e2d3d]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <span className="text-[8px] text-[#475569]">Record every trade for continuous improvement</span>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <Brain className="w-2.5 h-2.5" />
          Reflection is key to mastery
        </span>
      </div>
    </div>
  );
}
