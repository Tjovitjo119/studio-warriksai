// ============================================================================
// WARRIKS AI — N.E.O.N. Trade Execution Panel
// Dark order entry with neon green/red buy/sell buttons
// ============================================================================

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  Activity,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Direction, TradeDecision } from "@/engine/types";

interface TradeExecutionProps {
  activeSymbol: string;
  currentPrice: number;
  decision?: TradeDecision | null;
  onTradeExecuted?: () => void;
}

export default function TradeExecution({ activeSymbol, currentPrice, decision, onTradeExecuted }: TradeExecutionProps) {
  const openTrade = useMutation(api.trades.openTrade);

  const [direction, setDirection] = useState<Direction>("BUY");
  const [entryPrice, setEntryPrice] = useState(currentPrice.toString());
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [quantity, setQuantity] = useState("1.0");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillFromDecision = useCallback(() => {
    if (!decision || decision.status !== "TRADE") return;
    setDirection(decision.direction);
    setEntryPrice(decision.entryZone.midpoint.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
    setStopLoss(decision.stopLoss.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
    setTakeProfit(decision.takeProfit.tp1.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
  }, [decision, activeSymbol]);

  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;
  const qty = parseFloat(quantity) || 0;

  const riskAmount = entry > 0 && sl > 0 ? Math.abs(entry - sl) * qty : 0;
  const rewardAmount = entry > 0 && tp > 0 ? Math.abs(tp - entry) * qty : 0;
  const riskReward = riskAmount > 0 ? Math.round((rewardAmount / riskAmount) * 10) / 10 : 0;

  const handleExecute = async () => {
    if (!entry || !sl || !tp || !qty) {
      setError("Fill in all required fields");
      return;
    }
    if (direction === "BUY" && sl >= entry) { setError("Stop loss must be below entry for BUY"); return; }
    if (direction === "SELL" && sl <= entry) { setError("Stop loss must be above entry for SELL"); return; }

    setIsExecuting(true);
    setError(null);
    try {
      await openTrade({
        symbol: activeSymbol,
        direction: direction as "BUY" | "SELL",
        entryPrice: entry,
        stopLoss: sl,
        takeProfit: tp,
        quantity: qty,
        riskReward,
        entryModel: decision?.orderFlowModel,
        killzone: undefined,
        confluenceScore: decision?.confluenceScore,
      });
      setExecuted(true);
      setTimeout(() => setExecuted(false), 2000);
      onTradeExecuted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const quickSizes = [0.1, 0.25, 0.5, 1.0, 2.0];

  return (
    <div className="h-full flex flex-col bg-[#0a0e14] overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#1a2332] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#00d4ff]" />
          <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Order Entry</span>
        </div>
        <span className="text-[9px] text-[#556677]">{activeSymbol}</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setDirection("BUY")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-all border ${
              direction === "BUY"
                ? "bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]"
                : "bg-[#0a0e14] border-[#1a2332] text-[#556677] hover:text-white"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" /> BUY
          </button>
          <button
            onClick={() => setDirection("SELL")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-all border ${
              direction === "SELL"
                ? "bg-[#ff3355]/10 border-[#ff3355]/30 text-[#ff3355]"
                : "bg-[#0a0e14] border-[#1a2332] text-[#556677] hover:text-white"
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" /> SELL
          </button>
        </div>

        {decision?.status === "TRADE" && (
          <button onClick={fillFromDecision}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-medium text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-all">
            <Zap className="w-3 h-3" />
            Fill from AI Signal ({decision.direction} @ {decision.entryZone.midpoint.toFixed(1)})
          </button>
        )}

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#556677]">
            <span>Entry Price</span>
            <span className="text-[#445566]">Current: {currentPrice.toFixed(activeSymbol === "XAUUSD" ? 1 : 2)}</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#556677]" />
            <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-[#0a0e14] border border-[#1a2332] text-[11px] text-white px-6 py-1.5 font-mono focus:outline-none focus:border-[#00ff41]/50 transition-colors" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#556677]">
            <span>Stop Loss</span>
            <span className="text-[#ff3355]">Risk</span>
          </label>
          <div className="relative">
            <Target className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#ff3355]/60" />
            <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-[#0a0e14] border border-[#1a2332] text-[11px] text-[#ff3355] px-6 py-1.5 font-mono focus:outline-none focus:border-[#00ff41]/50 transition-colors" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#556677]">
            <span>Take Profit (TP1)</span>
            <span className="text-[#00ff41]">Reward</span>
          </label>
          <div className="relative">
            <Target className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#00ff41]/60" />
            <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-[#0a0e14] border border-[#1a2332] text-[11px] text-[#00ff41] px-6 py-1.5 font-mono focus:outline-none focus:border-[#00ff41]/50 transition-colors" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#556677]">
            <span>Quantity</span>
          </label>
          <div className="relative">
            <Activity className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#556677]" />
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#0a0e14] border border-[#1a2332] text-[11px] text-white px-6 py-1.5 font-mono focus:outline-none focus:border-[#00ff41]/50 transition-colors" />
          </div>
          <div className="flex gap-0.5 mt-1">
            {quickSizes.map((size) => (
              <button key={size} onClick={() => setQuantity(size.toString())}
                className={`flex-1 py-1 text-[8px] font-medium transition-all border ${
                  parseFloat(quantity) === size
                    ? "bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]"
                    : "bg-[#0a0e14] border-[#1a2332] text-[#556677] hover:text-white"
                }`}>{size}</button>
            ))}
          </div>
        </div>

        {entry > 0 && sl > 0 && (
          <div className="border border-[#1a2332] bg-[#0a0e14] p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#556677]">Risk Amount</span>
              <span className="text-[10px] font-bold text-[#ff3355]">${riskAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#556677]">Reward Amount</span>
              <span className="text-[10px] font-bold text-[#00ff41]">${rewardAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#1a2332] pt-1">
              <span className="text-[9px] text-[#556677]">Risk:Reward</span>
              <span className={`text-[11px] font-bold ${riskReward >= 2 ? "text-[#00ff41]" : riskReward >= 1 ? "text-[#ffaa00]" : "text-[#ff3355]"}`}>
                1:{riskReward.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <button onClick={handleExecute} disabled={isExecuting || executed}
          className={`w-full py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            executed ? "bg-[#00ff41] text-black" :
            direction === "BUY" ? "bg-[#00ff41] text-black hover:bg-[#00cc33] hover:shadow-[0_0_12px_rgba(0,255,65,0.2)]" :
            "bg-[#ff3355] text-white hover:bg-[#cc1133] hover:shadow-[0_0_12px_rgba(255,51,85,0.2)]"
          } disabled:opacity-50`}>
          {isExecuting ? (
            <><div className="w-3 h-3 border border-current/30 border-t-transparent rounded-full animate-spin" /> Executing...</>
          ) : executed ? (
            <><Check className="w-3.5 h-3.5" /> Position Opened</>
          ) : (
            <><Zap className="w-3.5 h-3.5" /> {direction} {activeSymbol}</>
          )}
        </button>

        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-[9px] text-[#ff3355] bg-[#ff3355]/10 border border-[#ff3355]/20 px-2 py-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
