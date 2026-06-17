// ============================================================================
// WARRIKS AI — Studio Center Chart
// Clean canvas chart with warm tones, thin lines, editorial minimalism
// ============================================================================

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type { Candle, PriceZone, TradeDecision } from "@/engine/types";
import { BarChart3, Maximize2, Minus, Plus, Crosshair } from "lucide-react";

interface ChartOverlayData {
  candles: Candle[];
  fvgZones: PriceZone[];
  orderBlocks: PriceZone[];
  liquidityHighs: number[];
  liquidityLows: number[];
  sweepPoints: { price: number; direction: "BUY" | "SELL" }[];
  activeSymbol: string;
  currentPrice: number;
  decision: TradeDecision | null;
}

interface CenterChartProps {
  data: ChartOverlayData;
  onSymbolChange?: (symbol: string) => void;
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAMES = ["1M", "5M", "15M", "30M", "1H", "4H", "D", "W"];
const SYMBOLS = ["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"];

export default function CenterChart({
  data,
  onSymbolChange,
  selectedTimeframe,
  onTimeframeChange,
}: CenterChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);

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

    const { candles } = data;
    if (candles.length < 2) {
      ctx.fillStyle = "#b5ab9c";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for data...", W / 2, H / 2);
      return;
    }

    // Layout
    const padding = { top: 28, right: 16, bottom: 28, left: 52 };
    const rsiH = showRSI ? 50 : 0;
    const macdH = showMACD ? 50 : 0;
    const bottomIndicatorsH = 6 + rsiH + macdH;
    const chartH = H - padding.top - padding.bottom - bottomIndicatorsH;
    const volumeH = 28;
    const chartW = W - padding.left - padding.right;

    const visibleCandles = candles.slice(-80);
    const high = Math.max(...visibleCandles.map((c) => c.high)) * 1.0015;
    const low = Math.min(...visibleCandles.map((c) => c.low)) * 0.9985;
    const range = high - low || 1;

    const candleW = Math.max(2.5, chartW / visibleCandles.length - 0.8);

    const yPrice = (p: number) => padding.top + chartH - ((p - low) / range) * chartH;

    // Background
    ctx.fillStyle = "#fcfaf7";
    ctx.fillRect(0, 0, W, H);

