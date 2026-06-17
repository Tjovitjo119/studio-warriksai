// ============================================================================
// WARRIKS AI — Studio Edition Dashboard
// Clean, editorial layout with warm off-whites and thin framing
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

import TopBar from "@/components/TopBar";
import LeftSidebar from "@/components/LeftSidebar";
import CenterChart from "@/components/CenterChart";
import RightPanel from "@/components/RightPanel";
import BottomAnalytics from "@/components/BottomAnalytics";
import MultiTimeframeGrid from "@/components/MultiTimeframeGrid";

// View components
import MarketsView from "@/components/views/MarketsView";
import WatchlistView from "@/components/views/WatchlistView";
import MultiChartView from "@/components/views/MultiChartView";
import BacktestingView from "@/components/views/BacktestingView";
import RiskManagerView from "@/components/views/RiskManagerView";
import PerformanceView from "@/components/views/PerformanceView";
import CalendarView from "@/components/views/CalendarView";
import NewsView from "@/components/views/NewsView";
import JournalView from "@/components/views/JournalView";
import StrategyBuilderView from "@/components/views/StrategyBuilderView";
import SettingsView from "@/components/views/SettingsView";

import { analyzeSession } from "@/engine/session";
import { runDecisionEngine } from "@/engine/decision";
import { runMultiStrategy, getStrategySummary } from "@/engine/strategies";
import { runCombinationEngine, getEngineSummary } from "@/engine/strategies/combinationEngine";
import { generateCandles, getMarketSnapshot, getMockSignals, getMockTradeHistory } from "@/engine/marketData";
import type { MarketData, Signal, TradeRecord, Candle, TradeDecision, MultiStrategyOutput, CombinationResult } from "@/engine/types";
import { DEFAULT_SYMBOLS } from "@/engine/types";

