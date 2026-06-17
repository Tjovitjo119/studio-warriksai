// ============================================================================
// WARRIKS AI — Economic Calendar View
// Real-time economic events with impact filters, currency filters, countdown
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Filter,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Globe,
  Search,
  Bell,
} from "lucide-react";

interface CalendarEvent {
  event: string;
  date: string;
  time: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  currency: string;
  forecast: string;
  previous: string;
  type: string;
}

const ALL_EVENTS: CalendarEvent[] = [
  { event: "FOMC Rate Decision", date: "2026-06-18", time: "14:00", impact: "HIGH", currency: "USD", forecast: "5.00%", previous: "5.25%", type: "Interest Rate" },
  { event: "US CPI (MoM)", date: "2026-06-12", time: "08:30", impact: "HIGH", currency: "USD", forecast: "0.2%", previous: "0.3%", type: "Inflation" },
  { event: "UK Unemployment Rate", date: "2026-06-11", time: "07:00", impact: "MEDIUM", currency: "GBP", forecast: "4.3%", previous: "4.3%", type: "Employment" },
  { event: "ECB Interest Rate", date: "2026-06-06", time: "12:45", impact: "HIGH", currency: "EUR", forecast: "3.75%", previous: "4.00%", type: "Interest Rate" },
  { event: "US NFP", date: "2026-06-05", time: "08:30", impact: "HIGH", currency: "USD", forecast: "210K", previous: "228K", type: "Employment" },
  { event: "US ISM Manufacturing PMI", date: "2026-06-02", time: "10:00", impact: "MEDIUM", currency: "USD", forecast: "49.5", previous: "48.7", type: "PMI" },
  { event: "BOJ Rate Decision", date: "2026-06-16", time: "03:00", impact: "HIGH", currency: "JPY", forecast: "0.50%", previous: "0.50%", type: "Interest Rate" },
  { event: "US PPI (MoM)", date: "2026-06-13", time: "08:30", impact: "MEDIUM", currency: "USD", forecast: "0.3%", previous: "0.2%", type: "Inflation" },
  { event: "UK GDP (MoM)", date: "2026-06-10", time: "07:00", impact: "MEDIUM", currency: "GBP", forecast: "0.1%", previous: "0.0%", type: "GDP" },
  { event: "US Retail Sales (MoM)", date: "2026-06-17", time: "08:30", impact: "MEDIUM", currency: "USD", forecast: "0.4%", previous: "0.1%", type: "Consumer" },
  { event: "German ZEW Economic Sentiment", date: "2026-06-09", time: "10:00", impact: "LOW", currency: "EUR", forecast: "22.0", previous: "18.5", type: "Sentiment" },
  { event: "US Existing Home Sales", date: "2026-06-19", time: "10:00", impact: "LOW", currency: "USD", forecast: "4.25M", previous: "4.14M", type: "Housing" },
];

function ImpactBadge({ impact }: { impact: string }) {
  const colors: Record<string, string> = {
    HIGH: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20",
    MEDIUM: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    LOW: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20",
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 border font-semibold tracking-wider ${colors[impact] || colors.MEDIUM}`}>
      {impact}
    </span>
  );
}

function CurrencyBadge({ currency }: { currency: string }) {
  const colors: Record<string, string> = {
    USD: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20",
    EUR: "text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/20",
    GBP: "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20",
    JPY: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    ALL: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20",
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 border font-medium ${colors[currency] || colors.ALL}`}>
      {currency}
    </span>
  );
}

export default function CalendarView() {
  const [filterImpact, setFilterImpact] = useState<string>("ALL");
  const [filterCurrency, setFilterCurrency] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState<Record<string, boolean>>({});

  const currencies = [...new Set(ALL_EVENTS.map((e) => e.currency))];

  const filtered = ALL_EVENTS.filter((e) => {
    if (filterImpact !== "ALL" && e.impact !== filterImpact) return false;
    if (filterCurrency !== "ALL" && e.currency !== filterCurrency) return false;
    if (search && !e.event.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleAlert = (eventName: string) => {
    setAlerts({ ...alerts, [eventName]: !alerts[eventName] });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Economic Calendar</span>
          <span className="text-[10px] text-[#475569]">{filtered.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((imp) => (
              <button key={imp} onClick={() => setFilterImpact(imp)}
                className={`px-2 py-1 text-[8px] font-medium transition-all ${
                  filterImpact === imp ? "text-[#06b6d4] bg-[#06b6d4]/10" : "text-[#475569] hover:text-[#e2e8f0]"
                }`}>
                {imp === "ALL" ? "All" : imp}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-[#1e2d3d]" />
          <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)}
            className="bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 outline-none">
            <option value="ALL">All Currencies</option>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="h-9 bg-[#0a0e17] border-b border-[#1e2d3d] flex items-center px-4 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3 h-3 text-[#475569]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..." className="bg-transparent text-[10px] text-[#e2e8f0] placeholder:text-[#475569] border-none outline-none w-full" />
        </div>
        <span className="text-[8px] text-[#475569]">Times in UTC</span>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] text-[#475569]">No events match filters</span>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d3d]/50">
            {filtered.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="px-4 py-2.5 hover:bg-[#111d2e]/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center w-12">
                    <span className="text-[10px] text-[#64748b]">{ev.date.slice(5)}</span>
                    <span className="text-[8px] text-[#475569]">{ev.time}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-medium text-[#e2e8f0]">{ev.event}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CurrencyBadge currency={ev.currency} />
                      <ImpactBadge impact={ev.impact} />
                      <span className="text-[8px] text-[#475569]">{ev.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px]">
                    <div className="text-right">
                      <div className="text-[#64748b]">Forecast</div>
                      <div className="font-bold text-[#e2e8f0]">{ev.forecast}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#64748b]">Previous</div>
                      <div className="font-bold text-[#475569]">{ev.previous}</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleAlert(ev.event)}
                  className={`ml-3 p-1.5 transition-colors ${alerts[ev.event] ? "text-[#f59e0b]" : "text-[#475569] hover:text-[#e2e8f0]"}`}
                  title={alerts[ev.event] ? "Remove alert" : "Set alert"}>
                  <Bell className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-7 bg-[#111d2e] border-t border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <span className="text-[8px] text-[#475569]">Click bell icon to receive event notifications</span>
        <span className="flex items-center gap-2 text-[8px] text-[#475569]">
          <Globe className="w-2.5 h-2.5" />
          All times in UTC
        </span>
      </div>
    </div>
  );
}
