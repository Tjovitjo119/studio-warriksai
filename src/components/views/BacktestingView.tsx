// ============================================================================
// WARRIKS AI — Enhanced Backtesting View v2
// Strategy picker, date-range-filtered candles, saved backtest runs,
// multi-run iterations with real engine metrics, recharts equity curve,
// and per-engine breakdown statistics
// ============================================================================

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  RefreshCcw,
  BarChart3,
  Target,
  DollarSign,
  LineChart,
  Play,
  Clock,
  Brain,
  Layers,
  PieChart,
  Activity,
  Save,
  Trash2,
  FolderOpen,
  Check,
  X,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react";
import { ENGINE_LABELS } from "@/engine/types";
import type { StrategyEngineType, Candle } from "@/engine/types";
import { generateCandles } from "@/engine/marketData";
import { runCombinationEngine } from "@/engine/strategies/combinationEngine";
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

// ============================================================================
// Types
// ============================================================================

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

interface BacktestMetrics {
  total: number;
  tradeableCount: number;
  noTradeCount: number;
  tradeablePercent: number;
  avgConfidence: number;
  avgAgreement: number;
  eliteCount: number;
  institutionalCount: number;
  highProbCount: number;
  moderateProbCount: number;
  buySignals: number;
  sellSignals: number;
  finalEquity: number;
  totalReturn: number;
}

type TabView = "results" | "saved";

// All 6 strategy engines
const ALL_ENGINES: StrategyEngineType[] = [
  "MSS_FVG",
  "JUDAS_SWING",
  "BREAKER_BLOCK",
  "VWAP_REVERSION",
  "DAILY_RANGE_EXPANSION",
  "TURTLE_BREAKOUT",
];

// ============================================================================
// Candle generation with date-range-aware bias
// ============================================================================

function generateDateAwareCandles(
  symbol: string,
  count: number,
  startDate: string,
  endDate: string,
  iterationBias: "bullish" | "bearish" | "neutral",
): Candle[] {
  const candles = generateCandles(symbol, count) as Candle[];

  // Apply a date-based volatility modifier
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const dateSpan = Math.max(end - start, 1);

  // Add a trend that varies by position in the date range
  const biased = candles.map((c, i) => {
    const progress = i / candles.length; // 0..1
    const dateFactor = Math.sin(progress * Math.PI * 1.5) * 0.3 + 0.7; // 0.4..1.0

    let drift: number;
    if (iterationBias === "bullish") {
      drift = Math.pow(1.0015, i) * dateFactor;
    } else if (iterationBias === "bearish") {
      drift = Math.pow(0.9985, i) * dateFactor;
    } else {
      // neutral with slight random walk
      drift = 1 + (Math.random() - 0.5) * 0.004 * dateFactor;
    }

    return {
      ...c,
      open: c.open * drift,
      high: c.high * drift * (1 + 0.001 * dateFactor),
      low: c.low * drift * (1 - 0.001 * dateFactor),
      close: c.close * drift,
      timestamp: Math.round(start + progress * dateSpan),
    };
  });

  return biased;
}

// ============================================================================
// Component
// ============================================================================

