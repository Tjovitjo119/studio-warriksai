// ============================================================================
// WARRIKS AI — Multi-Chart View
// Full multi-chart grid with real-time live prices across all timeframes
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Maximize2, Minus, Plus, Crosshair, LayoutGrid, RefreshCw, Timer } from "lucide-react";
import type { Candle } from "@/engine/types";

interface MultiChartViewProps {
  candlesMap: Record<string, Candle[]>;
  activeSymbol: string;
  onSymbolChange: (symbol: string) => void;
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAMES = ["1M", "5M", "15M", "30M", "1H", "4H", "D", "W"];
const SYMBOLS = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"];

function MiniChartCanvas({ candles, symbol, label, color }: { candles: Candle[]; symbol: string; label: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, W, H);

    if (candles.length < 3) {
      ctx.fillStyle = "#475569";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("No data", W / 2, H / 2);
      return;
    }

    const padding = { top: 20, right: 8, bottom: 16, left: 50 };
    const chartW = Math.max(20, W - padding.left - padding.right);
    const chartH = Math.max(20, H - padding.top - padding.bottom);

    const visible = candles.slice(-60);
    const high = Math.max(...visible.map((c) => c.high)) * 1.003;
    const low = Math.min(...visible.map((c) => c.low)) * 0.997;
    const range = high - low || 1;
    const candleW = Math.max(1.5, chartW / visible.length - 0.5);

    const yPrice = (p: number) => padding.top + chartH - ((p - low) / range) * chartH;

    // Grid
    ctx.strokeStyle = "rgba(30, 45, 61, 0.2)";
    ctx.lineWidth = 0.3;
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
      const price = high - (range / 3) * i;
      ctx.fillStyle = "#475569";
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(symbol === "XAUUSD" ? 1 : 2), padding.left - 4, y + 2);
    }

    // SMA
    const period = 8;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 0.5;
    for (let i = period - 1; i < visible.length; i++) {
      const slice = visible.slice(i - period + 1, i + 1);
      const avg = slice.reduce((s, c) => s + c.close, 0) / period;
      const x = padding.left + i * (candleW + 0.5);
      if (i === period - 1) ctx.moveTo(x, yPrice(avg));
      else ctx.lineTo(x, yPrice(avg));
    }
    ctx.stroke();

    // Candles
    visible.forEach((candle, i) => {
      const x = padding.left + i * (candleW + 0.5);
      const isUp = candle.close >= candle.open;
      ctx.strokeStyle = isUp ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x + candleW / 2, yPrice(candle.high)); ctx.lineTo(x + candleW / 2, yPrice(candle.low)); ctx.stroke();
      ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)";
      const bodyTop = yPrice(Math.max(candle.open, candle.close));
      const bodyBottom = yPrice(Math.min(candle.open, candle.close));
      ctx.fillRect(x, bodyTop, candleW, Math.max(1, bodyBottom - bodyTop));
    });

    // Label
    ctx.fillStyle = color || "rgba(6, 182, 212, 0.6)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, padding.left + 3, padding.top + 12);

    // Current price
    const lastP = visible[visible.length - 1].close;
    ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(lastP.toFixed(symbol === "XAUUSD" ? 1 : 2), W - padding.right, padding.top + 12);
  }, [candles, symbol, label, color]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}

export default function MultiChartView({
  candlesMap, activeSymbol, onSymbolChange, selectedTimeframe, onTimeframeChange,
}: MultiChartViewProps) {
  const [layout, setLayout] = useState<"2x2" | "3x3">("2x2");
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const mainCandles = candlesMap[activeSymbol] || [];

  const timeframes = layout === "2x2" ? ["1M", "5M", "15M", "1H"] : ["1M", "5M", "15M", "30M", "1H", "4H", "D", "W", "Multi"];

  const getTfCandles = (tf: string) => {
    if (tf === "Multi") return mainCandles;
    const groupSizes: Record<string, number> = { "1M": 1, "5M": 5, "15M": 15, "30M": 30, "1H": 60, "4H": 240, "D": 1440, "W": 10080 };
    const size = groupSizes[tf] || 1;
    if (size <= 1 || mainCandles.length <= size) return mainCandles;
    const result: Candle[] = [];
    for (let i = 0; i < mainCandles.length; i += size) {
      const group = mainCandles.slice(i, i + size);
      if (!group.length) continue;
      result.push({
        timestamp: group[0].timestamp,
        open: group[0].open,
        close: group[group.length - 1].close,
        high: Math.max(...group.map((c) => c.high)),
        low: Math.min(...group.map((c) => c.low)),
        volume: group.reduce((s, c) => s + c.volume, 0),
      });
    }
    return result;
  };

  const colors = ["#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#6366f1", "#f97316"];

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Multi-Chart</span>
          <span className="text-[10px] text-[#475569]">{layout === "2x2" ? "4 Charts" : "9 Charts"}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframes */}
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button key={tf} onClick={() => onTimeframeChange(tf)}
                className={`px-1.5 py-1 text-[8px] font-medium transition-all ${
                  selectedTimeframe === tf ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#475569] hover:text-[#e2e8f0]"
                }`}>{tf}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-[#1e2d3d]" />
          {/* Symbols */}
          <div className="flex items-center gap-1">
            {SYMBOLS.slice(0, 5).map((sym) => (
              <button key={sym} onClick={() => onSymbolChange(sym)}
                className={`px-1.5 py-1 text-[8px] font-medium transition-all ${
                  activeSymbol === sym ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#475569] hover:text-[#e2e8f0]"
                }`}>{sym}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-[#1e2d3d]" />
          <button onClick={() => setLayout(layout === "2x2" ? "3x3" : "2x2")}
            className={`p-1.5 transition-all ${layout === "3x3" ? "text-[#06b6d4]" : "text-[#475569] hover:text-[#e2e8f0]"}`}
            title="Toggle layout">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className={`flex-1 grid gap-px bg-[#1e2d3d]/30 overflow-hidden ${
        layout === "2x2" ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-3"
      }`}>
        {timeframes.map((tf, i) => (
          <div key={tf} className="relative bg-[#0a0e17] overflow-hidden">
            <MiniChartCanvas
              candles={getTfCandles(tf)}
              symbol={activeSymbol}
              label={tf}
              color={colors[i % colors.length]}
            />
            <div className="absolute bottom-1 left-2 text-[7px] text-[#475569]">
              {getTfCandles(tf).length} candles
            </div>
          </div>
        ))}
      </div>

      {/* Bottom info bar */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-[8px] text-[#475569]">
          <span>{activeSymbol}</span>
          <span className="w-px h-2.5 bg-[#1e2d3d]" />
          {mainCandles.length > 0 && (
            <>
              <span>O: {mainCandles[mainCandles.length - 1].open.toFixed(2)}</span>
              <span>H: {mainCandles[mainCandles.length - 1].high.toFixed(2)}</span>
              <span>L: {mainCandles[mainCandles.length - 1].low.toFixed(2)}</span>
              <span>C: {mainCandles[mainCandles.length - 1].close.toFixed(2)}</span>
            </>
          )}
        </div>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <Timer className="w-2.5 h-2.5" />
          Live — {selectedTimeframe} aggregation
        </span>
      </div>
    </div>
  );
}
