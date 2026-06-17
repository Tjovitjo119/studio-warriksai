// ============================================================================
// WARRIKS AI — Enhanced Backtesting View
// Multi-run iterations with real engine metrics, recharts equity curve,
// and per-engine breakdown statistics
// ============================================================================

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCcw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  LineChart,
  Play,
  Calendar,
  Clock,
  Brain,
  Layers,
  PieChart,
  Activity,
} from "lucide-react";
import { STRATEGY_LABELS, ENGINE_LABELS } from "@/engine/types";
import type { StrategyType, CombinationResult, Candle } from "@/engine/types";
import { generateCandles } from "@/engine/marketData";
import { runCombinationEngine, getEngineSummary } from "@/engine/strategies/combinationEngine";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface IterationResult {
  agreement: string;
  agreementCount: number;
  confluenceScore: number;
  tradeable: boolean;
  consensusDirection: string;
  activeEngines: number;
}

interface EngineStats {
  type: string;
  label: string;
  signalCount: number;
  avgConfidence: number;
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  total: number;
}

export default function BacktestingView() {
  const [symbol, setSymbol] = useState("NAS100");
  const [strategy, setStrategy] = useState<StrategyType>("ICT_SMC");
  const [timeframe, setTimeframe] = useState("1H");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-06-16");
  const [iterations, setIterations] = useState(50);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Store all iteration results for analysis
  const [iterationResults, setIterationResults] = useState<IterationResult[]>([]);
  const [engineStats, setEngineStats] = useState<EngineStats[]>([]);
  const [equityCurveData, setEquityCurveData] = useState<{ step: number; equity: number }[]>([]);

  const runBacktest = useCallback(() => {
    setRunning(true);
    setCompleted(false);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const results: IterationResult[] = [];
      const engineMap = new Map<string, { signalCount: number; confSum: number; buyCount: number; sellCount: number; neutralCount: number }>();

      // Initialize engine stats
      const engineTypes = ["MSS_FVG", "JUDAS_SWING", "BREAKER_BLOCK", "VWAP_REVERSION", "DAILY_RANGE_EXPANSION", "TURTLE_BREAKOUT"];
      for (const type of engineTypes) {
        engineMap.set(type, { signalCount: 0, confSum: 0, buyCount: 0, sellCount: 0, neutralCount: 0 });
      }

      let runningEquity = 10000; // Starting capital
      const equityPoints: { step: number; equity: number }[] = [{ step: 0, equity: runningEquity }];

      // Run multiple iterations with different random data
      for (let i = 0; i < iterations; i++) {
        // Alternate candle bias for variety
        const bias = i % 3 === 0 ? "bullish" : i % 3 === 1 ? "bearish" : "neutral";
        const candleCount = 80 + Math.floor(Math.random() * 60);
        const candles = generateCandles(symbol, candleCount) as Candle[];

        // Add trend bias by post-processing
        const biased = biasCandles(candles, bias);
        const result = runCombinationEngine(symbol, biased);

        // Track iteration result
        const activeCount = result.engines.filter(e => e.signal).length;
        results.push({
          agreement: result.agreement,
          agreementCount: result.agreementCount,
          confluenceScore: result.confluenceScore,
          tradeable: result.tradeable,
          consensusDirection: result.consensusDirection,
          activeEngines: activeCount,
        });

        // Track per-engine stats
        for (const engine of result.engines) {
          const stats = engineMap.get(engine.type);
          if (stats) {
            stats.signalCount += engine.signal ? 1 : 0;
            stats.confSum += engine.confidence;
            if (engine.direction === "BUY") stats.buyCount++;
            else if (engine.direction === "SELL") stats.sellCount++;
            else stats.neutralCount++;
          }
        }

        // Simulate equity based on tradeable results
        if (result.tradeable && result.agreementCount >= 3) {
          const winProb = result.confluenceScore / 100;
          const won = Math.random() < winProb;
          const riskAmount = runningEquity * 0.015; // 1.5% risk per trade
          const reward = winProb >= 0.75 ? riskAmount * 2.2 : riskAmount * 1.5;
          runningEquity += won ? reward : -riskAmount;
        }

        // Record equity every 5th iteration to keep chart manageable
        if (i % 5 === 0 || i === iterations - 1) {
          equityPoints.push({ step: i + 1, equity: Math.round(runningEquity * 100) / 100 });
        }
      }

      // Compute final engine stats
      const computedStats: EngineStats[] = [];
      for (const [type, stats] of engineMap) {
        computedStats.push({
          type,
          label: ENGINE_LABELS[type as keyof typeof ENGINE_LABELS] || type,
          signalCount: stats.signalCount,
          avgConfidence: Math.round(stats.confSum / Math.max(iterations, 1)),
          buyCount: stats.buyCount,
          sellCount: stats.sellCount,
          neutralCount: stats.neutralCount,
          total: iterations,
        });
      }

      setIterationResults(results);
      setEngineStats(computedStats);
      setEquityCurveData(equityPoints);
      setRunning(false);
      setCompleted(true);
    }, 150);
  }, [symbol, iterations]);

  // Post-process candles with a bias
  const biasCandles = (candles: Candle[], bias: "bullish" | "bearish" | "neutral"): Candle[] => {
    if (bias === "neutral") return candles;
    const factor = bias === "bullish" ? 1.002 : 0.998;
    return candles.map((c, i) => {
      const drift = Math.pow(factor, i);
      return {
        ...c,
        open: c.open * drift,
        high: c.high * drift * 1.001,
        low: c.low * drift * 0.999,
        close: c.close * drift,
      };
    });
  };

  // Derive aggregate metrics from iteration results
  const metrics = useMemo(() => {
    if (!completed || iterationResults.length === 0) return null;

    const total = iterationResults.length;
    const tradeableSetups = iterationResults.filter(r => r.tradeable);
    const tradeableCount = tradeableSetups.length;
    const noTradeCount = total - tradeableCount;

    const avgConfidence = iterationResults.reduce((s, r) => s + r.confluenceScore, 0) / total;
    const avgAgreement = iterationResults.reduce((s, r) => s + r.agreementCount, 0) / total;
    const eliteCount = iterationResults.filter(r => r.agreement === "ELITE").length;
    const institutionalCount = iterationResults.filter(r => r.agreement === "INSTITUTIONAL_GRADE").length;
    const highProbCount = iterationResults.filter(r => r.agreement === "HIGH_PROBABILITY").length;
    const moderateProbCount = iterationResults.filter(r => r.agreement === "MODERATE_PROBABILITY").length;

    const buySignals = iterationResults.filter(r => r.consensusDirection === "BUY").length;
    const sellSignals = iterationResults.filter(r => r.consensusDirection === "SELL").length;

    const finalEquity = equityCurveData.length > 0 ? equityCurveData[equityCurveData.length - 1].equity : 10000;
    const totalReturn = ((finalEquity - 10000) / 10000) * 100;

    return {
      total,
      tradeableCount,
      noTradeCount,
      tradeablePercent: Math.round((tradeableCount / total) * 1000) / 10,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      avgAgreement: Math.round(avgAgreement * 10) / 10,
      eliteCount,
      institutionalCount,
      highProbCount,
      moderateProbCount,
      buySignals,
      sellSignals,
      finalEquity: Math.round(finalEquity * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
    };
  }, [completed, iterationResults, equityCurveData]);

  // Agreement distribution chart data
  const agreementChartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Elite", value: metrics.eliteCount, color: "#8b5cf6" },
      { name: "Inst. Grade", value: metrics.institutionalCount, color: "#06b6d4" },
      { name: "High Prob.", value: metrics.highProbCount, color: "#10b981" },
      { name: "Moderate", value: metrics.moderateProbCount, color: "#f59e0b" },
      { name: "No Trade", value: metrics.noTradeCount, color: "#ef4444" },
    ];
  }, [metrics]);

  // Engine comparison chart data
  const engineChartData = useMemo(() => {
    return engineStats.map(e => ({
      name: e.type.replace(/_/g, " ").slice(0, 12),
      signalRate: Math.round((e.signalCount / Math.max(e.total, 1)) * 100),
      avgConf: e.avgConfidence,
      buyPct: Math.round((e.buyCount / Math.max(e.total, 1)) * 100),
      sellPct: Math.round((e.sellCount / Math.max(e.total, 1)) * 100),
    }));
  }, [engineStats]);

  const gradientOffset = () => {
    if (equityCurveData.length < 2) return 0;
    const first = equityCurveData[0].equity;
    const last = equityCurveData[equityCurveData.length - 1].equity;
    return last >= first ? 0 : 1;
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <RefreshCcw className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Enhanced Backtesting Engine</span>
          {completed && (
            <span className="flex items-center gap-1 text-[9px] text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 border border-[#10b981]/20">
              <Activity className="w-2.5 h-2.5" /> {metrics?.total || 0} iterations
            </span>
          )}
        </div>
        <button
          onClick={runBacktest}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <><RefreshCcw className="w-3 h-3 animate-spin" /> Running...</>
          ) : (
            <><Play className="w-3 h-3" /> Run {iterations} Iterations</>
          )}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Config Panel */}
        <div className="w-[240px] bg-[#0d1520] border-r border-[#1e2d3d] p-4 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">Symbol</label>
              <div className="flex flex-wrap gap-1">
                {["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"].map((s) => (
                  <button key={s} onClick={() => setSymbol(s)}
                    className={`px-2 py-1 text-[9px] font-medium transition-all ${
                      symbol === s ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20" : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Iterations */}
            <div>
              <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">Iterations</label>
              <div className="flex flex-wrap gap-1">
                {[20, 50, 100, 200].map((n) => (
                  <button key={n} onClick={() => setIterations(n)}
                    className={`px-2 py-1 text-[9px] font-medium transition-all ${
                      iterations === n ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20" : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                    }`}>{n}</button>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">Timeframe</label>
              <div className="flex flex-wrap gap-1">
                {["1M", "5M", "15M", "1H", "4H", "D"].map((tf) => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 text-[9px] font-medium transition-all ${
                      timeframe === tf ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20" : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                    }`}>{tf}</button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">Date Range</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[8px] text-[#475569] mb-0.5">Start</div>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30" />
                </div>
                <div className="flex-1">
                  <div className="text-[8px] text-[#475569] mb-0.5">End</div>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {completed && metrics && (
            <div className="mt-4 p-2.5 border border-[#1e2d3d] bg-[#111d2e]/50">
              <div className="text-[8px] text-[#64748b] uppercase tracking-wider font-semibold mb-2">Summary</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#64748b]">Total Return</span>
                  <span className={`font-bold ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {metrics.totalReturn >= 0 ? "+" : ""}{metrics.totalReturn}%
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#64748b]">Final Equity</span>
                  <span className="font-bold text-[#e2e8f0]">${metrics.finalEquity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#64748b]">Tradeable</span>
                  <span className="font-bold text-[#06b6d4]">{metrics.tradeablePercent}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#64748b]">Avg Confluence</span>
                  <span className="font-bold text-[#f59e0b]">{metrics.avgConfidence}/100</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#64748b]">Avg Agreement</span>
                  <span className="font-bold text-[#e2e8f0]">{metrics.avgAgreement}/6</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {!completed ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BarChart3 className="w-12 h-12 text-[#475569] mb-3 opacity-30" />
              <span className="text-xs text-[#64748b]">Configure parameters and run backtest</span>
              <span className="text-[10px] text-[#475569] mt-1">Runs {iterations} iterations with randomized market data</span>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-5 gap-3">
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Final Equity</span>
                  </div>
                  <span className={`text-lg font-bold trading-mono ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    ${metrics.finalEquity.toFixed(2)}
                  </span>
                  <div className={`text-[8px] mt-0.5 ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {metrics.totalReturn >= 0 ? "+" : ""}{metrics.totalReturn}%
                  </div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3 text-[#f59e0b]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Tradeable</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#06b6d4]">{metrics.tradeablePercent}%</span>
                  <div className="text-[8px] text-[#475569]">{metrics.tradeableCount}/{metrics.total} setups</div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Brain className="w-3 h-3 text-[#8b5cf6]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Elite+Grade</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#8b5cf6]">{(metrics.eliteCount + metrics.institutionalCount)}</span>
                  <div className="text-[8px] text-[#475569]">ELITE + INST. setups</div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3 h-3 text-[#f59e0b]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Avg Confluence</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#f59e0b]">{metrics.avgConfidence}</span>
                  <div className="text-[8px] text-[#475569]">/ 100</div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3 h-3 text-[#06b6d4]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Direction Bias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold trading-mono text-[#10b981]">{metrics.buySignals}▲</span>
                    <span className="text-lg font-bold trading-mono text-[#ef4444]">{metrics.sellSignals}▼</span>
                  </div>
                </div>
              </div>

              {/* Equity Curve (Recharts) */}
              <div className="glass-card rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <LineChart className="w-3 h-3 text-[#10b981]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Equity Curve</span>
                  <span className={`ml-auto text-[8px] font-bold ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {metrics.totalReturn >= 0 ? "+" : ""}{metrics.totalReturn}%
                  </span>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurveData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e2d3d' }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e2d3d' }} tickLine={false} domain={['dataMin - 200', 'dataMax + 200']} />
                      <Tooltip
                        contentStyle={{ background: '#0d1520', border: '1px solid #1e2d3d', borderRadius: 0, fontSize: 10, color: '#e2e8f0' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                        labelFormatter={(label) => `Iteration ${label}`}
                      />
                      <Area type="monotone" dataKey="equity" stroke={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} fill="url(#equityGradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Agreement Distribution */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <PieChart className="w-3 h-3 text-[#06b6d4]" />
                    <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Agreement Distribution</span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agreementChartData} layout="vertical" margin={{ top: 0, right: 10, left: 55, bottom: 0 }}>
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={{ stroke: '#1e2d3d' }} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} width={60} />
                        <Tooltip
                          contentStyle={{ background: '#0d1520', border: '1px solid #1e2d3d', borderRadius: 0, fontSize: 10, color: '#e2e8f0' }}
                        />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                          {agreementChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Per-Engine Performance */}
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <BarChart3 className="w-3 h-3 text-[#f59e0b]" />
                    <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Engine Performance</span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={engineChartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 6 }} axisLine={{ stroke: '#1e2d3d' }} tickLine={false} interval={0} angle={-20} textAnchor="end" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 8 }} axisLine={{ stroke: '#1e2d3d' }} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: '#0d1520', border: '1px solid #1e2d3d', borderRadius: 0, fontSize: 10, color: '#e2e8f0' }}
                        />
                        <Bar dataKey="signalRate" name="Signal Rate %" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Per-Engine Breakdown Table */}
              <div className="glass-card rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Layers className="w-3 h-3 text-[#06b6d4]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Per-Engine Breakdown</span>
                  <span className="text-[8px] text-[#475569] ml-auto">{iterations} iterations</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-[#1e2d3d]">
                        <th className="text-left py-1.5 px-2 text-[#64748b] font-semibold">Engine</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">Signal %</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">Avg Conf</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">BUY</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">SELL</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">NEUTRAL</th>
                        <th className="text-right py-1.5 px-2 text-[#64748b] font-semibold">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engineStats.map((eng, i) => (
                        <tr key={i} className="border-b border-[#1e2d3d]/50 hover:bg-[#111d2e]/50 transition-colors">
                          <td className="py-1.5 px-2 text-[#e2e8f0] font-medium">{eng.label}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span className={`font-bold ${eng.signalCount / eng.total >= 0.5 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
                              {Math.round((eng.signalCount / eng.total) * 100)}%
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-[#f59e0b] font-bold">{eng.avgConfidence}</td>
                          <td className="py-1.5 px-2 text-right text-[#10b981]">{eng.buyCount}</td>
                          <td className="py-1.5 px-2 text-right text-[#ef4444]">{eng.sellCount}</td>
                          <td className="py-1.5 px-2 text-right text-[#64748b]">{eng.neutralCount}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span className={`font-bold ${eng.buyCount > eng.sellCount ? "text-[#10b981]" : eng.sellCount > eng.buyCount ? "text-[#ef4444]" : "text-[#64748b]"}`}>
                              {eng.buyCount > eng.sellCount ? "▲ BUY" : eng.sellCount > eng.buyCount ? "▼ SELL" : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Iteration Samples */}
              <div className="glass-card rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3 h-3 text-[#f59e0b]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Sample Iterations (Last 20)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="border-b border-[#1e2d3d]">
                        <th className="text-left py-1 px-2 text-[#64748b]">#</th>
                        <th className="text-left py-1 px-2 text-[#64748b]">Agreement</th>
                        <th className="text-right py-1 px-2 text-[#64748b]">Count</th>
                        <th className="text-right py-1 px-2 text-[#64748b]">Confluence</th>
                        <th className="text-right py-1 px-2 text-[#64748b]">Active</th>
                        <th className="text-right py-1 px-2 text-[#64748b]">Direction</th>
                        <th className="text-right py-1 px-2 text-[#64748b]">Tradeable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {iterationResults.slice(-20).map((r, i) => (
                        <tr key={i} className="border-b border-[#1e2d3d]/30 hover:bg-[#111d2e]/50">
                          <td className="py-1 px-2 text-[#64748b]">{iterationResults.length - 20 + i + 1}</td>
                          <td className={`py-1 px-2 font-medium ${
                            r.agreement === "ELITE" ? "text-[#8b5cf6]" :
                            r.agreement === "INSTITUTIONAL_GRADE" ? "text-[#06b6d4]" :
                            r.agreement === "HIGH_PROBABILITY" ? "text-[#10b981]" :
                            r.agreement === "MODERATE_PROBABILITY" ? "text-[#f59e0b]" :
                            "text-[#ef4444]"
                          }`}>{r.agreement.replace(/_/g, " ")}</td>
                          <td className="py-1 px-2 text-right text-[#e2e8f0]">{r.agreementCount}/6</td>
                          <td className="py-1 px-2 text-right font-bold text-[#f59e0b]">{r.confluenceScore}</td>
                          <td className="py-1 px-2 text-right text-[#06b6d4]">{r.activeEngines}/6</td>
                          <td className={`py-1 px-2 text-right font-bold ${r.consensusDirection === "BUY" ? "text-[#10b981]" : r.consensusDirection === "SELL" ? "text-[#ef4444]" : "text-[#64748b]"}`}>
                            {r.consensusDirection === "NEUTRAL" ? "—" : r.consensusDirection}
                          </td>
                          <td className={`py-1 px-2 text-right font-bold ${r.tradeable ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                            {r.tradeable ? "YES" : "NO"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
