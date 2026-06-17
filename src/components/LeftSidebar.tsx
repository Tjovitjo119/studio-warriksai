// ============================================================================
// WARRIKS AI — N.E.O.N. Left Sidebar
// Dark depths, neon green active states, cyan accents
// ============================================================================

import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  Zap,
  BarChart3,
  RefreshCcw,
  Shield,
  Activity,
  Calendar,
  Newspaper,
  BookOpen,
  GitBranch,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: TrendingUp, label: "Markets", id: "markets" },
  { icon: Star, label: "Watchlist", id: "watchlist" },
  { icon: Zap, label: "AI Signals", id: "signals" },
  { icon: BarChart3, label: "Multi-Chart", id: "multichart" },
  { icon: RefreshCcw, label: "Backtesting", id: "backtesting" },
  { icon: Shield, label: "Risk Manager", id: "risk" },
  { icon: Activity, label: "Performance", id: "performance" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: Newspaper, label: "News", id: "news" },
  { icon: BookOpen, label: "Journal", id: "journal" },
  { icon: GitBranch, label: "Strategy Builder", id: "strategy" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface LeftSidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

export default function LeftSidebar({ activeNav, onNavChange }: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-full flex flex-col bg-[#05080e] border-r border-[#1a2332] transition-all duration-200 shrink-0 ${
      collapsed ? "w-[42px]" : "w-[180px]"
    }`}>
      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all border-l-2 ${
                isActive
                  ? "text-white bg-[#00ff41]/5 border-l-[#00ff41]"
                  : "text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/[0.03] border-l-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#00ff41]" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-[#1a2332] my-1" />

      {/* Engine Status */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="text-[8px] text-[#556677] tracking-[0.1em] mb-2 uppercase font-medium">
            Engine Status
          </div>
          {[
            { name: "Structure Engine", status: "online" },
            { name: "Liquidity Engine", status: "online" },
            { name: "FVG Engine", status: "online" },
            { name: "MSS Engine", status: "online" },
            { name: "Probability Engine", status: "online" },
          ].map((engine) => (
            <div key={engine.name} className="flex items-center justify-between py-0.5">
              <span className="text-[9px] text-[#556677]">{engine.name}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                engine.status === "online" ? "bg-[#00ff41] shadow-[0_0_6px_rgba(0,255,65,0.5)]" : "bg-[#556677]"
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full py-2 border-t border-[#1a2332] flex items-center justify-center text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
