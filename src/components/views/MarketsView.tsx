// ============================================================================
// WARRIKS AI — Markets View
// Full markets overview with real-time prices, all symbols, sorting, filtering
// ============================================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  BarChart3,
  Filter,
  Star,
} from "lucide-react";
import type { MarketData } from "@/engine/types";

interface MarketsViewProps {
  markets: MarketData[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

type SortField = "symbol" | "price" | "change" | "changePercent" | "high" | "low" | "volume";
type SortDir = "asc" | "desc";

export default function MarketsView({ markets, activeSymbol, onSelectSymbol, onRefresh, refreshing }: MarketsViewProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterDir, setFilterDir] = useState<"ALL" | "UP" | "DOWN">("ALL");

  const sorted = useMemo(() => {
    let filtered = [...markets];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => m.symbol.toLowerCase().includes(q));
    }

    if (filterDir === "UP") filtered = filtered.filter((m) => m.change > 0);
    else if (filterDir === "DOWN") filtered = filtered.filter((m) => m.change < 0);

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
        case "price": cmp = a.price - b.price; break;
        case "change": cmp = a.change - b.change; break;
        case "changePercent": cmp = a.changePercent - b.changePercent; break;
        case "high": cmp = a.high - b.high; break;
        case "low": cmp = a.low - b.low; break;
        case "volume": cmp = a.volume - b.volume; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [markets, search, sortField, sortDir, filterDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-0.5 text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  const allSymbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"];

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Markets Overview</span>
          <span className="text-[10px] text-[#475569]">{sorted.length} instruments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px]">
            <span className="text-[#10b981]">▲{markets.filter((m) => m.change > 0).length}</span>
            <span className="text-[#475569]">/</span>
            <span className="text-[#ef4444]">▼{markets.filter((m) => m.change < 0).length}</span>
          </div>
          <button onClick={onRefresh} disabled={refreshing} className="btn-ghost p-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#06b6d4]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-9 bg-[#0a0e17] border-b border-[#1e2d3d] flex items-center gap-3 px-4 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3 h-3 text-[#475569]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbols..."
            className="bg-transparent text-[10px] text-[#e2e8f0] placeholder:text-[#475569] border-none outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["ALL", "UP", "DOWN"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDir(d)}
              className={`px-2 py-1 text-[9px] font-medium transition-all ${
                filterDir === d ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {d === "ALL" ? "All" : d === "UP" ? "▲ Gainers" : "▼ Losers"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#111d2e] border-b border-[#1e2d3d]">
              {[
                { field: "symbol" as SortField, label: "Symbol" },
                { field: "price" as SortField, label: "Price" },
                { field: "change" as SortField, label: "Change" },
                { field: "changePercent" as SortField, label: "Change %" },
                { field: "high" as SortField, label: "High" },
                { field: "low" as SortField, label: "Low" },
                { field: "volume" as SortField, label: "Volume" },
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => toggleSort(field)}
                  className="px-3 py-2 text-[9px] text-[#475569] uppercase tracking-wider font-semibold text-left cursor-pointer hover:text-[#94a3b8]"
                >
                  {label}
                  <SortIcon field={field} />
                </th>
              ))}
              <th className="px-3 py-2 text-[9px] text-[#475569] uppercase tracking-wider font-semibold text-left">Chart</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((market, i) => {
              const isUp = market.change >= 0;
              const isActive = market.symbol === activeSymbol;
              return (
                <motion.tr
                  key={market.symbol}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelectSymbol(market.symbol)}
                  className={`border-b border-[#1e2d3d]/50 cursor-pointer transition-colors ${
                    isActive ? "bg-[#06b6d4]/6" : "hover:bg-[#111d2e]/50"
                  }`}
                >
                  <td className={`px-3 py-2.5 font-bold ${isActive ? "text-[#06b6d4]" : "text-[#e2e8f0]"}`}>
                    <div className="flex items-center gap-2">
                      <span>{market.symbol}</span>
                      {isActive && <span className="status-dot online" />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 trading-mono text-[#e2e8f0]">
                    {market.price.toFixed(market.symbol === "NAS100" ? 1 : 4)}
                  </td>
                  <td className={`px-3 py-2.5 trading-mono ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {isUp ? "+" : ""}{market.change.toFixed(market.symbol === "XAUUSD" ? 2 : 4)}
                  </td>
                  <td className={`px-3 py-2.5 trading-mono ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    <div className="flex items-center gap-1">
                      {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                      {isUp ? "+" : ""}{market.changePercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-2.5 trading-mono text-[#64748b]">
                    {market.high.toFixed(market.symbol === "NAS100" ? 1 : 4)}
                  </td>
                  <td className="px-3 py-2.5 trading-mono text-[#64748b]">
                    {market.low.toFixed(market.symbol === "NAS100" ? 1 : 4)}
                  </td>
                  <td className="px-3 py-2.5 trading-mono text-[#64748b]">
                    {market.volume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {[60, 75, 45, 80, 55, 70, 90].slice(i % 4).map((h, j) => (
                        <div key={j} className={`w-1 ${h > 60 ? "bg-[#10b981]/50" : "bg-[#ef4444]/50"}`} style={{ height: `${h * 0.4}px` }} />
                      ))}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <span className="text-[8px] text-[#475569]">Data refreshes every 60s • Click row to select symbol</span>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <span className="status-dot online" />
          Live Feed Active
        </span>
      </div>
    </div>
  );
}
