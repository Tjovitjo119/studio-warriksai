// ============================================================================
// WARRIKS AI — Performance View
// Full performance analytics with equity curve, drawdown, trade distribution
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PerformanceViewProps {
  stats: {
    winRate: number;
    totalPnl: number;
    avgRR: number;
    profitFactor: number;
    sharpe: number;
    maxDD: number;
    total: number;
    wins: number;
    losses: number;
  };
}

export default function PerformanceView({ stats }: PerformanceViewProps) {
  const [period, setPeriod] = useState<"1W" | "1M" | "3M" | "6M" | "1Y" | "ALL">("1M");

  const monthlyData = [
    { month: "Jan", pnl: 320, trades: 12 },
    { month: "Feb", pnl: -180, trades: 8 },
    { month: "Mar", pnl: 560, trades: 15 },
    { month: "Apr", pnl: 280, trades: 10 },
    { month: "May", pnl: 720, trades: 18 },
    { month: "Jun", pnl: 420, trades: 14 },
  ];

  const bestMonth = Math.max(...monthlyData.map((m) => m.pnl));
  const worstMonth = Math.min(...monthlyData.map((m) => m.pnl));

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Performance Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-[9px] font-medium transition-all ${
                  period === p ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#475569] hover:text-[#e2e8f0]"
                }`}>{p}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-[#1e2d3d]" />
          <button className="flex items-center gap-1 px-2 py-1 text-[9px] text-[#64748b] hover:text-[#e2e8f0]">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-[#10b981]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Total P&L</span>
            </div>
            <span className={`text-xl font-bold trading-mono ${stats.totalPnl >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-[#f59e0b]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Win Rate</span>
            </div>
            <span className="text-xl font-bold trading-mono text-[#f59e0b]">{stats.winRate.toFixed(1)}%</span>
            <div className="text-[8px] text-[#475569] mt-0.5">{stats.wins}W / {stats.losses}L</div>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-[#06b6d4]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Profit Factor</span>
            </div>
            <span className="text-xl font-bold trading-mono text-[#06b6d4]">{stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}</span>
            <div className="text-[8px] text-[#475569] mt-0.5">Avg R:R {stats.avgRR.toFixed(2)}</div>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3 h-3 text-[#8b5cf6]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Sharpe Ratio</span>
            </div>
            <span className={`text-xl font-bold trading-mono ${stats.sharpe >= 1 ? "text-[#10b981]" : stats.sharpe >= 0 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
              {stats.sharpe.toFixed(2)}
            </span>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-[#ef4444]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Max Drawdown</span>
            </div>
            <span className={`text-xl font-bold trading-mono ${stats.maxDD < 10 ? "text-[#10b981]" : stats.maxDD < 20 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
              {stats.maxDD.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="glass-card rounded-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <LineChart className="w-3 h-3 text-[#10b981]" />
            <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Equity Curve</span>
            <span className="text-[8px] text-[#475569] ml-auto">Best: +${bestMonth.toFixed(0)} · Worst: ${worstMonth.toFixed(0)}</span>
          </div>
          <div className="h-32 bg-[#111d2e] border border-[#1e2d3d] p-2 flex items-end gap-px">
            {monthlyData.map((m, i) => {
              const max = Math.max(...monthlyData.map((x) => Math.abs(x.pnl)));
              const h = (Math.abs(m.pnl) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center" title={`${m.month}: ${m.pnl >= 0 ? "+" : ""}$${m.pnl}`}>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                    <div className="w-full" style={{
                      height: `${Math.max(h, 2)}%`,
                      background: m.pnl >= 0 ? "linear-gradient(180deg, #10b981, #059669)" : "linear-gradient(180deg, #ef4444, #dc2626)",
                    }} />
                  </div>
                  <span className="text-[7px] text-[#475569] mt-0.5">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <PieChart className="w-3 h-3 text-[#f59e0b]" />
              <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Trade Distribution</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#111d2e" strokeWidth="15" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="15"
                    strokeDasharray={`${(stats.winRate / 100) * 251.2} ${251.2 - (stats.winRate / 100) * 251.2}`}
                    strokeDashoffset="0" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="15"
                    strokeDasharray={`${((100 - stats.winRate) / 100) * 251.2} ${251.2 - ((100 - stats.winRate) / 100) * 251.2}`}
                    strokeDashoffset={`${-(stats.winRate / 100) * 251.2}`} transform="rotate(-90 50 50)" />
                </svg>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-[#10b981]" />
                  <span className="text-[9px] text-[#64748b]">Wins: {stats.wins} ({stats.winRate.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-[#ef4444]" />
                  <span className="text-[9px] text-[#64748b]">Losses: {stats.losses} ({(100 - stats.winRate).toFixed(0)}%)</span>
                </div>
                <div className="text-[8px] text-[#475569] mt-1">Total: {stats.total} trades</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Calendar className="w-3 h-3 text-[#06b6d4]" />
              <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Monthly Breakdown</span>
            </div>
            <div className="space-y-1.5">
              {monthlyData.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-medium text-[#e2e8f0] w-8">{m.month}</span>
                    <span className={`text-[9px] font-bold ${m.pnl >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {m.pnl >= 0 ? "+" : ""}${m.pnl.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#475569]">{m.trades} trades</span>
                    {m.pnl >= 0 ? <ArrowUp className="w-2.5 h-2.5 text-[#10b981]" /> : <ArrowDown className="w-2.5 h-2.5 text-[#ef4444]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
