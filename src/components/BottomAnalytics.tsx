// ============================================================================
// WARRIKS AI — N.E.O.N. Bottom Analytics Panel
// Dark surfaces, neon green/cyan/red for P&L, glowing status
// ============================================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Shield,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  LineChart,
  Layers,
  X,
  Check,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { TradeRecord, MultiStrategyOutput, StrategyType, CombinationResult } from "@/engine/types";
import { STRATEGY_LABELS } from "@/engine/types";

interface BottomAnalyticsProps {
  trades: TradeRecord[];
  markets: import("@/engine/types").MarketData[];
  multiStrategy?: MultiStrategyOutput | null;
  strategySummary?: { label: string; consensus: string; agreement: string; strategyBreakdown: { type: string; dir: string; conf: number }[] } | null;
  combinationResult?: CombinationResult | null;
  combinationSummary?: {
    totalEngines: number;
    activeEngines: number;
    agreementLabel: string;
    consensus: string;
    score: number;
    tradeable: boolean;
    engineDetails: { type: string; dir: string; conf: number; signal: boolean }[];
  } | null;
}

function MetricCard({ icon: Icon, label, value, color, subValue }: {
  icon: typeof TrendingUp; label: string; value: string; color: string; subValue?: string;
}) {
  return (
    <div className="bg-[#0a0e14] border border-[#1a2332] p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[8px] text-[#556677] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-sm font-bold text-white" style={{ color: color === "white" ? undefined : color }}>{value}</div>
      {subValue && <div className="text-[8px] text-[#445566] mt-0.5">{subValue}</div>}
    </div>
  );
}