    // Grid lines - subtle
    ctx.strokeStyle = "rgba(224, 218, 208, 0.5)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (chartH / 8) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      const price = high - (range / 8) * i;
      ctx.fillStyle = "#b5ab9c";
      ctx.font = "9px 'SF Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        price.toFixed(data.activeSymbol === "XAUUSD" ? 1 : 2),
        padding.left - 6,
        y + 3,
      );
    }

    // FVG Zones
    for (const zone of data.fvgZones) {
      const y1 = yPrice(zone.high);
      const y2 = yPrice(zone.low);
      ctx.fillStyle = "rgba(122, 158, 122, 0.06)";
      ctx.fillRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
      ctx.strokeStyle = "rgba(122, 158, 122, 0.2)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(122, 158, 122, 0.4)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("FVG", padding.left + 4, Math.min(y1, y2) - 2);
    }

    // Order Blocks
    for (const zone of data.orderBlocks) {
      const y1 = yPrice(zone.high);
      const y2 = yPrice(zone.low);
      ctx.fillStyle = "rgba(196, 106, 106, 0.05)";
      ctx.fillRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
      ctx.fillStyle = "rgba(196, 106, 106, 0.4)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("OB", padding.left + 4, Math.max(y1, y2) + 10);
    }

    // Premium/Discount zones
    const midpoint = (high + low) / 2;
    ctx.fillStyle = "rgba(196, 154, 108, 0.015)";
    ctx.fillRect(padding.left, padding.top, chartW, chartH / 2);
    ctx.fillStyle = "rgba(122, 158, 122, 0.015)";
    ctx.fillRect(padding.left, padding.top + chartH / 2, chartW, chartH / 2);

    // Liquidity highs
    for (const lh of data.liquidityHighs) {
      const y = yPrice(lh);
      ctx.strokeStyle = "rgba(196, 106, 106, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(196, 106, 106, 0.4)";
      ctx.font = "7px 'SF Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText("SSL", W - padding.right - 4, y - 2);
    }

    // Liquidity lows
    for (const ll of data.liquidityLows) {
      const y = yPrice(ll);
      ctx.strokeStyle = "rgba(122, 158, 122, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(122, 158, 122, 0.4)";
      ctx.font = "7px 'SF Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText("BSL", W - padding.right - 4, y - 2);
    }

    // Candles
    visibleCandles.forEach((candle, i) => {
      const x = padding.left + i * (candleW + 0.8);
      const isUp = candle.close >= candle.open;
      const bodyTop = yPrice(Math.max(candle.open, candle.close));
      const bodyBottom = yPrice(Math.min(candle.open, candle.close));
      const bodyH = Math.max(1, bodyBottom - bodyTop);

      // Wick
      ctx.strokeStyle = isUp ? "rgba(122, 158, 122, 0.6)" : "rgba(196, 106, 106, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, yPrice(candle.high));
      ctx.lineTo(x + candleW / 2, yPrice(candle.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? "rgba(122, 158, 122, 0.8)" : "rgba(196, 106, 106, 0.8)";
      ctx.fillRect(x, bodyTop, candleW, bodyH);

      // Volume
      const volY = padding.top + chartH + 2;
      const volMax = Math.max(...visibleCandles.map((c) => c.volume), 1);
      const volHt = (candle.volume / volMax) * volumeH;
      ctx.fillStyle = isUp ? "rgba(122, 158, 122, 0.12)" : "rgba(196, 106, 106, 0.12)";
      ctx.fillRect(x + 0.3, volY + volumeH - volHt, Math.max(1, candleW * 0.6), volHt);
    });

    // Moving averages
    for (const period of [10, 20]) {
      ctx.beginPath();
      ctx.strokeStyle = period === 10 ? "rgba(122, 158, 122, 0.4)" : "rgba(196, 154, 108, 0.3)";
      ctx.lineWidth = period === 10 ? 1.5 : 1;

      for (let i = period - 1; i < visibleCandles.length; i++) {
        const slice = visibleCandles.slice(i - period + 1, i + 1);
        const avg = slice.reduce((s, c) => s + c.close, 0) / period;
        const x = padding.left + i * (candleW + 0.8) + candleW / 2;
        const y = yPrice(avg);
        if (i === period - 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const lastSlice = visibleCandles.slice(-period);
      const lastAvg = lastSlice.reduce((s, c) => s + c.close, 0) / period;
      const labelX = padding.left + (visibleCandles.length - 1) * (candleW + 0.8) + candleW + 4;
      ctx.fillStyle = period === 10 ? "rgba(122, 158, 122, 0.5)" : "rgba(196, 154, 108, 0.4)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SMA${period}`, labelX, yPrice(lastAvg) + 2);
    }

    // Support & Resistance
    const recentHigh = Math.max(...visibleCandles.slice(-20).map((c) => c.high));
    const recentLow = Math.min(...visibleCandles.slice(-20).map((c) => c.low));
    [recentHigh, recentLow, (recentHigh + recentLow) / 2].forEach((level) => {
      ctx.strokeStyle = "rgba(181, 171, 156, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, yPrice(level));
      ctx.lineTo(W - padding.right, yPrice(level));
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Sweep markers
    for (const sweep of data.sweepPoints) {
      const y = yPrice(sweep.price);
      const color = sweep.direction === "BUY" ? "#7a9e7a" : "#c46a6a";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(W - padding.right - 14, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `${color}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W - padding.right - 14, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Entry zone
    if (data.decision && data.decision.status === "TRADE" && data.decision.entryZone) {
      const zone = data.decision.entryZone;
      const y1 = yPrice(zone.high);
      const y2 = yPrice(zone.low);
      const isBuy = data.decision.direction === "BUY";
      const color = isBuy ? "rgba(122, 158, 122, 0.08)" : "rgba(196, 106, 106, 0.08)";
      ctx.fillStyle = color;
      ctx.fillRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));

      ctx.strokeStyle = isBuy ? "rgba(122, 158, 122, 0.5)" : "rgba(196, 106, 106, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      const entryY = yPrice(zone.midpoint);
      ctx.beginPath();
      ctx.moveTo(padding.left, entryY);
      ctx.lineTo(W - padding.right, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isBuy ? "rgba(122, 158, 122, 0.6)" : "rgba(196, 106, 106, 0.6)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Entry ${zone.midpoint.toFixed(1)}`, padding.left + 4, entryY - 3);
    }

    // Stop loss
    if (data.decision && data.decision.status === "TRADE" && data.decision.stopLoss > 0) {
      const slY = yPrice(data.decision.stopLoss);
      ctx.strokeStyle = "rgba(196, 106, 106, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding.left, slY);
      ctx.lineTo(W - padding.right, slY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(196, 106, 106, 0.5)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SL ${data.decision.stopLoss.toFixed(1)}`, padding.left + 4, slY + 10);
    }

    // TP lines
    if (data.decision && data.decision.status === "TRADE") {
      [data.decision.takeProfit.tp1, data.decision.takeProfit.tp2, data.decision.takeProfit.tp3].forEach((tp, i) => {
        if (tp <= 0) return;
        const tpY = yPrice(tp);
        ctx.strokeStyle = `rgba(122, 158, 122, ${0.2 + i * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, tpY);
        ctx.lineTo(W - padding.right, tpY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(122, 158, 122, ${0.3 + i * 0.15})`;
        ctx.font = "8px 'SF Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`TP${i + 1} ${tp.toFixed(1)}`, padding.left + 4, tpY + 10);
      });
    }

    // Current price line
    const currentY = yPrice(data.currentPrice);
    ctx.strokeStyle = "rgba(44, 40, 34, 0.2)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentY);
    ctx.lineTo(W - padding.right, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#2c2822";
    ctx.font = "10px 'SF Mono', monospace";
    ctx.textAlign = "right";
    const priceText = data.currentPrice.toFixed(data.activeSymbol === "XAUUSD" ? 1 : 2);
    ctx.fillText(priceText, W - padding.right - 4, currentY - 4);

    // Top info
    ctx.fillStyle = "#8a8070";
    ctx.font = "9px 'SF Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${data.activeSymbol} • ${selectedTimeframe} • ${visibleCandles.length} candles`, padding.left, 16);

    // RSI Panel
    if (showRSI) {
      const rsiBase = padding.top + chartH + volumeH + 8;
      const rsiValues = calculateRSI(visibleCandles, 14);
      ctx.fillStyle = "rgba(240, 236, 230, 0.5)";
      ctx.fillRect(padding.left, rsiBase, chartW, rsiH);

      ctx.strokeStyle = "rgba(224, 218, 208, 0.5)";
      ctx.lineWidth = 0.5;
      [30, 50, 70].forEach((level) => {
        const y = rsiBase + rsiH - (level / 100) * rsiH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(W - padding.right, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(181, 171, 156, 0.3)";
        ctx.font = "7px 'SF Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${level}`, W - padding.right - 2, y + 2);
      });

      if (rsiValues.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(122, 158, 122, 0.6)";
        ctx.lineWidth = 1;
        for (let i = 0; i < rsiValues.length; i++) {
          const x = padding.left + (i / Math.max(rsiValues.length - 1, 1)) * chartW;
          const y = rsiBase + rsiH - (rsiValues[i] / 100) * rsiH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const lastRSI = rsiValues[rsiValues.length - 1];
        ctx.fillStyle = lastRSI > 70 ? "rgba(196, 106, 106, 0.6)" : lastRSI < 30 ? "rgba(122, 158, 122, 0.6)" : "rgba(122, 158, 122, 0.6)";
        ctx.font = "8px 'SF Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`RSI ${lastRSI.toFixed(1)}`, padding.left + 4, rsiBase + 12);
      }
    }
  }, [data, showRSI, showMACD, selectedTimeframe]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="h-full flex flex-col bg-[#fcfaf7]">
      {/* Toolbar */}
      <div className="h-9 bg-[#f8f6f2] border-b border-[#e0dad0] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1 text-[9px] font-medium transition-all ${
                selectedTimeframe === tf
                  ? "text-[#2c2822] bg-white border-b-2 border-b-[#2c2822]"
                  : "text-[#8a8070] hover:text-[#2c2822]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {SYMBOLS.slice(0, 6).map((sym) => (
            <button
              key={sym}
              onClick={() => onSymbolChange?.(sym)}
              className={`px-1.5 py-1 text-[9px] font-medium transition-all ${
                data.activeSymbol === sym
                  ? "text-[#2c2822] bg-white"
                  : "text-[#8a8070] hover:text-[#2c2822]"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-1.5 py-1 text-[9px] transition-all ${
              showRSI ? "text-[#2c2822] bg-white" : "text-[#8a8070] hover:text-[#2c2822]"
            }`}
          >
            RSI
          </button>
          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-1.5 py-1 text-[9px] transition-all ${
              showMACD ? "text-[#2c2822] bg-white" : "text-[#8a8070] hover:text-[#2c2822]"
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>

      {/* Bottom indicator bar */}
      <div className="h-5 bg-[#f8f6f2] border-t border-[#e0dad0] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3 text-[8px] text-[#b5ab9c]">
          <span>O: {data.candles.length > 0 ? data.candles[data.candles.length - 1].open.toFixed(2) : "—"}</span>
          <span>H: {data.candles.length > 0 ? data.candles[data.candles.length - 1].high.toFixed(2) : "—"}</span>
          <span>L: {data.candles.length > 0 ? data.candles[data.candles.length - 1].low.toFixed(2) : "—"}</span>
          <span>C: {data.candles.length > 0 ? data.candles[data.candles.length - 1].close.toFixed(2) : "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-[#b5ab9c]">
          <span>FVG</span>
          <span>OB</span>
          <span>MSS</span>
          <span>Liq</span>
        </div>
      </div>
    </div>
  );
}

function calculateRSI(candles: Candle[], period: number): number[] {
  if (candles.length < period + 1) return [];
  const values: number[] = [];
  for (let i = period; i < candles.length; i++) {
    const gains: number[] = [];
    const losses: number[] = [];
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j].close - candles[j - 1].close;
      if (diff > 0) gains.push(diff);
      else losses.push(Math.abs(diff));
    }
    const avgGain = gains.reduce((s, v) => s + v, 0) / period;
    const avgLoss = losses.reduce((s, v) => s + v, 0) / period;
    if (avgLoss === 0) {
      values.push(100);
    } else {
      const rs = avgGain / avgLoss;
      values.push(100 - 100 / (1 + rs));
    }
  }
  return values;
}
