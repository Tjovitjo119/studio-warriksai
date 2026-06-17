// ============================================================================
// WARRIKS AI — Studio Edition Landing Page
// Gallery-clean, warm editorial aesthetic with thin framing and refined spacing
// ============================================================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router";
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
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Multi-Strategy AI Engine",
    desc: "Market Structure, Liquidity, Order Flow & Session analysis fused into a single confluence score",
    tag: "Core Engine",
  },
  {
    icon: LineChart,
    title: "Institutional Charting",
    desc: "Professional-grade canvas rendering with FVG, OB, MSS, liquidity zones & multi-timeframe",
    tag: "Visualization",
  },
  {
    icon: Gauge,
    title: "Real-Time Risk Analytics",
    desc: "Live exposure tracking, dynamic position sizing, Sharpe ratio & profit factor monitoring",
    tag: "Analytics",
  },
  {
    icon: TrendingUp,
    title: "Multi-Strategy Consensus",
    desc: "ICT/SMC, Momentum, Mean Reversion & Breakout strategies voting on every setup",
    tag: "Signals",
  },
];

const stats = [
  { label: "Avg. Win Rate", value: "68.4%" },
  { label: "Profit Factor", value: "2.14" },
  { label: "Confluence Score", value: "87" },
  { label: "Strategies", value: "4" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f6f2] flex flex-col">
      {/* Top Bar — Studio thin bar */}
      <div className="h-10 bg-white border-b border-[#e0dad0] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border border-[#2c2822] flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#2c2822]" />
            </div>
            <span className="text-sm font-semibold text-[#2c2822] tracking-[0.1em]">
              WARRIKS
            </span>
            <span className="text-[9px] text-[#8a8070] font-medium tracking-[0.15em] bg-[#f0ece6] px-1.5 py-0.5">
              STUDIO
            </span>
          </div>
          <div className="h-3 w-px bg-[#e0dad0]" />
          <span className="text-[10px] text-[#8a8070]">Confluence Engine v5.1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#b5ab9c]">Multi-Strategy Execution</span>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e0dad0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7a9e7a]" />
                <span className="text-[9px] text-[#7a9e7a] font-medium tracking-wider uppercase">
                  System Operational
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#2c2822] tracking-tight leading-[1.15] mb-5">
                Institutional-Grade{" "}
                <span className="italic text-[#7a7163]">
                  AI Trading
                </span>
                <br />
                Confluence Engine
              </h1>
              <p className="text-sm md:text-base text-[#8a8070] max-w-2xl mx-auto leading-relaxed">
                Multi-strategy confluence combining Market Structure, Liquidity Detection,
                Order Flow Analysis, and Session Timing — executing only when every signal
                aligns with institutional precision.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center justify-center gap-3 mb-16"
            >
              <button
                onClick={() => navigate("/auth")}
                className="group h-10 px-6 bg-[#2c2822] text-[#f8f6f2] text-xs font-semibold tracking-wider transition-all duration-300 hover:bg-[#3e3830] flex items-center gap-2"
              >
                LAUNCH TERMINAL
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button className="group h-10 px-5 bg-transparent text-[#8a8070] text-xs border border-[#e0dad0] hover:border-[#d4cdc2] hover:text-[#2c2822] transition-all flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                VIEW DOCUMENTATION
                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex items-center justify-center gap-8 mb-16"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-semibold text-[#2c2822] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[#8a8070] tracking-wider mt-0.5 uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="bg-white border border-[#e0dad0] p-5 text-left group cursor-default transition-all hover:border-[#ccc4b8]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-[#7a7163]" />
                      <span className="text-[8px] text-[#b5ab9c] uppercase tracking-widest font-medium">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-[#2c2822] mb-2">{f.title}</h3>
                    <p className="text-[10px] text-[#8a8070] leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
            >
              {[
                "≥85 Confluence Score",
                "4/4 Engine Agreement",
                "Killzone Execution",
                "Real-Time Risk Management",
                "Multi-Timeframe Analysis",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[9px] text-[#8a8070] bg-white border border-[#e0dad0] tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-9 bg-white border-t border-[#e0dad0] flex items-center justify-between px-6">
          <span className="text-[9px] text-[#b5ab9c] tracking-wider">
            WARRIKS AI STUDIO © 2026 • Confluence Engine v5.1
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#b5ab9c]">Status: Operational</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7a9e7a]" />
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
