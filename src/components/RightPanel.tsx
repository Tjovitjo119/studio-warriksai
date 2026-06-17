// ============================================================================
// WARRIKS AI — N.E.O.N. Right Panel
// Dark surfaces, neon green/cyan accents, glowing indicators
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Brain,
  Layers,
  BarChart3,
  BookOpen,
  DollarSign,
  Newspaper,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { Signal, MultiStrategyOutput, StrategyType, TradeDecision, CombinationResult } from "@/engine/types";
import { STRATEGY_LABELS, ENGINE_LABELS } from "@/engine/types";
import TradeExecution from "./TradeExecution";
import TradeJournal from "./TradeJournal";

type RightPanelTab = "signals" | "orders" | "journal";

interface RightPanelProps {
  signals: Signal[];
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
  activeSymbol?: string;
  currentPrice?: number;
  decision?: TradeDecision | null;
  onTradeExecuted?: () => void;
}

const TABS: { id: RightPanelTab; label: string; icon: typeof Brain }[] = [
  { id: "signals", label: "Signals", icon: Brain },
  { id: "orders", label: "Orders", icon: DollarSign },
  { id: "journal", label: "Journal", icon: BookOpen },
];

function StrategyCard({ strategy }: { strategy: { type: string; dir: string; conf: number } }) {
  const isBuy = strategy.dir === "▲";
  const isSell = strategy.dir === "▼";
  const isActive = strategy.conf >= 60;
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 border border-[#1a2332] bg-[#0a0e14] ${isActive ? (isBuy ? "border-l-[#00ff41]" : isSell ? "border-l-[#ff3355]" : "") : "opacity-50"}`}>
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] font-medium ${isActive ? "text-white" : "text-[#556677]"}`}>
          {STRATEGY_LABELS[strategy.type as StrategyType] || strategy.type}
        </span>
        {isActive && (
          <span className={`text-[8px] font-bold ${isBuy ? "text-[#00ff41]" : isSell ? "text-[#ff3355]" : "text-[#556677]"}`}>
            {strategy.dir}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-14 h-1.5 bg-[#1a2332] overflow-hidden">
          <div
            className={`h-full ${isBuy ? "bg-[#00ff41]" : isSell ? "bg-[#ff3355]" : "bg-[#556677]"}`}
            style={{ width: `${strategy.conf}%` }}
          />
        </div>
        <span className={`text-[9px] font-bold w-5 text-right ${strategy.conf >= 60 ? (isBuy ? "text-[#00ff41]" : isSell ? "text-[#ff3355]" : "text-[#556677]") : "text-[#445566]"}`}>
          {strategy.conf}
        </span>
      </div>
    </div>
  );
}

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#556677]">{label}</span>
        <span className="text-[9px] font-bold text-white">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#1a2332] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${color}44, ${color})` }}
        />
      </div>
    </div>
  );
}

