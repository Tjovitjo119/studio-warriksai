// ============================================================================
// WARRIKS AI — TradingView-style Candlestick Chart Component
// Canvas-based rendering with overlay zones
// ============================================================================

import { useCallback, useEffect, useRef } from "react";
import type { Candle, PriceZone } from "@/engine/types";

interface ChartState {
  candles: Candle[];
  fvgZones: PriceZone[];
  orderBlocks: PriceZone[];
  liquidityHighs: number[];
  liquidityLows: number[];
  sweepPoints: { price: number; direction: "BUY" | "SELL" }[];
  activeSymbol: string;
  currentPrice: number;
}

interface TradingChartProps {
  data: ChartState;
  onSymbolChange?: (symbol: string) => void;
}

export default function TradingChart({ data, onSymbolChange }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom - 60; // leave room for volume

    const { candles } = data;
    if (candles.length < 2) {
      ctx.fillStyle = "#334";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("No data", W / 2, H / 2);
      return;
    }

    // Calculate price range
    const visibleCandles = candles.slice(-60);
    const high = Math.max(...visibleCandles.map((c) => c.high)) * 1.002;
    const low = Math.min(...visibleCandles.map((c) => c.low)) * 0.998;
    const range = high - low || 1;

    const candleW = Math.max(2, chartW / visibleCandles.length - 1);
    const volumeH = 40;

    const yPrice = (p: number) => padding.top + chartH - ((p - low) / range) * chartH;

    // Clear
    ctx.fillStyle = "#0c0e12";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#1a1d24";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      const price = low + (range / 5) * (5 - i);
      ctx.fillStyle = "#4a5060";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        price.toFixed(data.activeSymbol === "NAS100" || data.activeSymbol === "XAUUSD" ? 1 : 4),
        padding.left - 5,
        y + 3,
      );
    }

    // Draw FVG zones
    for (const zone of data.fvgZones) {
      const y1 = yPrice(zone.high);
      const y2 = yPrice(zone.low);
      ctx.fillStyle = "rgba(100, 200, 255, 0.08)";
      ctx.fillRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
      ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
    }

    // Draw Order Blocks
    for (const zone of data.orderBlocks) {
      const y1 = yPrice(zone.high);
      const y2 = yPrice(zone.low);
      ctx.fillStyle = "rgba(255, 100, 100, 0.06)";
      ctx.fillRect(padding.left, Math.min(y1, y2), chartW, Math.abs(y2 - y1));
    }

    // Draw liquidity levels
    for (const lh of data.liquidityHighs) {
      const y = yPrice(lh);
      ctx.strokeStyle = "rgba(255, 50, 50, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const ll of data.liquidityLows) {
      const y = yPrice(ll);
      ctx.strokeStyle = "rgba(50, 200, 100, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw candles
    visibleCandles.forEach((candle, i) => {
      const x = padding.left + i * (candleW + 1);
      const isUp = candle.close >= candle.open;

      ctx.fillStyle = isUp ? "#22c55e" : "#ef4444";
      ctx.strokeStyle = isUp ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 1;

      // Wick
      const wickTop = yPrice(candle.high);
      const wickBottom = yPrice(candle.low);
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, wickTop);
      ctx.lineTo(x + candleW / 2, wickBottom);
      ctx.stroke();

      // Body
      const bodyTop = yPrice(Math.max(candle.open, candle.close));
      const bodyBottom = yPrice(Math.min(candle.open, candle.close));
      const bodyH = Math.max(1, bodyBottom - bodyTop);
      ctx.fillRect(x, bodyTop, candleW, bodyH);

      // Volume bars
      const volY = padding.top + chartH + 5;
      const volMax = Math.max(...visibleCandles.map((c) => c.volume));
      const volHt = (candle.volume / volMax) * volumeH;
      ctx.fillStyle = isUp ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)";
      ctx.fillRect(x + 0.5, volY + volumeH - volHt, Math.max(1, candleW * 0.7), volHt);
    });

    // Draw sweep points
    for (const sweep of data.sweepPoints) {
      const y = yPrice(sweep.price);
      ctx.fillStyle = sweep.direction === "BUY" ? "#22c55e" : "#ef4444";
      ctx.beginPath();
      ctx.arc(W - padding.right - 10, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = sweep.direction === "BUY" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)";
      ctx.beginPath();
      ctx.arc(W - padding.right - 10, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Current price line
    const currentY = yPrice(data.currentPrice);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentY);
    ctx.lineTo(W - padding.right, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      data.currentPrice.toFixed(data.activeSymbol === "NAS100" ? 1 : data.activeSymbol === "XAUUSD" ? 1 : 4),
      W - padding.right - 55,
      currentY - 5,
    );

    // Symbol & info overlay
    ctx.fillStyle = "#4a5060";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${data.activeSymbol} • 1m • ${visibleCandles.length} candles`, 10, 15);
  }, [data]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="relative w-full h-full bg-[#0c0e12]" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
