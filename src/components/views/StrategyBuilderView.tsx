// ============================================================================
// WARRIKS AI — Strategy Builder View
// Create, configure, test, and deploy custom trading strategies
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Plus,
  Play,
  Save,
  Trash2,
  Settings,
  Code,
  BarChart3,
  Check,
  X,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Brain,
} from "lucide-react";
import { STRATEGY_LABELS } from "@/engine/types";
import type { StrategyType } from "@/engine/types";

interface StrategyConfig {
  id: string;
  name: string;
  type: StrategyType;
  enabled: boolean;
  params: Record<string, number>;
  description: string;
}

const INITIAL_STRATEGIES: StrategyConfig[] = [
  {
    id: "S1", name: "ICT FVG + OB Confluence", type: "ICT_SMC", enabled: true,
    params: { minConfluenceScore: 80, minFvgSize: 10, maxOrderBlockDistance: 50 },
    description: "Combines Fair Value Gaps with Order Blocks for high-probability entries during killzone sessions.",
  },
  {
    id: "S2", name: "Momentum Breakout Scanner", type: "MOMENTUM", enabled: true,
    params: { rsiThreshold: 65, volumeMultiplier: 1.5, breakoutStrength: 70 },
    description: "Identifies strong directional momentum with volume confirmation for breakout trades.",
  },
  {
    id: "S3", name: "Mean Reversion at Extremes", type: "MEAN_REVERSION", enabled: false,
    params: { rsiOversold: 30, rsiOverbought: 70, bbDeviation: 2.0 },
    description: "Takes counter-trend positions when price reaches extreme deviations from the mean.",
  },
  {
    id: "S4", name: "Liquidity Sweep Trader", type: "BREAKOUT", enabled: true,
    params: { sweepConfirmation: 5, minPoolSize: 3, retracePercent: 50 },
    description: "Trades liquidity sweeps at key levels with confirmation and retracement entry.",
  },
];

export default function StrategyBuilderView() {
  const [strategies, setStrategies] = useState<StrategyConfig[]>(INITIAL_STRATEGIES);
  const [selectedId, setSelectedId] = useState<string>("S1");
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = strategies.find((s) => s.id === selectedId);

  const toggleEnabled = (id: string) => {
    setStrategies(strategies.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const updateParam = (id: string, key: string, value: number) => {
    setStrategies(strategies.map((s) => s.id === id ? { ...s, params: { ...s.params, [key]: value } } : s));
  };

  const addStrategy = () => {
    if (!newName.trim()) return;
    const id = `S${Date.now()}`;
    const typeKeys = Object.keys(STRATEGY_LABELS) as StrategyType[];
    const newS: StrategyConfig = {
      id, name: newName, type: typeKeys[strategies.length % typeKeys.length], enabled: true,
      params: { threshold: 70, multiplier: 1.0 },
      description: "Custom strategy configuration.",
    };
    setStrategies([...strategies, newS]);
    setSelectedId(id);
    setNewName("");
    setEditing(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Strategy Builder</span>
          <span className="text-[10px] text-[#475569]">{strategies.filter((s) => s.enabled).length}/{strategies.length} active</span>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Strategy name..." className="w-36 bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30"
                onKeyDown={(e) => e.key === "Enter" && addStrategy()} />
              <button onClick={addStrategy} className="px-2 py-1 text-[9px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4]">Create</button>
              <button onClick={() => { setEditing(false); setNewName(""); }} className="px-2 py-1 text-[9px] text-[#64748b] hover:text-[#e2e8f0]">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold text-[#06b6d4] border border-[#06b6d4]/20 hover:bg-[#06b6d4]/10 transition-all">
              <Plus className="w-3 h-3" /> New Strategy
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Strategy List */}
        <div className="w-[240px] bg-[#0d1520] border-r border-[#1e2d3d] overflow-y-auto shrink-0">
          {strategies.map((s) => {
            const Icon = s.enabled ? Check : X;
            return (
              <div key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`px-3 py-2.5 border-b border-[#1e2d3d]/50 cursor-pointer transition-all ${
                  selectedId === s.id ? "bg-[#06b6d4]/6 border-l-2 border-l-[#06b6d4]" : "hover:bg-[#111d2e]/50 border-l-2 border-l-transparent"
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold ${selectedId === s.id ? "text-[#06b6d4]" : "text-[#e2e8f0]"}`}>{s.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleEnabled(s.id); }}
                    className={`p-0.5 ${s.enabled ? "text-[#10b981]" : "text-[#475569]"}`}>
                    <Icon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#64748b]">{STRATEGY_LABELS[s.type]}</span>
                  <span className={`status-dot ${s.enabled ? "online" : "offline"}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Config Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <div className="space-y-4">
              {/* Strategy Info */}
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4 h-4 text-[#06b6d4]" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#e2e8f0]">{selected.name}</h3>
                      <span className="text-[9px] text-[#64748b]">{STRATEGY_LABELS[selected.type]} · {selected.enabled ? "Active" : "Disabled"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleEnabled(selected.id)}
                      className={`px-2 py-1 text-[8px] font-semibold transition-all ${
                        selected.enabled ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/20" : "bg-[#111d2e] text-[#475569] border border-[#1e2d3d]"
                      }`}>
                      {selected.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-[#64748b] leading-relaxed">{selected.description}</p>
              </div>

              {/* Parameters */}
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Settings className="w-3 h-3 text-[#f59e0b]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Parameters</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(selected.params).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#64748b] capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-[10px] font-bold trading-mono text-[#06b6d4]">{value}</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={value}
                        onChange={(e) => updateParam(selected.id, key, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#111d2e] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-[#06b6d4]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Preview */}
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <BarChart3 className="w-3 h-3 text-[#10b981]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Quick Performance</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="border border-[#1e2d3d] bg-[#111d2e]/50 p-2.5">
                    <div className="text-[7px] text-[#64748b] uppercase">Win Rate</div>
                    <div className="text-xs font-bold trading-mono text-[#10b981]">68.4%</div>
                  </div>
                  <div className="border border-[#1e2d3d] bg-[#111d2e]/50 p-2.5">
                    <div className="text-[7px] text-[#64748b] uppercase">Profit Factor</div>
                    <div className="text-xs font-bold trading-mono text-[#06b6d4]">2.14</div>
                  </div>
                  <div className="border border-[#1e2d3d] bg-[#111d2e]/50 p-2.5">
                    <div className="text-[7px] text-[#64748b] uppercase">Avg Trades</div>
                    <div className="text-xs font-bold trading-mono text-[#f59e0b]">3.2/day</div>
                  </div>
                  <div className="border border-[#1e2d3d] bg-[#111d2e]/50 p-2.5">
                    <div className="text-[7px] text-[#64748b] uppercase">Sharpe</div>
                    <div className="text-xs font-bold trading-mono text-[#8b5cf6]">1.87</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all">
                  <Play className="w-3 h-3" /> Run Backtest
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-[#64748b] border border-[#1e2d3d] hover:border-[#06b6d4]/30 hover:text-[#e2e8f0] transition-all">
                  <Save className="w-3 h-3" /> Save Config
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-[#64748b] border border-[#1e2d3d] hover:border-[#06b6d4]/30 hover:text-[#e2e8f0] transition-all">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/10 transition-all">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#64748b] text-[10px]">
              Select a strategy to configure
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
