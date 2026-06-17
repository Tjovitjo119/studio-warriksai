// ============================================================================
// WARRIKS AI — Studio Trading Journal Panel
// Clean journal with warm tones, thin borders, editorial spacing
// ============================================================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

interface TradeJournalProps {
  activeSymbol: string;
}

const MOODS = [
  { value: "BULLISH" as const, label: "Bullish", icon: TrendingUp, color: "#7a9e7a" },
  { value: "CONFIDENT" as const, label: "Confident", icon: Smile, color: "#2c2822" },
  { value: "NEUTRAL" as const, label: "Neutral", icon: Meh, color: "#8a8070" },
  { value: "BEARISH" as const, label: "Bearish", icon: TrendingDown, color: "#c46a6a" },
  { value: "FRUSTRATED" as const, label: "Frustrated", icon: Frown, color: "#c49a6c" },
];

const DEFAULT_TAGS = ["ICT", "SMC", "FVG", "MOMENTUM", "BREAKOUT", "LONDON", "NEW_YORK"];

export default function TradeJournal({ activeSymbol }: TradeJournalProps) {
  const journalEntries = useQuery(api.journal.getMyJournalEntries, { symbol: activeSymbol, limit: 20 });
  const createEntry = useMutation(api.journal.createJournalEntry);
  const deleteEntry = useMutation(api.journal.deleteJournalEntry);

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lessons, setLessons] = useState("");
  const [mood, setMood] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | "FRUSTRATED" | "CONFIDENT" | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const addCustomTag = () => {
    const trimmed = tagInput.trim().toUpperCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await createEntry({
        symbol: activeSymbol, title: title.trim(), content: content.trim(),
        tags, mood, lessons: lessons.trim() || undefined,
        tradeId: undefined,
      });
      setTitle(""); setContent(""); setLessons(""); setMood(undefined); setTags([]); setShowNewEntry(false);
    } catch (err) {
      console.error("Failed to create journal entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"journal">) => {
    try { await deleteEntry({ journalId: id }); } catch (err) { console.error("Failed to delete entry:", err); }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-[#fcfaf7] overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#e0dad0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-[#2c2822]" />
          <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">Journal</span>
        </div>
        <button onClick={() => setShowNewEntry(!showNewEntry)}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-[#2c2822] bg-[#f0ece6] border border-[#e0dad0] hover:bg-[#e8e3da] transition-all">
          <Plus className="w-3 h-3" /> New Entry
        </button>
      </div>

      <AnimatePresence>
        {showNewEntry && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#e0dad0]">
            <div className="p-3 space-y-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title..."
                className="w-full bg-[#f8f6f2] border border-[#e0dad0] text-[11px] text-[#2c2822] px-2 py-1.5 font-medium focus:outline-none focus:border-[#2c2822] transition-colors" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your analysis..."
                rows={3} className="w-full bg-[#f8f6f2] border border-[#e0dad0] text-[10px] text-[#2c2822] px-2 py-1.5 resize-none focus:outline-none focus:border-[#2c2822] transition-colors" />
              <textarea value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Lessons learned..."
                rows={2} className="w-full bg-[#f8f6f2] border border-[#e0dad0] text-[10px] text-[#c49a6c] px-2 py-1.5 resize-none focus:outline-none focus:border-[#2c2822] transition-colors" />

              <div>
                <span className="text-[8px] text-[#b5ab9c] uppercase tracking-wider font-semibold mb-1 block">Mood</span>
                <div className="flex gap-1 flex-wrap">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = mood === m.value;
                    return (
                      <button key={m.value} onClick={() => setMood(isSelected ? undefined : m.value)}
                        className={`flex items-center gap-1 px-2 py-1 text-[8px] font-medium transition-all border ${
                          isSelected ? "bg-[#f0ece6] border-[#2c2822]/30 text-[#2c2822]" : "bg-transparent border-[#e0dad0] text-[#8a8070] hover:text-[#2c2822]"
                        }`}>
                        <Icon className="w-2.5 h-2.5" style={{ color: isSelected ? m.color : undefined }} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[8px] text-[#b5ab9c] uppercase tracking-wider font-semibold mb-1 block">Tags</span>
                <div className="flex flex-wrap gap-1 mb-1">
                  {DEFAULT_TAGS.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`px-1.5 py-0.5 text-[8px] font-mono transition-all border ${
                        tags.includes(tag) ? "bg-[#f0ece6] border-[#2c2822]/30 text-[#2c2822]" : "bg-[#f8f6f2] border-[#e0dad0] text-[#8a8070] hover:text-[#2c2822]"
                      }`}>{tag}</button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTag()} placeholder="Custom tag..."
                    className="flex-1 bg-[#f8f6f2] border border-[#e0dad0] text-[9px] text-[#2c2822] px-2 py-1 focus:outline-none focus:border-[#2c2822] transition-colors" />
                  <button onClick={addCustomTag}
                    className="px-2 py-1 text-[9px] text-[#2c2822] bg-[#f0ece6] border border-[#e0dad0] hover:bg-[#e8e3da] transition-all">Add</button>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full py-1.5 text-[10px] font-bold text-white bg-[#2c2822] hover:bg-[#3e3830] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Saving..." : "Save Journal Entry"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        {!journalEntries ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-4 h-4 border border-[#8a8070]/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <BookOpen className="w-6 h-6 text-[#b5ab9c] mb-2" />
            <span className="text-[10px] text-[#8a8070]">No journal entries yet</span>
            <span className="text-[8px] text-[#b5ab9c] mt-1">Document your trades and reflect on your strategy</span>
          </div>
        ) : (
          journalEntries.map((entry) => {
            const isExpanded = expandedId === entry._id;
            const moodInfo = MOODS.find((m) => m.value === entry.mood);
            const MoodIcon = moodInfo?.icon || Meh;
            return (
              <div key={entry._id} className="border-b border-[#e8e3da]/50">
                <button onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                  className="w-full px-3 py-2 flex items-start justify-between hover:bg-[#f8f6f2] transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {entry.mood && <MoodIcon className="w-3 h-3 shrink-0" style={{ color: moodInfo?.color }} />}
                      <span className="text-[10px] font-medium text-[#2c2822] truncate">{entry.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-[#b5ab9c]">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(entry.createdAt)}</span>
                      <span className="w-px h-2 bg-[#e0dad0]" />
                      <span className="text-[#8a8070]">{entry.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                      className="p-1 text-[#b5ab9c] hover:text-[#c46a6a] transition-colors">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-2">
                        <div className="text-[9px] text-[#5d5549] leading-relaxed whitespace-pre-wrap">{entry.content}</div>
                        {entry.lessons && (
                          <div className="border border-[#c49a6c]/20 bg-[#c49a6c]/5 p-2">
                            <div className="flex items-center gap-1 text-[8px] text-[#c49a6c] uppercase tracking-wider font-semibold mb-1">
                              Lessons Learned
                            </div>
                            <div className="text-[9px] text-[#5d5549] whitespace-pre-wrap">{entry.lessons}</div>
                          </div>
                        )}
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="text-[7px] px-1 py-0.5 bg-[#f8f6f2] border border-[#e0dad0] text-[#8a8070]">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
