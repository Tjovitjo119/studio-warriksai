// ============================================================================
// WARRIKS AI — Market Watchlist Component (Left Panel)
// Displays live prices, changes, and high/low for each tracked symbol
// ============================================================================

import { useMemo } from "react";
import type { MarketData } from "@/engine/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MarketWatchlistProps {
  markets: MarketData[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function MarketWatchlist({
  markets,
  activeSymbol,
  onSelectSymbol,
}: MarketWatchlistProps) {
  const stats = useMemo(() => {
    const total = markets.length;
    const gainers = markets.filter((m) => m.change > 0).length;
    const losers = markets.filter((m) => m.change < 0).length;
    return { total, gainers, losers };
  }, [markets]);

  return (
    <div className="h-full flex flex-col bg-[#0c0e12] neo-border">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border bg-[#111318] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#b0b8c8] tracking-wider uppercase">MARKETS</span>
          <span className="text-[10px] text-muted-foreground">
            {stats.total} | ▲{stats.gainers} ▼{stats.losers}
          </span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-blink" />
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto">
        {markets.map((market) => {
          const isActive = market.symbol === activeSymbol;
          const isUp = market.change > 0;
          const isDown = market.change < 0;

          return (
            <button
              key={market.symbol}
              onClick={() => onSelectSymbol(market.symbol)}
              className={`w-full px-3 py-2.5 flex items-center justify-between border-b border-border/50 hover:bg-[#15181e] transition-colors text-left ${
                isActive ? "bg-[#1a1d26] border-l-2 border-l-[#22c55e]" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isActive ? "text-white" : "text-[#8a92a4]"}`}>
                  {market.symbol}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  H:{market.high.toFixed(market.symbol === "NAS100" ? 0 : 2)}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm font-bold trading-mono">
                  {market.price.toFixed(market.symbol === "NAS100" ? 1 : 2)}
                </span>
                <div className={`flex items-center gap-1 mt-0.5 ${isUp ? "text-[#22c55e]" : isDown ? "text-[#ef4444]" : "text-muted-foreground"}`}>
                  {isUp ? (
                    <ArrowUp className="w-2.5 h-2.5" />
                  ) : isDown ? (
                    <ArrowDown className="w-2.5 h-2.5" />
                  ) : (
                    <Minus className="w-2.5 h-2.5" />
                  )}
                  <span className="text-[10px] font-medium">
                    {market.changePercent > 0 ? "+" : ""}
                    {market.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend footer */}
      <div className="px-3 py-2 border-t border-border bg-[#111318]">
        <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-[#22c55e]" />
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-[#ef4444]" />
            <span>Bearish</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-[#4a5060] dashed" />
            <span>Liq. Zone</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] opacity-50" />
            <span>Sweep</span>
          </div>
        </div>
      </div>
    </div>
  );
}
