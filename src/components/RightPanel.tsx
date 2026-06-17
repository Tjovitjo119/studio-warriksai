// ============================================================================
// WARRIKS AI — Studio Right Panel
// Clean editorial panels with warm tones and thin borders
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
    <div className={`flex items-center justify-between px-2 py-1.5 border border-[#e0dad0] bg-[#f8f6f2] ${isActive ? (isBuy ? "border-l-[#7a9e7a]" : isSell ? "border-l-[#c46a6a]" : "") : "opacity-60"}`}>
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] font-medium ${isActive ? "text-[#2c2822]" : "text-[#8a8070]"}`}>
          {STRATEGY_LABELS[strategy.type as StrategyType] || strategy.type}
        </span>
        {isActive && (
          <span className={`text-[8px] font-bold ${isBuy ? "text-[#7a9e7a]" : isSell ? "text-[#c46a6a]" : "text-[#8a8070]"}`}>
            {strategy.dir}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-14 h-1.5 bg-[#e0dad0] overflow-hidden">
          <div
            className={`h-full ${isBuy ? "bg-[#7a9e7a]" : isSell ? "bg-[#c46a6a]" : "bg-[#d4cdc2]"}`}
            style={{ width: `${strategy.conf}%` }}
          />
        </div>
        <span className={`text-[9px] font-bold w-5 text-right ${strategy.conf >= 60 ? (isBuy ? "text-[#7a9e7a]" : isSell ? "text-[#c46a6a]" : "text-[#8a8070]") : "text-[#b5ab9c]"}`}>
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
        <span className="text-[9px] text-[#8a8070]">{label}</span>
        <span className="text-[9px] font-bold text-[#2c2822]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#e8e3da] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
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
    <div className="h-full flex flex-col bg-[#fcfaf7] overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#e0dad0] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-semibold transition-all border-b-2 ${
                isActive
                  ? "text-[#2c2822] border-b-[#2c2822] bg-[#f8f6f2]"
                  : "text-[#8a8070] border-b-transparent hover:text-[#2c2822] hover:bg-[#f0ece6]"
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
            {/* AI Signal */}
            <div className="m-2 bg-white border border-[#e0dad0]">
              <div className="px-3 py-2 border-b border-[#e8e3da] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-[#2c2822]" />
                  <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">AI Signal</span>
                </div>
                <span className="text-[8px] text-[#b5ab9c]">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              {hasSignal ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#2c2822]">{mainSignal.symbol}</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border ${
                        isBuy ? "text-[#7a9e7a] bg-[#7a9e7a]/5 border-[#7a9e7a]/20" : "text-[#c46a6a] bg-[#c46a6a]/5 border-[#c46a6a]/20"
                      }`}>
                        {isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {mainSignal.direction}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      mainSignal.confidence >= 85 ? "text-[#7a9e7a]" : mainSignal.confidence >= 75 ? "text-[#c49a6c]" : "text-[#8a8070]"
                    }`}>
                      {mainSignal.confidence}%
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-[#8a8070]">Strategy Confluence</span>
                      <span className="text-[9px] font-bold text-[#2c2822]">{mainSignal.enginesAgreed}/4</span>
                    </div>
                    <div className="h-1.5 bg-[#e8e3da] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mainSignal.confidence}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full"
                        style={{
                          background: mainSignal.confidence >= 85
                            ? "linear-gradient(90deg, #7a9e7a, #6a8e6a)"
                            : mainSignal.confidence >= 75
                            ? "linear-gradient(90deg, #c49a6c, #b5895c)"
                            : "linear-gradient(90deg, #d4cdc2, #b5ab9c)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a8070]">Entry Zone</span>
                      <span className="font-mono text-[#2c2822]">
                        {mainSignal.entryZone.low.toFixed(1)} – {mainSignal.entryZone.high.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a8070]">Stop Loss</span>
                      <span className="font-mono text-[#c46a6a]">{mainSignal.stopLoss.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a8070]">TP1</span>
                      <span className="font-mono text-[#7a9e7a]">{mainSignal.takeProfit.tp1.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a8070]">TP2</span>
                      <span className="font-mono text-[#7a9e7a]">{mainSignal.takeProfit.tp2.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a8070]">TP3</span>
                      <span className="font-mono text-[#7a9e7a]">{mainSignal.takeProfit.tp3.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-t border-[#e8e3da]">
                    <span className="text-[9px] text-[#8a8070]">Risk:Reward</span>
                    <span className={`text-[11px] font-bold ${mainSignal.riskReward >= 2 ? "text-[#7a9e7a]" : "text-[#c49a6c]"}`}>
                      1:{mainSignal.riskReward.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-1 py-0.5 text-[8px] font-mono text-[#7a9e7a] bg-[#7a9e7a]/5 border border-[#7a9e7a]/20">
                      {mainSignal.entryModel}
                    </span>
                    <span className="px-1 py-0.5 text-[8px] font-mono text-[#8a8070] bg-[#f0ece6] border border-[#e0dad0]">
                      {mainSignal.killzone}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <Brain className="w-6 h-6 text-[#b5ab9c] mb-2 opacity-50" />
                  <span className="text-[10px] text-[#8a8070]">No active signals</span>
                  <span className="text-[8px] text-[#b5ab9c] mt-1">Waiting for confluence ≥ 75</span>
                </div>
              )}
            </div>

            {/* Multi-Strategy Panel */}
            <div className="mx-2 mb-2 bg-white border border-[#e0dad0]">
              <div className="px-3 py-2 border-b border-[#e8e3da] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#c49a6c]" />
                  <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">Strategies</span>
                </div>
                {multiStrategy && (
                  <div className="flex items-center gap-1 text-[8px] font-bold text-[#8a8070]">
                    <span>{multiStrategy.buyVotes}▲</span>
                    <span>/</span>
                    <span>{multiStrategy.sellVotes}▼</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                {strategySummary?.strategyBreakdown.map((s, i) => (
                  <StrategyCard key={i} strategy={s} />
                ))}
              </div>
              {multiStrategy && (
                <div className="px-3 py-2 border-t border-[#e8e3da]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8a8070]">Consensus</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${
                        multiStrategy.consensusDirection === "BUY" ? "text-[#7a9e7a]" :
                        multiStrategy.consensusDirection === "SELL" ? "text-[#c46a6a]" : "text-[#8a8070]"
                      }`}>
                        {multiStrategy.consensusDirection === "NEUTRAL" ? "MIXED" : multiStrategy.consensusDirection}
                      </span>
                      <span className={`text-[8px] px-1 py-0.5 border font-semibold ${
                        multiStrategy.agreement === "STRONG" ? "text-[#7a9e7a] border-[#7a9e7a]/30 bg-[#7a9e7a]/5" :
                        multiStrategy.agreement === "MODERATE" ? "text-[#c49a6c] border-[#c49a6c]/30 bg-[#c49a6c]/5" :
                        multiStrategy.agreement === "CONFLICT" ? "text-[#c46a6a] border-[#c46a6a]/30 bg-[#c46a6a]/5" :
                        "text-[#8a8070] border-[#e0dad0]"
                      }`}>
                        {multiStrategy.agreement}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-[8px] text-[#b5ab9c]">
                      Best: {STRATEGY_LABELS[multiStrategy.topStrategy] || multiStrategy.topStrategy}
                      <span className="mx-1">·</span>
                      Avg confidence: {multiStrategy.avgConfidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6-Engine Agreement Matrix */}
            <div className="mx-2 mb-2 bg-white border border-[#e0dad0]">
              <div className="px-3 py-2 border-b border-[#e8e3da] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-[#2c2822]" />
                  <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">6-Engine Matrix</span>
                </div>
                {combinationSummary && (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] px-1 py-0.5 font-bold border ${
                      combinationSummary.tradeable ? "text-[#7a9e7a] border-[#7a9e7a]/30" : "text-[#c46a6a] border-[#c46a6a]/30"
                    }`}>
                      {combinationSummary.agreementLabel}
                    </span>
                  </div>
                )}
              </div>
              {combinationResult && combinationSummary ? (
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[9px] text-[#8a8070]">
                      {combinationSummary.activeEngines}/{combinationSummary.totalEngines} engines active
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-[#2c2822]">{combinationSummary.score}%</span>
                      <span className={`text-[8px] px-1 py-0.5 border font-bold ${
                        combinationSummary.tradeable ? "text-[#7a9e7a] border-[#7a9e7a]/30 bg-[#7a9e7a]/5" : "text-[#c46a6a] border-[#c46a6a]/30 bg-[#c46a6a]/5"
                      }`}>
                        {combinationSummary.tradeable ? "TRADE" : "NO TRADE"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {combinationSummary.engineDetails.map((eng, i) => {
                      const isBuy = eng.dir === "▲";
                      const isSell = eng.dir === "▼";
                      const color = isBuy ? "#7a9e7a" : isSell ? "#c46a6a" : "#8a8070";
                      return (
                        <div key={i} className={`px-2 py-1.5 border border-[#e0dad0] ${eng.signal ? "bg-[#f8f6f2]" : "bg-[#f0ece6] opacity-60"}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[8px] font-medium text-[#2c2822]">{ENGINE_LABELS[eng.type as keyof typeof ENGINE_LABELS] || eng.type}</span>
                            <div className="flex items-center gap-1">
                              {eng.signal && <span className="text-[8px] font-bold" style={{ color }}>{eng.dir}</span>}
                              <span className="text-[8px] font-bold" style={{ color }}>{eng.conf}%</span>
                            </div>
                          </div>
                          <div className="h-1 bg-[#e0dad0] overflow-hidden">
                            <div className="h-full transition-all duration-500" style={{
                              width: `${eng.conf}%`,
                              background: isBuy ? "linear-gradient(90deg, #7a9e7a, #6a8e6a)" : isSell ? "linear-gradient(90deg, #c46a6a, #b55a5a)" : "linear-gradient(90deg, #d4cdc2, #b5ab9c)",
                            }} />
                          </div>
                          <span className="text-[7px] text-[#b5ab9c] leading-tight block truncate mt-0.5">
                            {eng.signal ? (isBuy ? "Bullish" : isSell ? "Bearish" : "Neutral") : "No signal"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {combinationResult.boostersApplied && combinationResult.boostersApplied.length > 0 && (
                    <div className="mt-2 px-2 py-1.5 bg-[#f8f6f2] border border-[#e0dad0]">
                      <span className="text-[7px] text-[#8a8070] uppercase tracking-wider font-semibold">Boosters</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {combinationResult.boostersApplied.filter(b => b.applied).map((b, i) => (
                          <span key={i} className="text-[7px] px-1 py-0.5 bg-[#7a9e7a]/10 text-[#7a9e7a] border border-[#7a9e7a]/20 font-semibold">
                            +{b.points} {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 text-center">
                  <span className="text-[8px] text-[#b5ab9c]">Running 6-engine analysis...</span>
                </div>
              )}
            </div>

            {/* Probability */}
            <div className="mx-2 mb-2 bg-white border border-[#e0dad0]">
              <div className="px-3 py-2 border-b border-[#e8e3da] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-[#c49a6c]" />
                <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">Probability</span>
              </div>
              <div className="p-3 space-y-2">
                <ProbabilityBar label="Bullish Scenario" value={multiStrategy ? Math.round(multiStrategy.buyVotes * 25) : 72} color="#7a9e7a" />
                <ProbabilityBar label="Bearish Scenario" value={multiStrategy ? Math.round(multiStrategy.sellVotes * 25) : 18} color="#c46a6a" />
                <ProbabilityBar label="Avg Confidence" value={multiStrategy?.avgConfidence || 50} color="#c49a6c" />
              </div>
            </div>

            {/* News Feed */}
            <div className="mx-2 mb-2 bg-white border border-[#e0dad0]">
              <div className="px-3 py-2 border-b border-[#e8e3da] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Newspaper className="w-3 h-3 text-[#2c2822]" />
                  <span className="text-[10px] font-semibold text-[#2c2822] uppercase tracking-wider">News</span>
                </div>
                <span className="text-[8px] text-[#b5ab9c]">Live Feed</span>
              </div>
              <div className="divide-y divide-[#e8e3da]">
                {[
                  { title: "FOMC Minutes: Dovish Tone on Rate Cuts", impact: "HIGH", time: "14:30", currency: "USD", type: "FOMC" },
                  { title: "UK CPI Rises to 3.2%, Above Expectations", impact: "HIGH", time: "08:15", currency: "GBP", type: "CPI" },
                  { title: "NFP Report: 228K Jobs Added vs 200K Expected", impact: "HIGH", time: "Yesterday", currency: "USD", type: "NFP" },
                ].map((news, i) => (
                  <div key={i} className="px-3 py-2 hover:bg-[#f8f6f2] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-[9px] text-[#2c2822] leading-tight flex-1">{news.title}</span>
                      <span className={`text-[8px] px-1 py-0.5 border font-semibold tracking-wider ${
                        news.impact === "HIGH" ? "text-[#c46a6a] bg-[#c46a6a]/5 border-[#c46a6a]/20" : "text-[#c49a6c] bg-[#c49a6c]/5 border-[#c49a6c]/20"
                      }`}>{news.impact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-[#b5ab9c]">
                      <span>{news.time}</span>
                      <span className="w-px h-2 bg-[#e0dad0]" />
                      <span>{news.currency}</span>
                      <span className="w-px h-2 bg-[#e0dad0]" />
                      <span className="text-[#8a8070]">{news.type}</span>
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