export default function BacktestingView() {
  const [symbol, setSymbol] = useState("NAS100");
  const [timeframe, setTimeframe] = useState("1H");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-06-16");
  const [iterations, setIterations] = useState(50);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [tabView, setTabView] = useState<TabView>("results");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [selectedEngines, setSelectedEngines] = useState<Set<string>>(new Set(ALL_ENGINES));

  // Saved backtests
  const savedBacktests = useQuery(api.trades.getMyBacktests, {});
  const saveBacktest = useMutation(api.trades.saveBacktest);
  const deleteBacktest = useMutation(api.trades.deleteBacktest);

  // Store all iteration results for analysis
  const [iterationResults, setIterationResults] = useState<IterationResult[]>([]);
  const [engineStats, setEngineStats] = useState<EngineStats[]>([]);
  const [equityCurveData, setEquityCurveData] = useState<{ step: number; equity: number }[]>([]);

  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);

  // Toggle engine selection
  const toggleEngine = useCallback((engine: string) => {
    setSelectedEngines((prev) => {
      const next = new Set(prev);
      if (next.has(engine)) next.delete(engine);
      else next.add(engine);
      return next;
    });
  }, []);

  // Select/deselect all engines
  const toggleAllEngines = useCallback(() => {
    setSelectedEngines((prev) =>
      prev.size === ALL_ENGINES.length ? new Set() : new Set(ALL_ENGINES),
    );
  }, []);

  const activeEngineList = useMemo(
    () => ALL_ENGINES.filter((e) => selectedEngines.has(e)),
    [selectedEngines],
  );

  const runBacktest = useCallback(() => {
    if (activeEngineList.length === 0) return;
    setRunning(true);
    setCompleted(false);
    setLoadedFrom(null);

    setTimeout(() => {
      const results: IterationResult[] = [];
      const engineMap = new Map<
        string,
        { signalCount: number; confSum: number; buyCount: number; sellCount: number; neutralCount: number }
      >();

      // Initialize engine stats only for selected engines
      for (const type of activeEngineList) {
        engineMap.set(type, { signalCount: 0, confSum: 0, buyCount: 0, sellCount: 0, neutralCount: 0 });
      }

      let runningEquity = 10000;
      const equityPoints: { step: number; equity: number }[] = [
        { step: 0, equity: runningEquity },
      ];

      for (let i = 0; i < iterations; i++) {
        const bias = i % 3 === 0 ? "bullish" : i % 3 === 1 ? "bearish" : "neutral";
        const candleCount = 80 + Math.floor(Math.random() * 60);

        // Use date-aware candle generation
        const candles = generateDateAwareCandles(symbol, candleCount, startDate, endDate, bias);

        const result = runCombinationEngine(symbol, candles);

        const activeCount = result.engines.filter((e) => e.signal).length;
        results.push({
          agreement: result.agreement,
          agreementCount: result.agreementCount,
          confluenceScore: result.confluenceScore,
          tradeable: result.tradeable,
          consensusDirection: result.consensusDirection,
          activeEngines: activeCount,
        });

        for (const engine of result.engines) {
          if (!engineMap.has(engine.type)) continue; // skip unselected engines
          const stats = engineMap.get(engine.type)!;
          stats.signalCount += engine.signal ? 1 : 0;
          stats.confSum += engine.confidence;
          if (engine.direction === "BUY") stats.buyCount++;
          else if (engine.direction === "SELL") stats.sellCount++;
          else stats.neutralCount++;
        }

        if (result.tradeable && result.agreementCount >= 3) {
          const winProb = result.confluenceScore / 100;
          const won = Math.random() < winProb;
          const riskAmount = runningEquity * 0.015;
          const reward = winProb >= 0.75 ? riskAmount * 2.2 : riskAmount * 1.5;
          runningEquity += won ? reward : -riskAmount;
        }

        if (i % 5 === 0 || i === iterations - 1) {
          equityPoints.push({
            step: i + 1,
            equity: Math.round(runningEquity * 100) / 100,
          });
        }
      }

      const computedStats: EngineStats[] = [];
      for (const [type, stats] of engineMap) {
        computedStats.push({
          type,
          label: ENGINE_LABELS[type as keyof typeof ENGINE_LABELS] || type,
          signalCount: stats.signalCount,
          avgConfidence: Math.round(
            stats.confSum / Math.max(stats.signalCount, 1),
          ),
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
  }, [symbol, iterations, startDate, endDate, activeEngineList]);

  // Derive aggregate metrics
  const metrics = useMemo((): BacktestMetrics | null => {
    if (!completed || iterationResults.length === 0) return null;

    const total = iterationResults.length;
    const tradeableSetups = iterationResults.filter((r) => r.tradeable);
    const tradeableCount = tradeableSetups.length;
    const noTradeCount = total - tradeableCount;

    const avgConfidence = iterationResults.reduce((s, r) => s + r.confluenceScore, 0) / total;
    const avgAgreement = iterationResults.reduce((s, r) => s + r.agreementCount, 0) / total;
    const eliteCount = iterationResults.filter((r) => r.agreement === "ELITE").length;
    const institutionalCount = iterationResults.filter((r) => r.agreement === "INSTITUTIONAL_GRADE").length;
    const highProbCount = iterationResults.filter((r) => r.agreement === "HIGH_PROBABILITY").length;
    const moderateProbCount = iterationResults.filter((r) => r.agreement === "MODERATE_PROBABILITY").length;

    const buySignals = iterationResults.filter((r) => r.consensusDirection === "BUY").length;
    const sellSignals = iterationResults.filter((r) => r.consensusDirection === "SELL").length;

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

  // Chart data
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

  const engineChartData = useMemo(() => {
    return engineStats.map((e) => ({
      name: e.type.replace(/_/g, " ").slice(0, 12),
      signalRate: Math.round((e.signalCount / Math.max(e.total, 1)) * 100),
      avgConf: e.avgConfidence,
      buyPct: Math.round((e.buyCount / Math.max(e.total, 1)) * 100),
      sellPct: Math.round((e.sellCount / Math.max(e.total, 1)) * 100),
    }));
  }, [engineStats]);

  // ============================================================================
  // Save / Load / Delete
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (!metrics || !saveName.trim()) return;
    try {
      await saveBacktest({
        name: saveName.trim(),
        symbol,
        timeframe,
        startDate,
        endDate,
        iterations,
        selectedEngines: Array.from(selectedEngines),
        result: {
          total: metrics.total,
          tradeableCount: metrics.tradeableCount,
          tradeablePercent: metrics.tradeablePercent,
          avgConfidence: metrics.avgConfidence,
          avgAgreement: metrics.avgAgreement,
          eliteCount: metrics.eliteCount,
          institutionalCount: metrics.institutionalCount,
          highProbCount: metrics.highProbCount,
          moderateProbCount: metrics.moderateProbCount,
          noTradeCount: metrics.noTradeCount,
          buySignals: metrics.buySignals,
          sellSignals: metrics.sellSignals,
          finalEquity: metrics.finalEquity,
          totalReturn: metrics.totalReturn,
          equityCurve: equityCurveData,
          engineStats: engineStats.map((e) => ({
            type: e.type,
            signalCount: e.signalCount,
            avgConfidence: e.avgConfidence,
            buyCount: e.buyCount,
            sellCount: e.sellCount,
            neutralCount: e.neutralCount,
            total: e.total,
          })),
          iterationSamples: iterationResults.slice(-20).map((r) => ({
            agreement: r.agreement,
            agreementCount: r.agreementCount,
            confluenceScore: r.confluenceScore,
            tradeable: r.tradeable,
            consensusDirection: r.consensusDirection,
            activeEngines: r.activeEngines,
          })),
        },
      });
      setSaveDialogOpen(false);
      setSaveName("");
    } catch (e) {
      console.error("Failed to save backtest:", e);
    }
  }, [
    metrics, saveName, symbol, timeframe, startDate, endDate,
    iterations, selectedEngines, equityCurveData, engineStats,
    iterationResults, saveBacktest,
  ]);

  const handleDelete = useCallback(
    async (backtestId: string) => {
      try {
        await deleteBacktest({ backtestId: backtestId as any });
      } catch (e) {
        console.error("Failed to delete backtest:", e);
      }
    },
    [deleteBacktest],
  );

  const handleLoad = useCallback(
    (backtest: NonNullable<typeof savedBacktests>[number]) => {
      setSymbol(backtest.symbol);
      setTimeframe(backtest.timeframe);
      setStartDate(backtest.startDate);
      setEndDate(backtest.endDate);
      setIterations(backtest.iterations);
      setSelectedEngines(new Set(backtest.selectedEngines));
      setLoadedFrom(backtest.name);

      // Reconstruct the result state from saved data
      const r = backtest.result;
      setEquityCurveData(r.equityCurve);

      // Reconstruct engine stats (match the shape)
      const restored: EngineStats[] = r.engineStats.map((es) => ({
        type: es.type,
        label: ENGINE_LABELS[es.type as keyof typeof ENGINE_LABELS] || es.type,
        signalCount: es.signalCount,
        avgConfidence: es.avgConfidence,
        buyCount: es.buyCount,
        sellCount: es.sellCount,
        neutralCount: es.neutralCount,
        total: es.total,
      }));
      setEngineStats(restored);
      setIterationResults(r.iterationSamples);
      setCompleted(true);
      setTabView("results");
    },
    [],
  );

  // Auto-name when saving
  const defaultSaveName = `${symbol} ${timeframe} ${iterations}it — ${new Date().toLocaleDateString()}`;

  // Format date for display
  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <RefreshCcw className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">
            Enhanced Backtesting Engine
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setTabView("results")}
              className={`text-[9px] px-2 py-0.5 transition-all ${
                tabView === "results"
                  ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              Results
            </button>
            <button
              onClick={() => setTabView("saved")}
              className={`text-[9px] px-2 py-0.5 transition-all flex items-center gap-1 ${
                tabView === "saved"
                  ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              <FolderOpen className="w-2.5 h-2.5" />
              Saved Runs
              {savedBacktests && savedBacktests.length > 0 && (
                <span className="text-[8px] text-[#64748b]">
                  ({savedBacktests.length})
                </span>
              )}
            </button>
          </div>
          {completed && metrics && (
            <span className="flex items-center gap-1 text-[9px] text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 border border-[#10b981]/20">
              <Activity className="w-2.5 h-2.5" /> {metrics.total} iterations
            </span>
          )}
          {loadedFrom && (
            <span className="text-[8px] text-[#f59e0b] flex items-center gap-1">
              <FolderOpen className="w-2.5 h-2.5" /> Loaded: {loadedFrom}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {completed && metrics && (
            <button
              onClick={() => setSaveDialogOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold bg-[#8b5cf6]/60 text-white hover:bg-[#8b5cf6] transition-all"
            >
              <Save className="w-2.5 h-2.5" /> Save
            </button>
          )}
          <button
            onClick={runBacktest}
            disabled={running || activeEngineList.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <RefreshCcw className="w-3 h-3 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Run {iterations} Iterations
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Config Panel */}
        {tabView === "results" && (
          <div className="w-[240px] bg-[#0d1520] border-r border-[#1e2d3d] p-4 shrink-0 overflow-y-auto">
            <div className="space-y-4">
              {/* Symbol */}
              <div>
                <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">
                  Symbol
                </label>
                <div className="flex flex-wrap gap-1">
                  {["NAS100", "XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSymbol(s)}
                      className={`px-2 py-1 text-[9px] font-medium transition-all ${
                        symbol === s
                          ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20"
                          : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Iterations */}
              <div>
                <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">
                  Iterations
                </label>
                <div className="flex flex-wrap gap-1">
                  {[20, 50, 100, 200].map((n) => (
                    <button
                      key={n}
                      onClick={() => setIterations(n)}
                      className={`px-2 py-1 text-[9px] font-medium transition-all ${
                        iterations === n
                          ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20"
                          : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block">
                  Timeframe
                </label>
                <div className="flex flex-wrap gap-1">
                  {["1M", "5M", "15M", "1H", "4H", "D"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-1 text-[9px] font-medium transition-all ${
                        timeframe === tf
                          ? "text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20"
                          : "text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 block flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" /> Date Range
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[8px] text-[#475569] mb-0.5">Start</div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-[8px] text-[#475569] mb-0.5">End</div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1 outline-none focus:border-[#06b6d4]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Strategy Picker — Engine Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">
                    Strategy Engines
                  </label>
                  <button
                    onClick={toggleAllEngines}
                    className="text-[7px] text-[#06b6d4] hover:text-[#06b6d4]/80 transition-colors"
                  >
                    {selectedEngines.size === ALL_ENGINES.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="space-y-1">
                  {ALL_ENGINES.map((engine) => {
                    const isSelected = selectedEngines.has(engine);
                    const label = ENGINE_LABELS[engine];
                    return (
                      <button
                        key={engine}
                        onClick={() => toggleEngine(engine)}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-[9px] transition-all border ${
                          isSelected
                            ? "text-[#e2e8f0] bg-[#06b6d4]/5 border-[#06b6d4]/20"
                            : "text-[#64748b] bg-transparent border-transparent hover:text-[#e2e8f0] hover:bg-[#111d2e]"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3 h-3 text-[#06b6d4] shrink-0" />
                        ) : (
                          <Square className="w-3 h-3 text-[#475569] shrink-0" />
                        )}
                        <span className="truncate text-left">{label}</span>
                      </button>
                    );
                  })}
                </div>
                {activeEngineList.length === 0 && (
                  <div className="text-[8px] text-[#ef4444] mt-1">
                    Select at least one engine
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {completed && metrics && (
              <div className="mt-4 p-2.5 border border-[#1e2d3d] bg-[#111d2e]/50">
                <div className="text-[8px] text-[#64748b] uppercase tracking-wider font-semibold mb-2">
                  Summary
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[#64748b]">Total Return</span>
                    <span
                      className={`font-bold ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}
                    >
                      {metrics.totalReturn >= 0 ? "+" : ""}
                      {metrics.totalReturn}%
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
        )}

        {/* Saved Runs Panel */}
        {tabView === "saved" && (
          <div className="w-[240px] bg-[#0d1520] border-r border-[#1e2d3d] p-4 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">
                Saved Backtests
              </label>
              <button
                onClick={() => setTabView("results")}
                className="text-[8px] text-[#06b6d4] hover:text-[#06b6d4]/80"
              >
                Back to Results
              </button>
            </div>

            {!savedBacktests ? (
              <div className="text-[9px] text-[#475569] animate-pulse py-4 text-center">
                Loading...
              </div>
            ) : savedBacktests.length === 0 ? (
              <div className="text-[9px] text-[#475569] py-4 text-center">
                No saved backtest runs yet.
                <br />
                <span className="text-[8px] text-[#64748b] mt-1 block">
                  Run a backtest and click Save.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {savedBacktests.map((bt) => (
                  <div
                    key={bt._id}
                    className="p-2 border border-[#1e2d3d] bg-[#111d2e]/50 hover:bg-[#111d2e] transition-colors cursor-pointer group"
                    onClick={() => handleLoad(bt)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="text-[9px] font-semibold text-[#e2e8f0] truncate">
                          {bt.name}
                        </div>
                        <div className="text-[8px] text-[#64748b] mt-0.5">
                          {bt.symbol} · {bt.timeframe} · {bt.iterations}it
                        </div>
                        <div className="text-[8px] text-[#475569] mt-0.5">
                          {fmtDate(bt.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(bt._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#ef4444]/60 hover:text-[#ef4444] transition-all p-0.5"
                        title="Delete"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[8px] font-bold ${
                          bt.result.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                        }`}
                      >
                        {bt.result.totalReturn >= 0 ? "+" : ""}
                        {bt.result.totalReturn}%
                      </span>
                      <span className="text-[8px] text-[#f59e0b]">
                        {bt.result.avgConfidence}c
                      </span>
                      <span className="text-[8px] text-[#06b6d4]">
                        {bt.result.tradeablePercent}%T
                      </span>
                    </div>
                    <div className="text-[7px] text-[#475569] mt-1">
                      Load to view details →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Results Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {!completed ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BarChart3 className="w-12 h-12 text-[#475569] mb-3 opacity-30" />
              <span className="text-xs text-[#64748b]">
                Configure parameters and run backtest
              </span>
              <span className="text-[10px] text-[#475569] mt-1">
                Runs {iterations} iterations with date-aware randomized market data
              </span>
              {activeEngineList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {activeEngineList.map((e) => (
                    <span
                      key={e}
                      className="text-[8px] px-1.5 py-0.5 bg-[#111d2e] border border-[#1e2d3d] text-[#64748b]"
                    >
                      {ENGINE_LABELS[e].split(" ")[0]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              {/* Header Info Bar */}
              <div className="flex items-center gap-2 text-[8px] text-[#475569] border-b border-[#1e2d3d] pb-2">
                <Calendar className="w-2.5 h-2.5" />
                <span>
                  {startDate} → {endDate}
                </span>
                <span className="w-px h-3 bg-[#1e2d3d]" />
                <span>
                  {activeEngineList.length}/{ALL_ENGINES.length} engines
                </span>
                <span className="w-px h-3 bg-[#1e2d3d]" />
                <span>{symbol} · {timeframe}</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-5 gap-3">
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Final Equity</span>
                  </div>
                  <span
                    className={`text-lg font-bold trading-mono ${
                      metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                    }`}
                  >
                    ${metrics.finalEquity.toFixed(2)}
                  </span>
                  <div
                    className={`text-[8px] mt-0.5 ${metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}
                  >
                    {metrics.totalReturn >= 0 ? "+" : ""}
                    {metrics.totalReturn}%
                  </div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3 text-[#f59e0b]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Tradeable</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#06b6d4]">
                    {metrics.tradeablePercent}%
                  </span>
                  <div className="text-[8px] text-[#475569]">
                    {metrics.tradeableCount}/{metrics.total} setups
                  </div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Brain className="w-3 h-3 text-[#8b5cf6]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Elite+Grade</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#8b5cf6]">
                    {metrics.eliteCount + metrics.institutionalCount}
                  </span>
                  <div className="text-[8px] text-[#475569]">ELITE + INST. setups</div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3 h-3 text-[#f59e0b]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Avg Confluence</span>
                  </div>
                  <span className="text-lg font-bold trading-mono text-[#f59e0b]">
                    {metrics.avgConfidence}
                  </span>
                  <div className="text-[8px] text-[#475569]">/ 100</div>
                </div>
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3 h-3 text-[#06b6d4]" />
                    <span className="text-[8px] text-[#64748b] uppercase tracking-wider">Direction Bias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold trading-mono text-[#10b981]">
                      {metrics.buySignals}▲
                    </span>
                    <span className="text-lg font-bold trading-mono text-[#ef4444]">
                      {metrics.sellSignals}▼
                    </span>
                  </div>
                </div>
              </div>

              {/* Equity Curve (Recharts) */}
              <div className="glass-card rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <LineChart className="w-3 h-3 text-[#10b981]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">
                    Equity Curve
                  </span>
                  <span
                    className={`ml-auto text-[8px] font-bold ${
                      metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                    }`}
                  >
                    {metrics.totalReturn >= 0 ? "+" : ""}
                    {metrics.totalReturn}%
                  </span>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={equityCurveData}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="step"
                        tick={{ fill: "#64748b", fontSize: 9 }}
                        axisLine={{ stroke: "#1e2d3d" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 9 }}
                        axisLine={{ stroke: "#1e2d3d" }}
                        tickLine={false}
                        domain={["dataMin - 200", "dataMax + 200"]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0d1520",
                          border: "1px solid #1e2d3d",
                          borderRadius: 0,
                          fontSize: 10,
                          color: "#e2e8f0",
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
                        labelFormatter={(label) => `Iteration ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        fill="url(#equityGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Agreement Distribution & Engine Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <PieChart className="w-3 h-3 text-[#06b6d4]" />
                    <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">
                      Agreement Distribution
                    </span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={agreementChartData}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 55, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={{ stroke: "#1e2d3d" }}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0d1520",
                            border: "1px solid #1e2d3d",
                            borderRadius: 0,
                            fontSize: 10,
                            color: "#e2e8f0",
                          }}
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
                    <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">
                      Engine Performance
                    </span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={engineChartData}
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 6 }}
                          axisLine={{ stroke: "#1e2d3d" }}
                          tickLine={false}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={{ stroke: "#1e2d3d" }}
                          tickLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0d1520",
                            border: "1px solid #1e2d3d",
                            borderRadius: 0,
                            fontSize: 10,
                            color: "#e2e8f0",
                          }}
                        />
                        <Bar
                          dataKey="signalRate"
                          name="Signal Rate %"
                          fill="#06b6d4"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Per-Engine Breakdown Table */}
              <div className="glass-card rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Layers className="w-3 h-3 text-[#06b6d4]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">
                    Per-Engine Breakdown
                  </span>
                  <span className="text-[8px] text-[#475569] ml-auto">
                    {iterations} iterations
                  </span>
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
                        <tr
                          key={i}
                          className="border-b border-[#1e2d3d]/50 hover:bg-[#111d2e]/50 transition-colors"
                        >
                          <td className="py-1.5 px-2 text-[#e2e8f0] font-medium">{eng.label}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span
                              className={`font-bold ${
                                eng.signalCount / eng.total >= 0.5
                                  ? "text-[#10b981]"
                                  : "text-[#f59e0b]"
                              }`}
                            >
                              {Math.round((eng.signalCount / eng.total) * 100)}%
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-[#f59e0b] font-bold">
                            {eng.avgConfidence}
                          </td>
                          <td className="py-1.5 px-2 text-right text-[#10b981]">{eng.buyCount}</td>
                          <td className="py-1.5 px-2 text-right text-[#ef4444]">{eng.sellCount}</td>
                          <td className="py-1.5 px-2 text-right text-[#64748b]">{eng.neutralCount}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span
                              className={`font-bold ${
                                eng.buyCount > eng.sellCount
                                  ? "text-[#10b981]"
                                  : eng.sellCount > eng.buyCount
                                    ? "text-[#ef4444]"
                                    : "text-[#64748b]"
                              }`}
                            >
                              {eng.buyCount > eng.sellCount
                                ? "▲ BUY"
                                : eng.sellCount > eng.buyCount
                                  ? "▼ SELL"
                                  : "—"}
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
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">
                    Sample Iterations (Last 20)
                  </span>
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
                        <tr
                          key={i}
                          className="border-b border-[#1e2d3d]/30 hover:bg-[#111d2e]/50"
                        >
                          <td className="py-1 px-2 text-[#64748b]">
                            {iterationResults.length - 20 + i + 1}
                          </td>
                          <td
                            className={`py-1 px-2 font-medium ${
                              r.agreement === "ELITE"
                                ? "text-[#8b5cf6]"
                                : r.agreement === "INSTITUTIONAL_GRADE"
                                  ? "text-[#06b6d4]"
                                  : r.agreement === "HIGH_PROBABILITY"
                                    ? "text-[#10b981]"
                                    : r.agreement === "MODERATE_PROBABILITY"
                                      ? "text-[#f59e0b]"
                                      : "text-[#ef4444]"
                            }`}
                          >
                            {r.agreement.replace(/_/g, " ")}
                          </td>
                          <td className="py-1 px-2 text-right text-[#e2e8f0]">{r.agreementCount}/6</td>
                          <td className="py-1 px-2 text-right font-bold text-[#f59e0b]">
                            {r.confluenceScore}
                          </td>
                          <td className="py-1 px-2 text-right text-[#06b6d4]">
                            {r.activeEngines}/6
                          </td>
                          <td
                            className={`py-1 px-2 text-right font-bold ${
                              r.consensusDirection === "BUY"
                                ? "text-[#10b981]"
                                : r.consensusDirection === "SELL"
                                  ? "text-[#ef4444]"
                                  : "text-[#64748b]"
                            }`}
                          >
                            {r.consensusDirection === "NEUTRAL" ? "—" : r.consensusDirection}
                          </td>
                          <td
                            className={`py-1 px-2 text-right font-bold ${r.tradeable ? "text-[#10b981]" : "text-[#ef4444]"}`}
                          >
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

      {/* Save Dialog */}
      <AnimatePresence>
        {saveDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setSaveDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1520] border border-[#1e2d3d] p-5 w-[340px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Save className="w-4 h-4 text-[#8b5cf6]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">Save Backtest Run</span>
              </div>

              <div className="mb-3">
                <label className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mb-1 block">
                  Run Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={defaultSaveName}
                  className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#e2e8f0] px-2.5 py-1.5 outline-none focus:border-[#8b5cf6]/40"
                />
              </div>

              <div className="text-[9px] text-[#64748b] space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Symbol</span>
                  <span className="text-[#e2e8f0]">{symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iterations</span>
                  <span className="text-[#e2e8f0]">{iterations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engines</span>
                  <span className="text-[#e2e8f0]">{activeEngineList.length}/6</span>
                </div>
                <div className="flex justify-between">
                  <span>Return</span>
                  <span
                    className={`font-bold ${metrics?.totalReturn && metrics.totalReturn >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}
                  >
                    {metrics?.totalReturn && metrics.totalReturn >= 0 ? "+" : ""}
                    {metrics?.totalReturn ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Final Equity</span>
                  <span className="text-[#e2e8f0]">
                    ${metrics?.finalEquity.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-semibold bg-[#8b5cf6]/80 text-white hover:bg-[#8b5cf6] transition-all"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-semibold bg-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0] transition-all"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
