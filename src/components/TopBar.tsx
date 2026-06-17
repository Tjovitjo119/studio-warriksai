// ============================================================================
// WARRIKS AI — N.E.O.N. Top Bar
// Black background, lime green & cyan accents, white text
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Zap,
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  LogOut,
  RefreshCw,
  Timer,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { MarketData } from "@/engine/types";

interface TopBarProps {
  markets: MarketData[];
  dataSource: "live" | "synthetic";
  onRefresh: () => void;
  refreshing: boolean;
}

function MiniPriceCard({ market }: { market: MarketData }) {
  const isUp = market.change >= 0;
  const prevPrice = useRef(market.price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (market.price > prevPrice.current) setFlash("up");
    else if (market.price < prevPrice.current) setFlash("down");
    prevPrice.current = market.price;
    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [market.price]);

  return (
    <div className={`flex items-center gap-2 px-2 py-1 border-r border-[#1a2332] last:border-r-0 ${
      flash === "up" ? "bg-[#00ff41]/5" : flash === "down" ? "bg-[#ff3355]/5" : ""
    }`}>
      <span className="text-[10px] font-medium text-[#556677] min-w-[48px]">{market.symbol}</span>
      <span className={`text-[11px] font-medium text-white min-w-[55px] text-right`}>
        {market.price.toFixed(market.symbol === "NAS100" || market.symbol === "XAUUSD" ? 1 : 4)}
      </span>
      <span className={`text-[9px] ${isUp ? "text-[#00ff41]" : "text-[#ff3355]"} min-w-[44px] text-right`}>
        {isUp ? "+" : ""}{market.changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

export default function TopBar({ markets, dataSource, onRefresh, refreshing }: TopBarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const utcTime = currentTime.toUTCString().slice(17, 25);
  const localTime = currentTime.toLocaleTimeString("en-US", { hour12: false });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="h-11 bg-[#05080e] border-b border-[#1a2332] flex items-center justify-between px-3 shrink-0 z-20">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#1a2332]">
          <div className="w-5 h-5 border border-[#00ff41] flex items-center justify-center">
            <Zap className="w-3 h-3 text-[#00ff41]" />
          </div>
          <span className="text-[11px] font-semibold text-white tracking-[0.08em]">WARRIKS</span>
          <span className="text-[8px] text-[#00ff41] font-medium bg-[#00ff41]/10 border border-[#00ff41]/20 px-1">
            N.E.O.N.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-[#556677] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse-glow" />
            Engine Live
          </span>
          <span className="w-px h-3 bg-[#1a2332]" />
          <div className="flex items-center gap-1.5 text-[#556677]">
            <Timer className="w-3 h-3" />
            <span>{localTime}</span>
            <span className="text-[#445566]">/</span>
            <span className="text-[#445566]">{utcTime}</span>
          </div>
        </div>
      </div>

      {/* Center: Mini price cards */}
      <div className="flex items-center h-full">
        {markets.slice(0, 6).map((market) => (
          <MiniPriceCard key={market.symbol} market={market} />
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <div className={`flex items-center gap-1.5 px-2 py-1 text-[9px] border border-[#1a2332] mr-1 ${
          dataSource === "live" ? "text-[#00ff41]" : "text-[#ffaa00]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dataSource === "live" ? "bg-[#00ff41]" : "bg-[#ffaa00]"}`} />
          <span>{dataSource === "live" ? "LIVE FEED" : "SYNTHETIC"}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>

        <button className="p-1.5 text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors">
          <Search className="w-3.5 h-3.5" />
        </button>

        <button className="p-1.5 text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff3355]" />
        </button>

        <button className="p-1.5 text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors">
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 px-2 py-1 ml-1 border-l border-[#1a2332] hover:bg-[#00ff41]/5 transition-colors"
          >
            <div className="w-5 h-5 bg-[#0d1b2a] border border-[#1a2332] flex items-center justify-center">
              <User className="w-3 h-3 text-[#00ff41]" />
            </div>
            <span className="text-[10px] text-[#556677] max-w-[80px] truncate">
              {user?.name || user?.email || "Trader"}
            </span>
            <ChevronDown className="w-3 h-3 text-[#556677]" />
          </button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 w-48 bg-[#0a0e14] border border-[#1a2332] z-50"
            >
              <div className="px-3 py-2 border-b border-[#1a2332]">
                <div className="text-[11px] font-medium text-white">{user?.name || "Trader"}</div>
                <div className="text-[9px] text-[#556677]">{user?.email || ""}</div>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); navigate("/dashboard"); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => { setShowUserMenu(false); navigate("/"); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-[#556677] hover:text-[#00ff41] hover:bg-[#00ff41]/5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Landing
              </button>
              <div className="border-t border-[#1a2332]" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-[#ff3355] hover:text-[#ff3355] hover:bg-[#ff3355]/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