export default function BottomAnalytics({ trades, multiStrategy, strategySummary, combinationResult, combinationSummary }: BottomAnalyticsProps) {
  const openTrades = useQuery(api.trades.getMyTrades, { status: "OPEN", limit: 20 });
  const tradeStats = useQuery(api.trades.getTradeStats);
  const closeTrade = useMutation(api.trades.closeTrade);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrices, setExitPrices] = useState<Record<string, string>>({});
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (tradeStats && tradeStats.total > 0) {
      return tradeStats;
    }
    const closed = trades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.status === "WIN");
    const losses = closed.filter((t) => t.status === "LOSS");
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const avgRR = closed.length > 0 ? closed.reduce((s, t) => s + t.riskReward, 0) / closed.length : 0;
    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl)) : 0;
    const returns = closed.map((t) => t.pnlPercent);
    const avgReturn = returns.reduce((s, r) => s + r, 0) / Math.max(returns.length, 1);
    const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / Math.max(returns.length, 1));
    const sharpe = stdDev > 0 ? avgReturn / stdDev * Math.sqrt(252) : 0;
    let peak = -Infinity; let maxDD = 0; let runningPnl = 0;
    for (const t of closed) { runningPnl += t.pnl; if (runningPnl > peak) peak = runningPnl; const dd = ((peak - runningPnl) / Math.max(Math.abs(peak), 1)) * 100; if (dd > maxDD) maxDD = dd; }
    return { winRate, totalPnl, avgRR, profitFactor, bestTrade, worstTrade, sharpe, maxDD, total: closed.length, wins: wins.length, losses: losses.length };
  }, [trades, tradeStats]);

  const displayPositions = openTrades && openTrades.length > 0
    ? openTrades.map((t) => ({ id: t._id, symbol: t.symbol, dir: t.direction, entry: t.entryPrice, current: t.entryPrice, sl: t.stopLoss, tp: t.takeProfit, rr: t.riskReward, qty: t.quantity }))
    : [];

  const handleCloseTrade = async (tradeId: string, symbol: string) => {
    const exitPrice = parseFloat(exitPrices[tradeId]);
    if (!exitPrice || isNaN(exitPrice)) return;
    setClosingId(tradeId);
    try {
      await closeTrade({ tradeId: tradeId as any, exitPrice });
      setCloseSuccess(tradeId);
      setTimeout(() => setCloseSuccess(null), 2000);
    } catch (err) { console.error("Failed to close trade:", err); } finally { setClosingId(null); }
  };

  return (
    <div className="h-full flex bg-[#05080e]">
      {/* Performance Metrics */}
      <div className="w-[280px] p-2 border-r border-[#1a2332] shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Activity className="w-3 h-3 text-[#00ff41]" />
          <span className="text-[9px] font-semibold text-white uppercase tracking-wider">Performance</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          <MetricCard icon={Target} label="Win Rate" value={`${(stats as any).winRate?.toFixed(1) || "0.0"}%`} color="#00ff41" subValue={`${(stats as any).wins || 0}W / ${(stats as any).losses || 0}L`} />
          <MetricCard icon={TrendingUp} label="Profit Factor" value={stats.profitFactor === Infinity ? "∞" : (stats.profitFactor || 0).toFixed(2)} color="white" subValue={`Avg R:R ${(stats.avgRR || 0).toFixed(2)}`} />
          <MetricCard icon={BarChart3} label="Sharpe" value={(stats.sharpe || 0).toFixed(2)} color="#00d4ff" />
          <MetricCard icon={TrendingDown} label="Max DD" value={`${(stats.maxDD || 0).toFixed(1)}%`} color="#ff3355" />
          <MetricCard icon={DollarSign} label="Best / Worst" value={`+${(stats.bestTrade || 0).toFixed(0)}`} color="#00ff41" subValue={`$${Math.abs(stats.worstTrade || 0).toFixed(0)}`} />
          <MetricCard icon={Activity} label="Total" value={`${stats.total || 0}`} color="#556677" />
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="w-[260px] p-2 border-r border-[#1a2332] shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Layers className="w-3 h-3 text-[#00d4ff]" />
          <span className="text-[9px] font-semibold text-white uppercase tracking-wider">Strategy Comparison</span>
          {multiStrategy && (
            <span className={`text-[8px] ml-auto font-bold ${
              multiStrategy.agreement === "STRONG" ? "text-[#00ff41]" :
              multiStrategy.agreement === "CONFLICT" ? "text-[#ff3355]" : "text-[#ffaa00]"
            }`}>{multiStrategy.agreement}</span>
          )}
        </div>
        {strategySummary && multiStrategy ? (
          <div className="space-y-1">
            {multiStrategy.strategies.map((strategy, i) => {
              const isBuy = strategy.direction === "BUY";
              const isSell = strategy.direction === "SELL";
              const color = isBuy ? "#00ff41" : isSell ? "#ff3355" : "#556677";
              return (
                <div key={i} className="px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-medium text-white">{STRATEGY_LABELS[strategy.type as StrategyType] || strategy.type}</span>
                    <div className="flex items-center gap-1">
                      {strategy.direction !== "NEUTRAL" && <span className="text-[9px] font-bold" style={{ color }}>{strategy.direction}</span>}
                      <span className="text-[9px] font-bold" style={{ color }}>{strategy.confidence}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1a2332] overflow-hidden mb-0.5">
                    <div className="h-full transition-all duration-500" style={{ width: `${strategy.confidence}%`, background: isBuy ? "linear-gradient(90deg, #00ff41, #00cc33)" : isSell ? "linear-gradient(90deg, #ff3355, #cc1133)" : "linear-gradient(90deg, #556677, #445566)" }} />
                  </div>
                  <span className="text-[7px] text-[#445566] leading-tight block truncate">
                    {strategy.reason.length > 80 ? strategy.reason.slice(0, 80) + "..." : strategy.reason}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-2 py-4 text-center">
            <span className="text-[8px] text-[#445566]">Running strategy analysis...</span>
          </div>
        )}
      </div>

      {/* Risk Manager */}
      <div className="w-[220px] p-2 border-r border-[#1a2332] shrink-0">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Shield className="w-3 h-3 text-[#00d4ff]" />
          <span className="text-[9px] font-semibold text-white uppercase tracking-wider">Risk Manager</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Account Balance", value: "$12,847.50", color: "text-white" },
            { label: "Open Positions", value: `${displayPositions.length}`, color: "text-[#ffaa00]" },
            { label: "Total P&L", value: `${(stats.totalPnl || 0) >= 0 ? "+" : ""}$${(stats.totalPnl || 0).toFixed(2)}`, color: (stats.totalPnl || 0) >= 0 ? "text-[#00ff41]" : "text-[#ff3355]" },
            { label: "Risk Per Trade", value: "1.5%", color: "text-white" },
            { label: "Win Rate", value: `${(stats as any).winRate?.toFixed(0) || "0"}%`, color: "text-[#00ff41]" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
              <span className="text-[9px] text-[#556677]">{item.label}</span>
              <span className={`text-[10px] font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
          {combinationSummary && (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                <span className="text-[9px] text-[#556677]">Engine Agreement</span>
                <span className={`text-[10px] font-bold ${combinationSummary.tradeable ? "text-[#00ff41]" : "text-[#ff3355]"}`}>
                  {combinationSummary.activeEngines}/{combinationSummary.totalEngines}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                <span className="text-[9px] text-[#556677]">Confluence</span>
                <span className={`text-[10px] font-bold ${combinationSummary.score >= 85 ? "text-[#00ff41]" : combinationSummary.score >= 75 ? "text-[#ffaa00]" : "text-[#ff3355]"}`}>
                  {combinationSummary.score}/100
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                <span className="text-[9px] text-[#556677]">Status</span>
                <span className={`text-[10px] font-bold ${combinationSummary.tradeable ? "text-[#00ff41]" : "text-[#ff3355]"}`}>
                  {combinationSummary.tradeable ? "TRADE" : "NO TRADE"}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="mt-3 px-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <LineChart className="w-3 h-3 text-[#00ff41]" />
            <span className="text-[8px] text-[#556677] uppercase tracking-wider font-semibold">Equity Curve</span>
          </div>
          <div className="h-12 bg-[#0a0e14] border border-[#1a2332] flex items-end gap-[1px] px-1 py-1">
            {[60, 62, 58, 65, 70, 68, 72, 78, 75, 82, 80, 85, 88, 84, 90, 92, 88, 95, 98, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div className="w-full" style={{ height: `${h}%`, background: i % 5 === 4 ? "#00ff41" : "rgba(0, 255, 65, 0.2)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="flex-[1.5] p-2 shrink-0 min-w-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <BarChart3 className="w-3 h-3 text-[#00d4ff]" />
          <span className="text-[9px] font-semibold text-white uppercase tracking-wider">Open Positions</span>
          <span className="text-[8px] text-[#445566] ml-auto">{displayPositions.length} position{displayPositions.length !== 1 ? "s" : ""}</span>
        </div>
        {displayPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <BarChart3 className="w-5 h-5 text-[#445566] mb-1.5 opacity-50" />
            <span className="text-[9px] text-[#556677]">No open positions</span>
            <span className="text-[8px] text-[#445566] mt-0.5">Use the Orders panel to open a trade</span>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-9 gap-px px-2 py-1 text-[8px] text-[#556677] uppercase tracking-wider font-semibold bg-[#0a0e14] border border-[#1a2332] mb-px">
              <span className="col-span-1">Sym</span>
              <span className="col-span-1">Dir</span>
              <span className="col-span-1 text-right">Entry</span>
              <span className="col-span-1 text-right">SL</span>
              <span className="col-span-1 text-right">TP</span>
              <span className="col-span-1 text-right">Qty</span>
              <span className="col-span-1 text-right">R:R</span>
              <span className="col-span-1 text-right">Exit</span>
              <span className="col-span-1 text-right">Act</span>
            </div>
            {displayPositions.map((pos) => {
              const exitPrice = exitPrices[pos.id] || "";
              const isClosing = closingId === pos.id;
              const isClosed = closeSuccess === pos.id;
              return (
                <div key={pos.id} className="grid grid-cols-9 gap-px px-2 py-1.5 text-[10px] border-b border-[#1a2332]/50 hover:bg-[#00ff41]/[0.02] transition-colors items-center">
                  <span className="col-span-1 font-semibold text-white">{pos.symbol}</span>
                  <span className={`col-span-1 font-bold ${pos.dir === "BUY" ? "text-[#00ff41]" : "text-[#ff3355]"}`}>
                    {pos.dir === "BUY" ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                  </span>
                  <span className="col-span-1 text-right text-[#556677]">{pos.entry.toFixed(pos.symbol === "XAUUSD" ? 1 : 2)}</span>
                  <span className="col-span-1 text-right text-[#ff3355]/70">{pos.sl.toFixed(1)}</span>
                  <span className="col-span-1 text-right text-[#00ff41]/70">{pos.tp.toFixed(1)}</span>
                  <span className="col-span-1 text-right text-[#556677]">{pos.qty}</span>
                  <span className="col-span-1 text-right text-white">{pos.rr.toFixed(1)}</span>
                  <span className="col-span-1">
                    <input type="number" step="0.01" value={exitPrice}
                      onChange={(e) => setExitPrices({ ...exitPrices, [pos.id]: e.target.value })}
                      className="w-full bg-[#0a0e14] border border-[#1a2332] text-[9px] text-white px-1 py-0.5 font-mono text-right focus:outline-none focus:border-[#00ff41]/50" placeholder="Exit" />
                  </span>
                  <span className="col-span-1 text-right">
                    <button onClick={() => handleCloseTrade(pos.id, pos.symbol)} disabled={isClosing || isClosed || !exitPrice}
                      className={`px-2 py-0.5 text-[8px] font-bold transition-all ${
                        isClosed ? "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20" : "bg-[#ff3355]/10 text-[#ff3355] border border-[#ff3355]/20 hover:bg-[#ff3355]/20"
                      } disabled:opacity-30 disabled:cursor-not-allowed`}>
                      {isClosing ? "..." : isClosed ? <Check className="w-2.5 h-2.5 inline" /> : <X className="w-2.5 h-2.5 inline" />}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