export default function RightPanel({
  signals,
  multiStrategy,
  strategySummary,
  combinationResult,
  combinationSummary,
  activeSymbol = "NAS100",
  currentPrice = 0,
  decision = null,
  onTradeExecuted,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>("signals");

  const mainSignal = signals[0];
  const hasSignal = !!mainSignal && mainSignal.status === "Active";
  const isBuy = mainSignal?.direction === "BUY";

  return (
    <div className="h-full flex flex-col bg-[#0a0e14] overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#1a2332] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-semibold transition-all border-b-2 ${
                isActive
                  ? "text-[#00ff41] border-b-[#00ff41] bg-[#00ff41]/5"
                  : "text-[#556677] border-b-transparent hover:text-white hover:bg-[#00ff41]/[0.03]"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "orders" ? (
          <TradeExecution
            activeSymbol={activeSymbol}
            currentPrice={currentPrice}
            decision={decision}
            onTradeExecuted={onTradeExecuted}
          />
        ) : activeTab === "journal" ? (
          <TradeJournal activeSymbol={activeSymbol} />
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Trade Decision — Precise NO_TRADE reasons */}
            {decision && (
              <div className="m-2 bg-[#05080e] border border-[#1a2332]">
                <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {decision.status === "TRADE" ? (
                      <CheckCircle className="w-3 h-3 text-[#00ff41]" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[#ff3355]" />
                    )}
                    <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                      {decision.status === "TRADE" ? `${decision.direction} SIGNAL` : "NO TRADE"}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold ${decision.status === "TRADE" ? "text-[#00ff41]" : "text-[#ff3355]"}`}>
                    {decision.confluenceScore}/100
                  </span>
                </div>
                <div className="p-2.5">
                  {decision.status === "TRADE" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#556677]">Direction</span>
                        <span className={`text-[10px] font-bold ${decision.direction === "BUY" ? "text-[#00ff41]" : "text-[#ff3355]"}`}>{decision.direction}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#556677]">Bias / Structure</span>
                        <span className="text-[9px] font-mono text-white">{decision.marketBias} {decision.structureState}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#556677]">Entry Model</span>
                        <span className="text-[9px] font-mono text-[#00d4ff]">{decision.orderFlowModel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#556677]">Liq Sweep</span>
                        <span className={`text-[9px] font-bold ${decision.liquiditySweep ? "text-[#00ff41]" : "text-[#445566]"}`}>{decision.liquiditySweep ? "✓" : "✗"}</span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-[#1a2332]">
                        <div className="text-[8px] text-[#556677] leading-relaxed">{decision.reason}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 px-1 py-1 bg-[#ff3355]/10 border border-[#ff3355]/20">
                        <AlertTriangle className="w-3 h-3 text-[#ff3355] shrink-0" />
                        <span className="text-[8px] text-[#ff3355] font-semibold">Why no trade:</span>
                      </div>
                      <div className="px-1.5 space-y-1">
                        {decision.reason.split(", ").filter(r => r.startsWith("Insufficient") || !r.startsWith("Insufficient")).map((reason, i) => {
                          const isHeader = reason.startsWith("Insufficient");
                          if (isHeader) {
                            const detail = decision.reason.replace("Insufficient confluence: ", "").split(", ")
                            return (
                              <div key={i} className="space-y-1">
                                <span className="text-[8px] text-[#556677] font-semibold block mb-1">Missing conditions:</span>
                                {detail.map((r, j) => (
                                  <div key={j} className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[#ff3355]" />
                                    <span className="text-[8px] text-[#8899aa]">{r.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#ff3355]" />
                              <span className="text-[8px] text-[#8899aa]">{reason.trim()}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-2 px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                        <span className="text-[7px] text-[#556677] uppercase tracking-wider font-semibold">Market State</span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                          <span className="text-[7px] text-[#8899aa]">Bias: {decision.marketBias}</span>
                          <span className="text-[7px] text-[#8899aa]">Structure: {decision.structureState}</span>
                          <span className="text-[7px] text-[#8899aa]">Liq Sweep: {decision.liquiditySweep ? "✓" : "✗"}</span>
                          <span className="text-[7px] text-[#8899aa]">Entry: {decision.orderFlowModel}</span>
                          <span className="text-[7px] text-[#8899aa]">Quality: {decision.tradeQuality}</span>
                          <span className="text-[7px] text-[#8899aa]">Conf: {decision.confluenceScore}/100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Signal */}
            <div className="m-2 bg-[#05080e] border border-[#1a2332]">
              <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-[#00ff41]" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Top Signal</span>
                </div>
                <span className="text-[8px] text-[#556677]">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              {hasSignal ? (
                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{mainSignal.symbol}</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border ${
                        isBuy ? "text-[#00ff41] bg-[#00ff41]/10 border-[#00ff41]/30" : "text-[#ff3355] bg-[#ff3355]/10 border-[#ff3355]/30"
                      }`}>
                        {isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {mainSignal.direction}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      mainSignal.confidence >= 85 ? "text-[#00ff41] text-glow-green" : mainSignal.confidence >= 75 ? "text-[#00d4ff]" : "text-[#556677]"
                    }`}>
                      {mainSignal.confidence}%
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-[#556677]">Strategy Confluence</span>
                      <span className="text-[9px] font-bold text-white">{mainSignal.enginesAgreed}/4</span>
                    </div>
                    <div className="h-1.5 bg-[#1a2332] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mainSignal.confidence}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full"
                        style={{
                          background: mainSignal.confidence >= 85
                            ? "linear-gradient(90deg, #00ff41, #00cc33)"
                            : mainSignal.confidence >= 75
                            ? "linear-gradient(90deg, #00d4ff, #1a6bff)"
                            : "linear-gradient(90deg, #556677, #445566)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#556677]">Entry Zone</span>
                      <span className="font-mono text-white">
                        {mainSignal.entryZone.low.toFixed(mainSignal.symbol === "XAUUSD" ? 1 : 2)} – {mainSignal.entryZone.high.toFixed(mainSignal.symbol === "XAUUSD" ? 1 : 2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#556677]">Stop Loss</span>
                      <span className="font-mono text-[#ff3355]">{mainSignal.stopLoss.toFixed(mainSignal.symbol === "XAUUSD" ? 1 : 2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#556677]">TP1</span>
                      <span className="font-mono text-[#00ff41]">{mainSignal.takeProfit.tp1.toFixed(mainSignal.symbol === "XAUUSD" ? 1 : 2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-[#1a2332]">
                    <span className="text-[9px] text-[#556677]">Risk:Reward</span>
                    <span className={`text-[11px] font-bold ${mainSignal.riskReward >= 2 ? "text-[#00ff41]" : "text-[#ffaa00]"}`}>
                      1:{mainSignal.riskReward.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    <span className="px-1 py-0.5 text-[8px] font-mono text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/20">
                      {mainSignal.entryModel}
                    </span>
                    <span className="px-1 py-0.5 text-[8px] font-mono text-[#556677] bg-[#0a0e14] border border-[#1a2332]">
                      {mainSignal.killzone}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <Brain className="w-5 h-5 text-[#445566] mb-1.5 opacity-50" />
                  <span className="text-[10px] text-[#556677]">No active signals</span>
                  {decision && (
                    <span className="text-[8px] text-[#445566] mt-0.5">Score: {decision.confluenceScore}/100</span>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Strategy Panel */}
            <div className="mx-2 mb-2 bg-[#05080e] border border-[#1a2332]">
              <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#00d4ff]" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Strategies</span>
                </div>
                {multiStrategy && (
                  <div className="flex items-center gap-1 text-[8px] font-bold text-[#556677]">
                    <span className="text-[#00ff41]">{multiStrategy.buyVotes}▲</span>
                    <span>/</span>
                    <span className="text-[#ff3355]">{multiStrategy.sellVotes}▼</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                {strategySummary?.strategyBreakdown.map((s, i) => (
                  <StrategyCard key={i} strategy={s} />
                ))}
              </div>
              {multiStrategy && (
                <div className="px-3 py-2 border-t border-[#1a2332]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#556677]">Consensus</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${
                        multiStrategy.consensusDirection === "BUY" ? "text-[#00ff41]" :
                        multiStrategy.consensusDirection === "SELL" ? "text-[#ff3355]" : "text-[#556677]"
                      }`}>
                        {multiStrategy.consensusDirection === "NEUTRAL" ? "MIXED" : multiStrategy.consensusDirection}
                      </span>
                      <span className={`text-[8px] px-1 py-0.5 border font-semibold ${
                        multiStrategy.agreement === "STRONG" ? "text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10" :
                        multiStrategy.agreement === "MODERATE" ? "text-[#ffaa00] border-[#ffaa00]/30 bg-[#ffaa00]/10" :
                        multiStrategy.agreement === "CONFLICT" ? "text-[#ff3355] border-[#ff3355]/30 bg-[#ff3355]/10" :
                        "text-[#556677] border-[#1a2332]"
                      }`}>
                        {multiStrategy.agreement}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-[8px] text-[#445566]">
                      Best: {STRATEGY_LABELS[multiStrategy.topStrategy] || multiStrategy.topStrategy}
                      <span className="mx-1">·</span>
                      Avg confidence: {multiStrategy.avgConfidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6-Engine Agreement Matrix */}
            <div className="mx-2 mb-2 bg-[#05080e] border border-[#1a2332]">
              <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">6-Engine Matrix</span>
                </div>
                {combinationSummary && (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] px-1 py-0.5 font-bold border ${
                      combinationSummary.tradeable ? "text-[#00ff41] border-[#00ff41]/30" : "text-[#ff3355] border-[#ff3355]/30"
                    }`}>
                      {combinationSummary.agreementLabel}
                    </span>
                  </div>
                )}
              </div>
              {combinationResult && combinationSummary ? (
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[9px] text-[#556677]">
                      {combinationSummary.activeEngines}/{combinationSummary.totalEngines} engines active
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-white">{combinationSummary.score}%</span>
                      <span className={`text-[8px] px-1 py-0.5 border font-bold ${
                        combinationSummary.tradeable ? "text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10" : "text-[#ff3355] border-[#ff3355]/30 bg-[#ff3355]/10"
                      }`}>
                        {combinationSummary.tradeable ? "TRADE" : "NO TRADE"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {combinationSummary.engineDetails.map((eng, i) => {
                      const isBuy = eng.dir === "▲";
                      const isSell = eng.dir === "▼";
                      const color = isBuy ? "#00ff41" : isSell ? "#ff3355" : "#556677";
                      return (
                        <div key={i} className={`px-2 py-1.5 border border-[#1a2332] ${eng.signal ? "bg-[#0a0e14]" : "bg-[#05080e] opacity-50"}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[8px] font-medium text-white">{ENGINE_LABELS[eng.type as keyof typeof ENGINE_LABELS] || eng.type}</span>
                            <div className="flex items-center gap-1">
                              {eng.signal && <span className="text-[8px] font-bold" style={{ color }}>{eng.dir}</span>}
                              <span className="text-[8px] font-bold" style={{ color }}>{eng.conf}%</span>
                            </div>
                          </div>
                          <div className="h-1 bg-[#1a2332] overflow-hidden">
                            <div className="h-full transition-all duration-500" style={{
                              width: `${eng.conf}%`,
                              background: isBuy ? "linear-gradient(90deg, #00ff41, #00cc33)" : isSell ? "linear-gradient(90deg, #ff3355, #cc1133)" : "linear-gradient(90deg, #556677, #445566)",
                            }} />
                          </div>
                          <span className="text-[7px] text-[#445566] leading-tight block truncate mt-0.5">
                            {eng.signal ? (isBuy ? "Bullish" : isSell ? "Bearish" : "Neutral") : "No signal"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {combinationResult.boostersApplied && combinationResult.boostersApplied.length > 0 && (
                    <div className="mt-2 px-2 py-1.5 bg-[#0a0e14] border border-[#1a2332]">
                      <span className="text-[7px] text-[#556677] uppercase tracking-wider font-semibold">Boosters</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {combinationResult.boostersApplied.filter(b => b.applied).map((b, i) => (
                          <span key={i} className="text-[7px] px-1 py-0.5 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20 font-semibold">
                            +{b.points} {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 text-center">
                  <span className="text-[8px] text-[#445566]">Running 6-engine analysis...</span>
                </div>
              )}
            </div>

            {/* Probability */}
            <div className="mx-2 mb-2 bg-[#05080e] border border-[#1a2332]">
              <div className="px-3 py-2 border-b border-[#1a2332] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-[#00d4ff]" />
                <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Probability</span>
              </div>
              <div className="p-3 space-y-2">
                <ProbabilityBar label="Bullish Scenario" value={multiStrategy ? Math.round(multiStrategy.buyVotes * 25) : 72} color="#00ff41" />
                <ProbabilityBar label="Bearish Scenario" value={multiStrategy ? Math.round(multiStrategy.sellVotes * 25) : 18} color="#ff3355" />
                <ProbabilityBar label="Avg Confidence" value={multiStrategy?.avgConfidence || 50} color="#00d4ff" />
              </div>
            </div>

            {/* News Feed */}
            <div className="mx-2 mb-2 bg-[#05080e] border border-[#1a2332]">
              <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Newspaper className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">News</span>
                </div>
                <span className="text-[8px] text-[#556677]">Live Feed</span>
              </div>
              <div className="divide-y divide-[#1a2332]">
                {[
                  { title: "FOMC Minutes: Dovish Tone on Rate Cuts", impact: "HIGH", time: "14:30", currency: "USD", type: "FOMC" },
                  { title: "UK CPI Rises to 3.2%, Above Expectations", impact: "HIGH", time: "08:15", currency: "GBP", type: "CPI" },
                  { title: "NFP Report: 228K Jobs Added vs 200K Expected", impact: "HIGH", time: "Yesterday", currency: "USD", type: "NFP" },
                ].map((news, i) => (
                  <div key={i} className="px-3 py-2 hover:bg-[#00ff41]/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-[9px] text-white leading-tight flex-1">{news.title}</span>
                      <span className={`text-[8px] px-1 py-0.5 border font-semibold tracking-wider ${
                        news.impact === "HIGH" ? "text-[#ff3355] bg-[#ff3355]/10 border-[#ff3355]/20" : "text-[#ffaa00] bg-[#ffaa00]/10 border-[#ffaa00]/20"
                      }`}>{news.impact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-[#445566]">
                      <span>{news.time}</span>
                      <span className="w-px h-2 bg-[#1a2332]" />
                      <span>{news.currency}</span>
                      <span className="w-px h-2 bg-[#1a2332]" />
                      <span className="text-[#556677]">{news.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
