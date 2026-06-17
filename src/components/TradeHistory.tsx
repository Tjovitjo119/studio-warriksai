// ============================================================================
// WARRIKS AI — Trade History & Performance Metrics (Bottom Panel)
// Displays recent trades and portfolio performance statistics
// ============================================================================

import { useMemo, useState } from "react";
import type { TradeRecord } from "@/engine/types";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface TradeHistoryProps {
  trades: TradeRecord[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const [view, setView] = useState<"trades" | "metrics">("metrics");

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.status === "WIN");
    const losses = closed.filter((t) => t.status === "LOSS");
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const avgRR = closed.length > 0 ? closed.reduce((s, t) => s + t.riskReward, 0) / closed.length : 0;
    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl)) : 0;
    const profitFactor = losses.reduce((s, t) => s + Math.abs(t.pnl), 0) > 0
      ? wins.reduce((s, t) => s + t.pnl, 0) / Math.max(losses.reduce((s, t) => s + Math.abs(t.pnl), 0), 0.01)
      : wins.length > 0 ? Infinity : 0;

    return { wins: wins.length, losses: losses.length, winRate, totalPnl, avgRR, bestTrade, worstTrade, profitFactor, total: closed.length };
  }, [trades]);

  return (
    <div className="h-full flex flex-col bg-[#0c0e12] neo-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-[#111318] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#b0b8c8] tracking-wider uppercase">TRADE LOG</span>
          <div className="flex gap-0.5">
            <button
              onClick={() => setView("metrics")}
              className={`text-[10px] px-2 py-0.5 transition-colors ${
                view === "metrics" ? "bg-[#22c55e] text-black font-bold" : "bg-[#1a1d26] text-muted-foreground"
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setView("trades")}
              className={`text-[10px] px-2 py-0.5 transition-colors ${
                view === "trades" ? "bg-[#22c55e] text-black font-bold" : "bg-[#1a1d26] text-muted-foreground"
              }`}
            >
              History
            </button>
          </div>
        </div>
        <span className={`text-sm font-bold ${stats.totalPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
        </span>
      </div>

      {view === "metrics" ? (
        <div className="flex-1 p-3 grid grid-cols-4 gap-3">
          {/* Win Rate */}
          <div className="bg-[#111318] border border-border p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-[#22c55e]" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Win Rate</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.winRate.toFixed(1)}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {stats.wins}W / {stats.losses}L
            </span>
          </div>

          {/* Profit Factor */}
          <div className="bg-[#111318] border border-border p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-[#22c55e]" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Profit Factor</span>
            </div>
            <span className={`text-lg font-bold ${stats.profitFactor >= 1.5 ? "text-[#22c55e]" : "text-[#eab308]"}`}>
              {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Avg R:R {stats.avgRR.toFixed(2)}
            </span>
          </div>

          {/* Best / Worst */}
          <div className="bg-[#111318] border border-border p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-[#22c55e]" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Best / Worst</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#22c55e]">+${stats.bestTrade.toFixed(2)}</span>
              <span className="text-sm font-bold text-[#ef4444]">${stats.worstTrade.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {stats.total} total trades
            </span>
          </div>

          {/* Performance bar */}
          <div className="bg-[#111318] border border-border p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Confluence</span>
            </div>
            <div className="flex-1 flex items-end gap-1">
              {[80, 85, 75, 90, 82, 78, 88, 92, 70, 85].map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full ${
                      score >= 85 ? "bg-[#22c55e]" : score >= 75 ? "bg-[#eab308]" : "bg-[#ef4444]"
                    }`}
                    style={{ height: `${score}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Table header */}
          <div className="grid grid-cols-7 gap-1 px-3 py-1.5 text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-[#111318]">
            <span>Symbol</span>
            <span>Dir</span>
            <span>Entry</span>
            <span>Exit</span>
            <span>R:R</span>
            <span className="text-right">P&L</span>
            <span className="text-right">Status</span>
          </div>

          {trades.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-7 gap-1 px-3 py-2 text-[11px] border-b border-border/30 hover:bg-[#15181e] transition-colors"
            >
              <span className="font-bold text-white">{trade.symbol}</span>
              <span className={trade.direction === "BUY" ? "text-[#22c55e]" : "text-[#ef4444]"}>
                {trade.direction === "BUY" ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
              </span>
              <span className="text-muted-foreground">{trade.entryPrice.toFixed(2)}</span>
              <span className="text-muted-foreground">{trade.exitPrice.toFixed(2)}</span>
              <span className="text-muted-foreground">{trade.riskReward.toFixed(1)}</span>
              <span className={`text-right font-bold ${trade.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
              </span>
              <span className={`text-right text-[10px] ${trade.status === "WIN" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {trade.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
