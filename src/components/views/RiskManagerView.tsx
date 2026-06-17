// ============================================================================
// WARRIKS AI — Risk Manager View
// Position sizing, exposure tracking, risk limits, stress testing
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sliders,
  BarChart3,
  Target,
  Percent,
  Plus,
  Minus,
  Gauge,
} from "lucide-react";
import type { MarketData } from "@/engine/types";

interface RiskManagerViewProps {
  markets: MarketData[];
}

export default function RiskManagerView({ markets }: RiskManagerViewProps) {
  const [balance, setBalance] = useState(12847.50);
  const [riskPercent, setRiskPercent] = useState(1.5);
  const [maxPositions, setMaxPositions] = useState(5);
  const [dailyLossLimit, setDailyLossLimit] = useState(500);

  const riskAmount = balance * (riskPercent / 100);
  const maxExposure = Math.min(markets.length, maxPositions) * riskAmount;
  const exposureRatio = (maxExposure / balance) * 100;

  const accountHealth = exposureRatio < 10 ? "Good" : exposureRatio < 20 ? "Moderate" : "High Risk";
  const healthColor = exposureRatio < 10 ? "#10b981" : exposureRatio < 20 ? "#f59e0b" : "#ef4444";

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Risk Manager</span>
          <span className="text-[9px] px-1.5 py-0.5" style={{ color: healthColor, background: `${healthColor}15`, border: `1px solid ${healthColor}30` }}>
            {accountHealth}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Account Overview */}
        <div className="grid grid-cols-4 gap-3">
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3 h-3 text-[#06b6d4]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Account Balance</span>
            </div>
            <div className="text-xl font-bold trading-mono text-[#e2e8f0]">${balance.toFixed(2)}</div>
            <div className="text-[8px] text-[#475569] mt-0.5">Available: ${(balance - maxExposure).toFixed(2)}</div>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3 h-3 text-[#10b981]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Risk Per Trade</span>
            </div>
            <div className="text-xl font-bold trading-mono text-[#10b981]">${riskAmount.toFixed(2)}</div>
            <div className="text-[8px] text-[#475569] mt-0.5">{riskPercent}% of balance</div>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BarChart3 className="w-3 h-3 text-[#f59e0b]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Max Exposure</span>
            </div>
            <div className="text-xl font-bold trading-mono text-[#f59e0b]">${maxExposure.toFixed(2)}</div>
            <div className="text-[8px] text-[#475569] mt-0.5">{exposureRatio.toFixed(1)}% of account</div>
          </div>
          <div className="glass-card rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Daily Loss Limit</span>
            </div>
            <div className="text-xl font-bold trading-mono text-[#ef4444]">${dailyLossLimit.toFixed(2)}</div>
            <div className="text-[8px] text-[#475569] mt-0.5">{(dailyLossLimit / balance * 100).toFixed(1)}% of account</div>
          </div>
        </div>

        {/* Risk Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Position Sizing */}
          <div className="glass-card rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-4">
              <Sliders className="w-3 h-3 text-[#06b6d4]" />
              <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Position Sizing</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#64748b]">Risk Percentage</span>
                  <span className="text-[10px] font-bold trading-mono text-[#06b6d4]">{riskPercent}%</span>
                </div>
                <input type="range" min="0.5" max="5" step="0.1" value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#111d2e] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-[#06b6d4]"
                />
                <div className="flex justify-between text-[7px] text-[#475569] mt-0.5">
                  <span>0.5%</span><span>2.5%</span><span>5.0%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#64748b]">Max Open Positions</span>
                  <span className="text-[10px] font-bold trading-mono text-[#f59e0b]">{maxPositions}</span>
                </div>
                <input type="range" min="1" max="20" step="1" value={maxPositions}
                  onChange={(e) => setMaxPositions(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#111d2e] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-[#f59e0b]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#64748b]">Daily Loss Limit</span>
                  <span className="text-[10px] font-bold trading-mono text-[#ef4444]">${dailyLossLimit}</span>
                </div>
                <input type="range" min="100" max="3000" step="50" value={dailyLossLimit}
                  onChange={(e) => setDailyLossLimit(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#111d2e] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-[#ef4444]"
                />
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="glass-card rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-4">
              <Gauge className="w-3 h-3 text-[#10b981]" />
              <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Risk Metrics</span>
            </div>

            <div className="space-y-2">
              {[
                { label: "Portfolio Exposure", value: `${exposureRatio.toFixed(1)}%`, color: exposureRatio < 10 ? "#10b981" : exposureRatio < 20 ? "#f59e0b" : "#ef4444", bar: Math.min(exposureRatio, 100) },
                { label: "Risk Per Trade", value: `$${riskAmount.toFixed(2)}`, color: "#06b6d4", bar: (riskPercent / 5) * 100 },
                { label: "Max Drawdown Limit", value: "15%", color: "#f59e0b", bar: 60 },
                { label: "Position Size", value: `${Math.round(riskAmount / 50)} units`, color: "#e2e8f0", bar: 40 },
                { label: "Leverage Used", value: "1:1", color: "#10b981", bar: 10 },
                { label: "Margin Used", value: `${exposureRatio.toFixed(1)}%`, color: exposureRatio < 15 ? "#10b981" : "#f59e0b", bar: Math.min(exposureRatio, 100) },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
                  <span className="text-[9px] text-[#64748b]">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-[#0a0e17] overflow-hidden">
                      <div className="h-full" style={{ width: `${m.bar}%`, background: m.color }} />
                    </div>
                    <span className="text-[10px] font-bold trading-mono" style={{ color: m.color }}>{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stress Test & Limits */}
        <div className="glass-card rounded-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
            <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Stress Test Scenarios</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { scenario: "Market Crash (-10%)", impact: `-$${(balance * 0.1).toFixed(0)}`, severity: "High", color: "#ef4444" },
              { scenario: "Moderate Drawdown (-5%)", impact: `-$${(balance * 0.05).toFixed(0)}`, severity: "Medium", color: "#f59e0b" },
              { scenario: "Normal Volatility (-2%)", impact: `-$${(balance * 0.02).toFixed(0)}`, severity: "Low", color: "#10b981" },
            ].map((s, i) => (
              <div key={i} className="border border-[#1e2d3d] bg-[#111d2e]/50 p-3">
                <div className="text-[9px] font-medium text-[#e2e8f0] mb-2">{s.scenario}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold trading-mono" style={{ color: s.color }}>{s.impact}</span>
                  <span className="text-[8px] px-1 py-0.5" style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}>{s.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
