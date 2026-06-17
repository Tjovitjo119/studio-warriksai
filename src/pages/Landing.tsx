// ============================================================================
// WARRIKS AI — N.E.O.N. Edition Landing
// Black terminal · Lime green neon · Cyan accents · Dark blue depth
// Premium scrolling experience with matrix-inspired UI
// ============================================================================

import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Activity,
  LineChart,
  Brain,
  Gauge,
  Zap,
  ChevronRight,
  Terminal,
  Cpu,
  Shield,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Multi-Strategy AI Engine",
    desc: "Market Structure, Liquidity, Order Flow & Session analysis fused into a single confluence score with institutional precision",
    tag: "CORE ENGINE",
    gradient: "from-[#00ff41] to-[#00cc33]",
  },
  {
    icon: LineChart,
    title: "Institutional Charting",
    desc: "Professional-grade canvas rendering with FVG, OB, MSS, liquidity zones & multi-timeframe analysis",
    tag: "VIZUALIZATION",
    gradient: "from-[#00d4ff] to-[#1a6bff]",
  },
  {
    icon: Gauge,
    title: "Real-Time Risk Analytics",
    desc: "Live exposure tracking, dynamic position sizing, Sharpe ratio & profit factor monitoring with neon dashboards",
    tag: "ANALYTICS",
    gradient: "from-[#00ff41] to-[#00d4ff]",
  },
  {
    icon: TrendingUp,
    title: "Multi-Strategy Consensus",
    desc: "ICT/SMC, Momentum, Mean Reversion & Breakout strategies voting on every setup for elite-grade signals",
    tag: "SIGNALS",
    gradient: "from-[#1a6bff] to-[#00d4ff]",
  },
];

const stats = [
  { label: "Avg. Win Rate", value: "68.4%" },
  { label: "Profit Factor", value: "2.14" },
  { label: "Confluence Score", value: "87" },
  { label: "Strategies", value: "6" },
];