export default function Dashboard() {
  const { user } = useAuth();
  const fetchLiveCandles = useAction(api.marketData.fetchLiveCandles);
  const saveSignal = useMutation(api.signals.createSignal);

  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H");
  const [candlesMap, setCandlesMap] = useState<Record<string, Candle[]>>({});
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades] = useState<TradeRecord[]>(getMockTradeHistory);
  const [lastDecision, setLastDecision] = useState<TradeDecision | null>(null);
  const [multiStrategy, setMultiStrategy] = useState<MultiStrategyOutput | null>(null);
  const [combinationResult, setCombinationResult] = useState<CombinationResult | null>(null);
  const [combinationSummary, setCombinationSummary] = useState<ReturnType<typeof getEngineSummary> | null>(null);
  const [sessionInfo, setSessionInfo] = useState(analyzeSession());
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "synthetic">("synthetic");
  const [rightPanelTab, setRightPanelTab] = useState<"signals" | "orders" | "journal">("signals");

  // Initialize market data
  const loadMarketData = useCallback(async (isInitial: boolean) => {
    try {
      const liveData = await fetchLiveCandles();
      const hasLiveData = DEFAULT_SYMBOLS.some((s) => liveData[s] && liveData[s].length > 0);

      if (hasLiveData) {
        const merged: Record<string, Candle[]> = {};
        for (const symbol of [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"]) {
          if (liveData[symbol] && liveData[symbol].length > 0) {
            merged[symbol] = liveData[symbol];
          } else {
            merged[symbol] = generateCandles(symbol, 120);
          }
        }
        setCandlesMap(merged);
        setDataSource("live");

        const marketData: MarketData[] = [];
        for (const symbol of [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"]) {
          const candles = merged[symbol];
          if (candles && candles.length > 0) {
            marketData.push(getMarketSnapshot(symbol, candles));
          }
        }
        setMarkets(marketData);

        const activeCandles = merged[activeSymbol];
        if (activeCandles && activeCandles.length > 0) {
          const decision = runDecisionEngine(activeSymbol, activeCandles);
          setLastDecision(decision);
          const multi = runMultiStrategy(activeSymbol, activeCandles);
          setMultiStrategy(multi);
          const combination = runCombinationEngine(activeSymbol, activeCandles);
          setCombinationResult(combination);
          setCombinationSummary(getEngineSummary(combination));
        }

        if (isInitial) {
          setSignals(getMockSignals());
        }
        return;
      }
    } catch (e) {
      console.warn("[Dashboard] Live data fetch failed, using synthetic:", e);
    }

    // Fallback: synthetic data
    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const initialCandles: Record<string, Candle[]> = {};
    const marketData: MarketData[] = [];

    for (const symbol of allSymbols) {
      const candles = generateCandles(symbol, 120);
      initialCandles[symbol] = candles;
      marketData.push(getMarketSnapshot(symbol, candles));
    }

    setCandlesMap(initialCandles);
    setMarkets(marketData);
    setDataSource("synthetic");

    if (isInitial) {
      setSignals(getMockSignals());
    }

    const decision = runDecisionEngine(activeSymbol, initialCandles[activeSymbol]);
    setLastDecision(decision);

    const multi = runMultiStrategy(activeSymbol, initialCandles[activeSymbol]);
    setMultiStrategy(multi);

    const combination = runCombinationEngine(activeSymbol, initialCandles[activeSymbol]);
    setCombinationResult(combination);
    setCombinationSummary(getEngineSummary(combination));
  }, [fetchLiveCandles, activeSymbol]);

  useEffect(() => {
    loadMarketData(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  // Save combination results to Convex as signals (with 5-minute cooldown per symbol to prevent spam)
  const lastSignalTimeRef = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!combinationResult || !combinationResult.tradeable) return;

    const now = Date.now();
    const lastTime = lastSignalTimeRef.current[activeSymbol] ?? 0;
    if (now - lastTime < 300_000) return; // 5-minute cooldown

    const consensusEngine = combinationResult.engines.find(e => e.signal && e.direction !== "NEUTRAL");
    if (!consensusEngine) return;

    const currentPrice = candlesMap[activeSymbol]?.[candlesMap[activeSymbol]?.length - 1]?.close || 0;
    const stopLoss = consensusEngine.direction === "BUY" ? currentPrice * 0.99 : currentPrice * 1.01;
    const tp1 = consensusEngine.direction === "BUY" ? currentPrice * 1.02 : currentPrice * 0.98;
    const tp2 = consensusEngine.direction === "BUY" ? currentPrice * 1.03 : currentPrice * 0.97;
    const tp3 = consensusEngine.direction === "BUY" ? currentPrice * 1.045 : currentPrice * 0.955;

    saveSignal({
      symbol: activeSymbol,
      direction: combinationResult.consensusDirection,
      confidence: combinationResult.confluenceScore,
      confluenceScore: combinationResult.confluenceScore,
      agreement: combinationResult.agreement,
      agreementCount: combinationResult.agreementCount,
      tradeable: combinationResult.tradeable,
      entryZone: {
        high: currentPrice * 1.001,
        low: currentPrice * 0.999,
        midpoint: currentPrice,
      },
      stopLoss,
      takeProfit: { tp1, tp2, tp3 },
      riskReward: Math.round((Math.abs(tp1 - currentPrice) / Math.abs(stopLoss - currentPrice)) * 10) / 10 || 1.5,
      killzone: "NEW_YORK",
      entryModel: consensusEngine.type,
      sessionPriority: combinationResult.sessionPriority,
      engines: combinationResult.engines.map(e => ({
        type: e.type,
        direction: e.direction,
        confidence: e.confidence,
        signal: e.signal,
        reason: e.reason,
      })),
      boosters: combinationResult.boostersApplied.filter(b => b.applied).map(b => b.label),
      description: combinationResult.description,
    }).then(() => {
      lastSignalTimeRef.current[activeSymbol] = Date.now();
    });
  }, [combinationResult, activeSymbol, combinationResult?.agreement, combinationResult?.consensusDirection, saveSignal]);

  // Live tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCandlesMap((prev) => {
        const updated: Record<string, Candle[]> = { ...prev };
        const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
        for (const symbol of allSymbols) {
          const existing = updated[symbol];
          if (!existing || existing.length === 0) continue;
          const last = existing[existing.length - 1];
          const drift = (Math.random() - 0.49) * 
            (symbol === "NAS100" ? 8 : symbol === "XAUUSD" ? 1.2 : symbol === "BTCUSD" ? 120 : 0.0002);
          const open = last.close;
          const close = open + drift;
          const high = Math.max(open, close) + Math.random() * Math.abs(drift) * 0.8;
          const low = Math.min(open, close) - Math.random() * Math.abs(drift) * 0.8;
          const volume = Math.floor(Math.random() * 1000 + 100);
          const newCandle: Candle = {
            timestamp: Date.now(),
            open: Math.round(open * 10000) / 10000,
            high: Math.round(high * 10000) / 10000,
            low: Math.round(low * 10000) / 10000,
            close: Math.round(close * 10000) / 10000,
            volume,
          };
          updated[symbol] = [...existing.slice(-150), newCandle];
        }
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update market data and decisions when candles change
  useEffect(() => {
    if (!candlesMap[activeSymbol]) return;
    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const marketData: MarketData[] = [];
    for (const symbol of allSymbols) {
      const candles = candlesMap[symbol];
      if (candles && candles.length > 0) {
        marketData.push(getMarketSnapshot(symbol, candles));
      }
    }
    setMarkets(marketData);
    setSessionInfo(analyzeSession());

    const candles = candlesMap[activeSymbol];
    if (candles && candles.length > 0) {
      const decision = runDecisionEngine(activeSymbol, candles);
      setLastDecision(decision);
      const multi = runMultiStrategy(activeSymbol, candles);
      setMultiStrategy(multi);
      const combination = runCombinationEngine(activeSymbol, candles);
      setCombinationResult(combination);
      setCombinationSummary(getEngineSummary(combination));
    }
  }, [activeSymbol, candlesMap]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const updatedCandles: Record<string, Candle[]> = {};
    for (const symbol of allSymbols) {
      updatedCandles[symbol] = generateCandles(symbol, 120);
    }
    setCandlesMap(updatedCandles);
    setSignals(getMockSignals());
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
  }, []);

  const handleNavChange = useCallback((id: string) => {
    setActiveNav(id);
    if (id === "signals") setRightPanelTab("signals");
    else if (id === "journal") setRightPanelTab("journal");
  }, []);

  const strategySummary = useMemo(() => {
    if (!multiStrategy) return null;
    return getStrategySummary(multiStrategy);
  }, [multiStrategy]);

  const chartData = useMemo(() => {
    const candles = candlesMap[activeSymbol] || [];
    const decision = lastDecision;
    return {
      candles,
      fvgZones: decision?.orderFlowModel === "FVG" && decision?.entryZone ? [decision.entryZone] : [],
      orderBlocks: decision?.orderFlowModel === "OB" && decision?.entryZone ? [decision.entryZone] : [],
      liquidityHighs: decision?.liquiditySweep && decision?.direction === "SELL" ? [decision?.entryZone?.high || 0].filter(Boolean) : [],
      liquidityLows: decision?.liquiditySweep && decision?.direction === "BUY" ? [decision?.entryZone?.low || 0].filter(Boolean) : [],
      sweepPoints: decision?.liquiditySweep ? [{ price: decision?.stopLoss || 0, direction: decision?.direction as "BUY" | "SELL" || "BUY" }] : [],
      activeSymbol,
      currentPrice: candles.length > 0 ? candles[candles.length - 1].close : 0,
      decision,
      multiStrategy,
    };
  }, [candlesMap, activeSymbol, lastDecision, multiStrategy]);

  // Filter signals to show only those for the currently selected symbol
  const filteredSignals = useMemo(() => {
    return signals.filter((s) => s.symbol === activeSymbol);
  }, [signals, activeSymbol]);

  const perfStats = useMemo(() => {
    const closed = trades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.status === "WIN");
    const losses = closed.filter((t) => t.status === "LOSS");
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const avgRR = closed.length > 0 ? closed.reduce((s, t) => s + t.riskReward, 0) / closed.length : 0;
    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl)) : 0;
    const returns = closed.map((t) => t.pnlPercent);
    const avgReturn = returns.reduce((s, r) => s + r, 0) / Math.max(returns.length, 1);
    const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / Math.max(returns.length, 1));
    const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    let peak = -Infinity;
    let maxDD = 0;
    let runningPnl = 0;
    for (const t of closed) {
      runningPnl += t.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const dd = ((peak - runningPnl) / Math.max(Math.abs(peak), 1)) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    return { winRate, totalPnl, avgRR, profitFactor, bestTrade, worstTrade, sharpe, maxDD, total: closed.length, wins: wins.length, losses: losses.length };
  }, [trades]);

  // No loading state needed — direct access without auth

  const isFullPageView = ["markets", "watchlist", "multichart", "backtesting", "risk", "performance", "calendar", "news", "strategy", "settings"].includes(activeNav);
  const showFullLayout = activeNav === "dashboard" || activeNav === "signals";

  return (
    <div className="min-h-screen bg-[#f8f6f2] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <TopBar
        markets={markets}
        dataSource={dataSource}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
        />

        {isFullPageView ? (
          /* Full-Page Views */
          <div className="flex-1 min-w-0 bg-[#f8f6f2]">
            {activeNav === "markets" && (
              <MarketsView
                markets={markets}
                activeSymbol={activeSymbol}
                onSelectSymbol={(sym) => { handleSelectSymbol(sym); setActiveNav("dashboard"); }}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            )}
            {activeNav === "watchlist" && (
              <WatchlistView
                markets={markets}
                activeSymbol={activeSymbol}
                onSelectSymbol={(sym) => { handleSelectSymbol(sym); setActiveNav("dashboard"); }}
              />
            )}
            {activeNav === "multichart" && (
              <MultiChartView
                candlesMap={candlesMap}
                activeSymbol={activeSymbol}
                onSymbolChange={handleSelectSymbol}
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            )}
            {activeNav === "backtesting" && <BacktestingView />}
            {activeNav === "risk" && <RiskManagerView markets={markets} />}
            {activeNav === "performance" && <PerformanceView stats={perfStats} decisionReason={lastDecision?.reason} decisionStatus={lastDecision?.status} confluenceScore={lastDecision?.confluenceScore} />}
            {activeNav === "calendar" && <CalendarView />}
            {activeNav === "news" && <NewsView />}
            {activeNav === "strategy" && <StrategyBuilderView />}
            {activeNav === "settings" && <SettingsView />}
          </div>
        ) : activeNav === "journal" ? (
          <div className="flex-1 min-w-0">
            <JournalView />
          </div>
        ) : (
          /* Trading Layout: Center Chart + Right Panel */
          <>
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-[#e0dad0]">
              <div className="flex-1 min-h-0">
                <CenterChart
                  data={chartData}
                  onSymbolChange={handleSelectSymbol}
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </div>
              <div className="h-[130px] shrink-0 border-t border-[#e0dad0]">
                <MultiTimeframeGrid
                  candlesMap={candlesMap}
                  symbol={activeSymbol}
                />
              </div>
            </div>
            <div className="w-[300px] shrink-0 border-l border-[#e0dad0] overflow-hidden bg-[#fcfaf7]">
              <RightPanel
                signals={filteredSignals}
                multiStrategy={multiStrategy}
                strategySummary={strategySummary}
                combinationResult={combinationResult}
                combinationSummary={combinationSummary}
                activeSymbol={activeSymbol}
                currentPrice={candlesMap[activeSymbol]?.[candlesMap[activeSymbol]?.length - 1]?.close || 0}
                decision={lastDecision}
                onTradeExecuted={handleRefresh}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom Analytics — compact */}
      {showFullLayout && (
        <div className="h-[120px] shrink-0 border-t border-[#e0dad0] bg-white">
          <BottomAnalytics
            trades={trades}
            markets={markets}
            multiStrategy={multiStrategy}
            strategySummary={strategySummary}
            combinationResult={combinationResult}
            combinationSummary={combinationSummary}
          />
        </div>
      )}

      {/* Status Bar — with precise NO_TRADE reasons */}
      <footer className="h-8 bg-white border-t border-[#e0dad0] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-[8px] text-[#b5ab9c] tracking-wider shrink-0">WARRIKS v5.1</span>
          <span className="w-px h-2.5 bg-[#e0dad0] shrink-0" />
          
          {/* Decision Status — precise reason */}
          {lastDecision && (
            <>
              <span className={`text-[8px] font-semibold shrink-0 flex items-center gap-1 ${
                lastDecision.status === "TRADE" ? "text-[#7a9e7a]" : "text-[#c46a6a]"
              }`}>
                {lastDecision.status === "TRADE" ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                {lastDecision.status === "TRADE" ? `TRADE ${lastDecision.direction}` : "NO TRADE"}
              </span>
              <span className="text-[7px] text-[#8a8070] truncate max-w-[280px]">
                {lastDecision.reason}
              </span>
              <span className="w-px h-2.5 bg-[#e0dad0] shrink-0" />
            </>
          )}
          
          <span className={`text-[8px] shrink-0 ${lastDecision?.confluenceScore && lastDecision.confluenceScore >= 85 ? "text-[#7a9e7a]" : "text-[#b5ab9c]"}`}>
            Conf: {lastDecision?.confluenceScore || 0}
          </span>
          <span className="w-px h-2.5 bg-[#e0dad0] shrink-0" />
          <span className={`text-[8px] shrink-0 ${multiStrategy?.agreement === "STRONG" ? "text-[#7a9e7a]" : multiStrategy?.agreement === "CONFLICT" ? "text-[#c46a6a]" : "text-[#c49a6c]"}`}>
            Strat: {multiStrategy?.agreement || "—"} ({multiStrategy?.buyVotes || 0}▲/{multiStrategy?.sellVotes || 0}▼)
          </span>
          <span className="w-px h-2.5 bg-[#e0dad0] shrink-0" />
          <span className="text-[8px] shrink-0">
            {sessionInfo.inKillzone ? (
              <span className="text-[#7a9e7a]">● {sessionInfo.currentKillzone}</span>
            ) : (
              <span className="text-[#c46a6a]">○ {sessionInfo.currentKillzone} {sessionInfo.nextKillzoneTime ? `→ ${sessionInfo.nextKillzoneTime}` : ''}</span>
            )}
          </span>
          
          {/* Combination engine summary */}
          {combinationSummary && (
            <>
              <span className="w-px h-2.5 bg-[#e0dad0] shrink-0" />
              <span className={`text-[8px] shrink-0 ${combinationSummary.tradeable ? "text-[#7a9e7a]" : "text-[#c46a6a]"}`}>
                6E: {combinationSummary.activeEngines}/6 {combinationSummary.agreementLabel}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[8px] text-[#b5ab9c]">{user?.name || user?.email || "Trader"}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#7a9e7a]" />
        </div>
      </footer>
    </div>
  );
}
