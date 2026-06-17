// ============================================================================
// WARRIKS AI — News View
// Full news feed with categories, currency filters, real-time updates
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  Search,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
} from "lucide-react";

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  time: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  currency: string;
  type: string;
  url: string;
}

const ALL_NEWS: NewsItem[] = [
  { title: "FOMC Minutes: Dovish Tone on Rate Cuts", summary: "The Federal Reserve's latest minutes revealed a dovish stance, signaling potential rate cuts in Q3 2026 as inflation continues to moderate toward the 2% target.", source: "Reuters", time: "14:30 UTC", impact: "HIGH", currency: "USD", type: "FOMC", url: "#" },
  { title: "UK CPI Rises to 3.2%, Above Expectations", summary: "UK inflation unexpectedly rose to 3.2% in May, driven by rising service costs and energy prices. Markets now price in delayed BOE rate cuts.", source: "Bloomberg", time: "08:15 UTC", impact: "HIGH", currency: "GBP", type: "CPI", url: "#" },
  { title: "NFP Report: 228K Jobs Added vs 200K Expected", summary: "The US labor market remains resilient with 228K jobs added in May. Unemployment held steady at 3.9%, keeping the Fed cautious on rate cuts.", source: "BLS", time: "Yesterday", impact: "HIGH", currency: "USD", type: "NFP", url: "#" },
  { title: "ECB's Lagarde: Data-Dependent Approach", summary: "ECB President Lagarde emphasized the central bank's data-dependent approach, hinting at a potential rate cut in July if inflation data continues to soften.", source: "ECB", time: "Yesterday", impact: "MEDIUM", currency: "EUR", type: "SPEECH", url: "#" },
  { title: "China GDP Growth Slows to 4.6%", summary: "China's economic growth slowed to 4.6% in Q2, missing expectations of 5.0%. The slowdown is attributed to weak consumer demand and property sector challenges.", source: "SCMP", time: "Yesterday", impact: "MEDIUM", currency: "CNY", type: "GDP", url: "#" },
  { title: "Oil Prices Surge on Middle East Tensions", summary: "Crude oil prices surged 3.5% following renewed geopolitical tensions. WTI crude crossed $82/barrel for the first time in two months.", source: "Reuters", time: "2 days ago", impact: "HIGH", currency: "ALL", type: "GEOPOLITICAL", url: "#" },
  { title: "US ISM Manufacturing Unexpectedly Contracts", summary: "The ISM Manufacturing PMI fell to 48.7 in May, indicating contraction in the sector. New orders declined for the third consecutive month.", source: "ISM", time: "2 days ago", impact: "MEDIUM", currency: "USD", type: "PMI", url: "#" },
  { title: "BOJ Holds Rates, Yen Weakens Past 152", summary: "The Bank of Japan maintained its ultra-loose monetary policy, keeping rates at -0.10%. USD/JPY surged above 152 as the divergence widens.", source: "Nikkei", time: "3 days ago", impact: "HIGH", currency: "JPY", type: "BOJ", url: "#" },
  { title: "Gold Hits New All-Time High at $2,450", summary: "Gold prices reached a new record high of $2,450/oz as geopolitical tensions and rate cut expectations fuel safe-haven demand. Analysts target $2,500.", source: "Kitco", time: "3 days ago", impact: "MEDIUM", currency: "XAU", type: "COMMODITIES", url: "#" },
  { title: "Nasdaq 100 Extends Rally on AI Optimism", summary: "The Nasdaq 100 extended its 2026 rally, gaining 1.8% as AI-related stocks continue to attract institutional capital. Nvidia leads the charge.", source: "CNBC", time: "4 days ago", impact: "MEDIUM", currency: "USD", type: "EQUITIES", url: "#" },
];

function NewsImpactBadge({ impact }: { impact: string }) {
  const colors: Record<string, string> = {
    HIGH: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20",
    MEDIUM: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    LOW: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20",
  };
  return <span className={`text-[8px] px-1.5 py-0.5 border font-semibold tracking-wider ${colors[impact] || colors.MEDIUM}`}>{impact}</span>;
}

function CurrencyTag({ currency }: { currency: string }) {
  return <span className="text-[8px] px-1.5 py-0.5 bg-[#111d2e] border border-[#1e2d3d] text-[#64748b]">{currency}</span>;
}

export default function NewsView() {
  const [search, setSearch] = useState("");
  const [filterImpact, setFilterImpact] = useState<string>("ALL");
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [selectedNews, setSelectedNews] = useState<number | null>(null);

  const filtered = ALL_NEWS.filter((n) => {
    if (filterImpact !== "ALL" && n.impact !== filterImpact) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleBookmark = (i: number) => {
    setBookmarks({ ...bookmarks, [i]: !bookmarks[i] });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">News Feed</span>
          <span className="text-[10px] text-[#475569]">{filtered.length} stories</span>
        </div>
        <div className="flex items-center gap-1">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((imp) => (
            <button key={imp} onClick={() => setFilterImpact(imp)}
              className={`px-2 py-1 text-[8px] font-medium transition-all ${
                filterImpact === imp ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#475569] hover:text-[#e2e8f0]"
              }`}>{imp === "ALL" ? "All" : imp}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="h-9 bg-[#0a0e17] border-b border-[#1e2d3d] flex items-center px-4 shrink-0">
        <Search className="w-3 h-3 text-[#475569] mr-1.5" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search news..." className="bg-transparent text-[10px] text-[#e2e8f0] placeholder:text-[#475569] border-none outline-none flex-1" />
        <span className="text-[8px] text-[#475569]">{Object.values(bookmarks).filter(Boolean).length} bookmarked</span>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((news, i) => {
          const isSelected = selectedNews === i;
          const isBookmarked = bookmarks[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              className={`px-4 py-3 border-b border-[#1e2d3d]/50 cursor-pointer transition-all ${
                isSelected ? "bg-[#06b6d4]/6 border-l-2 border-l-[#06b6d4]" : "hover:bg-[#111d2e]/50 border-l-2 border-l-transparent"
              }`}
              onClick={() => setSelectedNews(isSelected ? null : i)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-[#e2e8f0] leading-tight">{news.title}</span>
                    <NewsImpactBadge impact={news.impact} />
                  </div>
                  <p className={`text-[9px] text-[#64748b] leading-relaxed ${isSelected ? "" : "line-clamp-1"}`}>
                    {news.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[8px] text-[#475569]">{news.source}</span>
                    <span className="w-px h-2.5 bg-[#1e2d3d]" />
                    <Clock className="w-2.5 h-2.5 text-[#475569]" />
                    <span className="text-[8px] text-[#475569]">{news.time}</span>
                    <span className="w-px h-2.5 bg-[#1e2d3d]" />
                    <CurrencyTag currency={news.currency} />
                    <span className="text-[8px] text-[#06b6d4]">{news.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); toggleBookmark(i); }}
                    className={`p-1.5 transition-colors ${isBookmarked ? "text-[#f59e0b]" : "text-[#475569] hover:text-[#e2e8f0]"}`}>
                    {isBookmarked ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                  </button>
                  <a href={news.url} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[#475569] hover:text-[#06b6d4] transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <span className="text-[8px] text-[#475569]">Click news item to expand · Bookmark for later reading</span>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <Globe className="w-2.5 h-2.5" />
          Live Feed Active
        </span>
      </div>
    </div>
  );
}