const terminalLines = [
  { text: "> INITIALIZING CONFLUENCE ENGINE v5.1...", delay: 0.2 },
  { text: "> LOADING 6-STRATEGY MATRIX...", delay: 0.6 },
  { text: "> MARKET STRUCTURE: ACTIVE", delay: 1.0 },
  { text: "> LIQUIDITY DETECTION: ACTIVE", delay: 1.4 },
  { text: "> ORDER FLOW ANALYSIS: ACTIVE", delay: 1.8 },
  { text: "> SYSTEM STATUS: OPERATIONAL", delay: 2.2 },
];

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");
  const fullText = "WARRIKS AI";
  const [showCursor, setShowCursor] = useState(true);
  const [matrixChars, setMatrixChars] = useState<{ x: number; y: number; char: string; speed: number }[]>([]);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Typing effect for logo
  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [typedText]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Matrix rain effect
  useEffect(() => {
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0101";
    const items = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      char: chars[Math.floor(Math.random() * chars.length)],
      speed: 0.5 + Math.random() * 2,
    }));
    setMatrixChars(items);

    const interval = setInterval(() => {
      setMatrixChars((prev) =>
        prev.map((c) => ({
          ...c,
          y: c.y > 100 ? -5 : c.y + c.speed * 0.3,
          char: Math.random() > 0.95 ? chars[Math.floor(Math.random() * chars.length)] : c.char,
        }))
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#000000] flex flex-col relative overflow-x-hidden"
    >
      {/* Matrix rain background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]">
        {matrixChars.map((c, i) => (
          <span
            key={i}
            className="absolute text-[10px] font-mono text-[#00ff41]"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            {c.char}
          </span>
        ))}
      </div>

      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.015]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.15) 2px, rgba(0,255,65,0.15) 4px)",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff41] opacity-[0.03] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00d4ff] opacity-[0.025] blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="h-12 bg-[#05080e] border-b border-[#1a2332] flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border border-[#00ff41] flex items-center justify-center relative">
              <Zap className="w-3 h-3 text-[#00ff41]" />
              <div className="absolute inset-0 bg-[#00ff41] opacity-[0.06] animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-white tracking-[0.1em]">
              {typedText}
              {showCursor && <span className="text-[#00ff41] ml-0.5">_</span>}
            </span>
            <span className="text-[9px] text-[#00ff41] font-medium tracking-[0.15em] bg-[#00ff41]/10 border border-[#00ff41]/20 px-1.5 py-0.5">
              N.E.O.N.
            </span>
          </div>
          <div className="h-3 w-px bg-[#1a2332]" />
          <span className="text-[10px] text-[#556677]">Confluence Engine v5.1</span>
          <div className="hidden md:flex items-center gap-1.5 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse-glow" />
            <span className="text-[9px] text-[#00ff41]">SYSTEM LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#556677]">Multi-Strategy Execution</span>
          <span className="text-[10px] text-[#00d4ff] font-mono">6 ENGINES</span>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="flex-1 flex flex-col relative z-10"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Status Terminal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-10 max-w-md mx-auto"
            >
              <div className="bg-[#05080e] border border-[#1a2332] p-3 text-left">
                {terminalLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: line.delay, duration: 0.4 }}
                    className="text-[10px] font-mono mb-1"
                  >
                    <span className="text-[#00ff41]">{line.text}</span>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.6, duration: 0.3 }}
                  className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1a2332]"
                >
                  <span className="text-[#00ff41] text-[10px] font-mono">$</span>
                  <span className="text-[10px] font-mono text-white">./launch_terminal</span>
                  <span className="text-[10px] font-mono text-[#556677] animate-pulse">|</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                Institutional-Grade{" "}
                <span className="text-[#00ff41] text-glow-green">
                  AI Trading
                </span>
                <br />
                <span className="text-[#00d4ff]">Confluence</span>{" "}
                <span className="text-white">Engine</span>
              </h1>
              <p className="text-sm md:text-base text-[#556677] max-w-3xl mx-auto leading-relaxed font-light">
                Multi-strategy confluence combining Market Structure, Liquidity Detection,
                Order Flow Analysis, and Session Timing — executing only when every signal
                aligns with institutional precision. <span className="text-[#00ff41]">No noise. Only confluence.</span>
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center gap-4 mb-20"
            >
              <button
                onClick={() => navigate("/auth")}
                className="group h-11 px-8 bg-[#00ff41] text-black text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[#00cc33] hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                LAUNCH TERMINAL
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="group h-11 px-6 bg-transparent text-[#556677] text-xs border border-[#1a2332] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                VIEW DOCS
                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-center justify-center gap-12 md:gap-16 mb-20"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[#556677] tracking-wider mt-1 uppercase">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
            >
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + i * 0.1, duration: 0.4 }}
                    className="bg-[#0a0e14] border border-[#1a2332] p-6 text-left group cursor-default transition-all duration-300 hover:border-[#00ff41]/30 hover:shadow-[0_0_15px_rgba(0,255,65,0.05)]"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-[#0d1b2a] border border-[#1a2332] flex items-center justify-center group-hover:border-[#00ff41]/30 transition-all">
                        <Icon className="w-4 h-4 text-[#00ff41]" />
                      </div>
                      <span className="text-[8px] text-[#556677] uppercase tracking-widest font-medium">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-[11px] text-[#556677] leading-relaxed">{f.desc}</p>
                    <div className={`mt-4 h-px w-0 group-hover:w-full bg-gradient-to-r ${f.gradient} transition-all duration-500`} />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                "≥85 Confluence Score",
                "6/6 Engine Agreement",
                "Killzone Execution",
                "Real-Time Risk",
                "Multi-Timeframe",
                "Liquidity Sweeps",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-[9px] text-[#556677] bg-[#0a0e14] border border-[#1a2332] tracking-wider hover:border-[#00ff41]/20 hover:text-[#00ff41]/60 transition-all"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-10 bg-[#05080e] border-t border-[#1a2332] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#556677] tracking-wider">
              WARRIKS AI N.E.O.N. © 2026
            </span>
            <span className="w-px h-3 bg-[#1a2332]" />
            <span className="text-[9px] text-[#556677]">Confluence Engine v5.1</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#556677]">Status:</span>
            <span className="text-[9px] text-[#00ff41]">Operational</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse-glow" />
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
