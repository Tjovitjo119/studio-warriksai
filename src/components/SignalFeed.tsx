// ============================================================================
// WARRIKS AI — Live AI Signals Feed (Right Panel)
// Displays active trading signals with engine agreement, killzone, and status
// ============================================================================

import { motion } from "framer-motion";
import type { Signal as SignalType } from "@/engine/types";
import { ArrowUp, ArrowDown, Zap, Clock } from "lucide-react";

interface SignalFeedProps {
  signals: SignalType[];
}

function KillzoneTag({ killzone }: { killzone: string }) {
  const isLondon = killzone === "LONDON";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded-none ${
      isLondon ? "killzone-london" : "killzone-newyork"
    }`}>
      {killzone === "LONDON" ? "🇬🇧 LDN" : "🗽 NY"}
    </span>
  );
}

function EngineBadge({ agreed }: { agreed: number }) {
  const colorClass = agreed >= 4 ? "engines-high" : agreed >= 3 ? "engines-med" : "engines-low";
  return (
    <span className={`text-[10px] font-bold ${colorClass}`}>
      {agreed}/4
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    Active: { bg: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30", dot: "bg-[#22c55e] animate-blink" },
    Waiting: { bg: "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/30", dot: "bg-[#eab308]" },
    Invalid: { bg: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30", dot: "bg-[#ef4444]" },
  };
  const c = config[status as keyof typeof config] || config.Waiting;

  return (
    <span className={`text-[10px] px-1.5 py-0.5 border ${c.bg} flex items-center gap-1`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function SignalFeed({ signals }: SignalFeedProps) {
  return (
    <div className="h-full flex flex-col bg-[#0c0e12] neo-border">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border bg-[#111318] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#22c55e]" />
          <span className="text-xs font-bold text-[#b0b8c8] tracking-wider uppercase">SIGNALS</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {signals.length} active
        </span>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto">
        {signals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No active signals
          </div>
        ) : (
          signals.map((signal, idx) => {
            const isBuy = signal.direction === "BUY";
            const entryPrice = signal.entryZone.midpoint;

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`px-3 py-2.5 border-b border-border/50 hover:bg-[#15181e] transition-colors ${
                  signal.status === "Active" && isBuy ? "border-l-2 border-l-[#22c55e]" :
                  signal.status === "Active" && !isBuy ? "border-l-2 border-l-[#ef4444]" : ""
                } ${isBuy ? "glow-green" : "glow-red"}`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{signal.symbol}</span>
                    {isBuy ? (
                      <span className="text-xs font-bold text-[#22c55e] flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3" /> BUY
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#ef4444] flex items-center gap-0.5">
                        <ArrowDown className="w-3 h-3" /> SELL
                      </span>
                    )}
                  </div>
                  <KillzoneTag killzone={signal.killzone} />
                </div>

                {/* Entry zone */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    Zone: {entryPrice.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ⏹ {signal.stopLoss.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                  </span>
                </div>

                {/* TP Levels */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex gap-2">
                    {[signal.takeProfit.tp1, signal.takeProfit.tp2, signal.takeProfit.tp3].map((tp, i) => (
                      <span key={i} className="text-[9px] text-[#22c55e]/70">
                        TP{i + 1}: {tp.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EngineBadge agreed={signal.enginesAgreed} />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      R:R {signal.riskReward.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={signal.status} />
                    <span className={`text-[11px] font-bold ${
                      signal.confidence >= 85 ? "text-[#22c55e]" :
                      signal.confidence >= 75 ? "text-[#eab308]" : "text-muted-foreground"
                    }`}>
                      {signal.confidence}%
                    </span>
                  </div>
                </div>

                {/* Entry model tag */}
                <div className="mt-1.5">
                  <span className="text-[9px] px-1 py-0.5 bg-[#1a1d26] text-[#4a5060] border border-border">
                    {signal.entryModel}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
