// ============================================================================
// WARRIKS AI — Watchlist View
// Manage tracked symbols with real-time prices, alerts, quick navigation
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Bell,
  BellOff,
  BarChart3,
} from "lucide-react";
import type { MarketData } from "@/engine/types";

interface WatchlistViewProps {
  markets: MarketData[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

const DEFAULT_WATCHLIST = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD"];

export default function WatchlistView({ markets, activeSymbol, onSelectSymbol }: WatchlistViewProps) {
  const [watchlist, setWatchlist] = useState<string[]>([...DEFAULT_WATCHLIST]);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({
    NAS100: true,
    XAUUSD: true,
    EURUSD: false,
    GBPUSD: true,
  });
  const [adding, setAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  const allSymbols = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"];

  const addToWatch = () => {
    const sym = newSymbol.toUpperCase().trim();
    if (sym && allSymbols.includes(sym) && !watchlist.includes(sym)) {
      setWatchlist([...watchlist, sym]);
      setAlerts({ ...alerts, [sym]: true });
      setNewSymbol("");
      setAdding(false);
    }
  };

  const removeFromWatch = (sym: string) => {
    setWatchlist(watchlist.filter((s) => s !== sym));
  };

  const toggleAlert = (sym: string) => {
    setAlerts({ ...alerts, [sym]: !alerts[sym] });
  };

  const availableSymbols = allSymbols.filter((s) => !watchlist.includes(s));

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Star className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Watchlist</span>
          <span className="text-[10px] text-[#475569]">{watchlist.length} symbols</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-semibold text-[#06b6d4] border border-[#06b6d4]/20 hover:bg-[#06b6d4]/10 transition-all"
        >
          <Plus className="w-3 h-3" />
          Add Symbol
        </button>
      </div>

      {/* Add symbol bar */}
      {adding && (
        <div className="h-10 bg-[#111d2e] border-b border-[#1e2d3d] flex items-center gap-2 px-4 shrink-0">
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Enter symbol (e.g., BTCUSD)"
            className="bg-[#0a0e17] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 w-40 outline-none focus:border-[#06b6d4]/50"
            onKeyDown={(e) => e.key === "Enter" && addToWatch()}
          />
          {availableSymbols.length > 0 && (
            <div className="flex gap-1">
              {availableSymbols.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => { setNewSymbol(s); }}
                  className="px-1.5 py-1 text-[9px] text-[#64748b] border border-[#1e2d3d] hover:text-[#e2e8f0] hover:border-[#06b6d4]/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <button onClick={addToWatch} className="px-2 py-1 text-[9px] font-semibold text-white bg-[#06b6d4]/80 hover:bg-[#06b6d4] transition-all">
            Add
          </button>
          <button onClick={() => { setAdding(false); setNewSymbol(""); }} className="px-2 py-1 text-[9px] text-[#64748b] hover:text-[#e2e8f0]">
            Cancel
          </button>
        </div>
      )}

      {/* Watchlist grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {watchlist.map((sym, i) => {
            const market = markets.find((m) => m.symbol === sym);
            const isActive = sym === activeSymbol;
            const isUp = market ? market.change >= 0 : true;
            const hasAlert = alerts[sym];

            return (
              <motion.div
                key={sym}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-sm p-3 cursor-pointer transition-all ${
                  isActive ? "glass-card-active" : ""
                }`}
                onClick={() => onSelectSymbol(sym)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isActive ? "text-[#06b6d4]" : "text-[#e2e8f0]"}`}>
                      {sym}
                    </span>
                    {isActive && <span className="status-dot online" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAlert(sym); }}
                      className={`p-1 transition-colors ${hasAlert ? "text-[#f59e0b]" : "text-[#475569]"}`}
                      title={hasAlert ? "Disable alerts" : "Enable alerts"}
                    >
                      {hasAlert ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromWatch(sym); }}
                      className="p-1 text-[#475569] hover:text-[#ef4444] transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {market ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold trading-mono ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                        {market.price.toFixed(sym === "NAS100" || sym === "XAUUSD" ? 1 : 4)}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                        {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {isUp ? "+" : ""}{market.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[#475569]">
                      <span>H: {market.high.toFixed(sym === "XAUUSD" ? 1 : 2)}</span>
                      <span>L: {market.low.toFixed(sym === "XAUUSD" ? 1 : 2)}</span>
                      <span>V: {(market.volume / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-center">
                    <span className="text-[10px] text-[#475569]">Loading data...</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <span className="text-[8px] text-[#475569]">Click card to view chart • Toggle alerts for price notifications</span>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <span className="status-dot online" />
          {watchlist.length} Tracked
        </span>
      </div>
    </div>
  );
}
