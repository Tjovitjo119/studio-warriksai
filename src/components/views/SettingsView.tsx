// ============================================================================
// WARRIKS AI — Settings View
// User preferences, API keys, notification settings, display options
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  Monitor,
  Key,
  Mail,
  Globe,
  Sliders,
  Palette,
  ChevronRight,
  Check,
  Save,
} from "lucide-react";

export default function SettingsView() {
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: "general", icon: User, label: "General" },
    { id: "display", icon: Eye, label: "Display" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "api", icon: Key, label: "API Keys" },
    { id: "risk", icon: Shield, label: "Risk Defaults" },
    { id: "trading", icon: Sliders, label: "Trading" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-10 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-wider">Settings</span>
        </div>
        <button onClick={saveSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-semibold bg-[#06b6d4]/80 text-white hover:bg-[#06b6d4] transition-all">
          {saved ? <><Check className="w-3 h-3" /> Saved</> : <><Save className="w-3 h-3" /> Save Changes</>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[180px] bg-[#0d1520] border-r border-[#1e2d3d] shrink-0 overflow-y-auto pt-2">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] transition-all ${
                  activeSection === sec.id
                    ? "text-[#06b6d4] bg-[#06b6d4]/6 border-l-2 border-l-[#06b6d4]"
                    : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111d2e]/50 border-l-2 border-l-transparent"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
                <ChevronRight className="w-2.5 h-2.5 ml-auto opacity-30" />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === "general" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Profile</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Display Name</label>
                      <input defaultValue="Warriks Trader" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Email</label>
                      <input defaultValue="trader@example.com" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Default Symbol</label>
                    <select className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none">
                      <option>NAS100</option><option>XAUUSD</option><option>EURUSD</option><option>GBPUSD</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Language & Time</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Time Zone</label>
                    <select className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none">
                      <option>UTC</option><option>EST</option><option>GMT</option><option>Local</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Date Format</label>
                    <select className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none">
                      <option>YYYY-MM-DD</option><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "display" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Chart Display</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <span className="text-[10px] text-[#64748b]">Show Volume Bars</span>
                    <div className="w-9 h-4 bg-[#111d2e] border border-[#1e2d3d] cursor-pointer relative">
                      <div className="w-3 h-3 bg-[#06b6d4] absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <span className="text-[10px] text-[#64748b]">Show Grid Lines</span>
                    <div className="w-9 h-4 bg-[#111d2e] border border-[#1e2d3d] cursor-pointer relative">
                      <div className="w-3 h-3 bg-[#06b6d4] absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <span className="text-[10px] text-[#64748b]">Show Premium/Discount Zones</span>
                    <div className="w-9 h-4 bg-[#111d2e] border border-[#1e2d3d] cursor-pointer relative">
                      <div className="w-3 h-3 bg-[#06b6d4] absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Default Timeframe</label>
                    <select className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none">
                      <option>1M</option><option>5M</option><option>15M</option><option>1H</option><option selected>4H</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Color Theme</h3>
                <div className="flex gap-3">
                  {["#080c14", "#111827", "#0f172a", "#1a1a2e"].map((bg) => (
                    <button key={bg} className="w-8 h-8 border-2 border-[#1e2d3d] hover:border-[#06b6d4] transition-all" style={{ background: bg }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Alert Preferences</h3>
                <div className="space-y-3">
                  {[
                    "New trade signal detected",
                    "Stop loss hit notification",
                    "Take profit target reached",
                    "Killzone session start",
                    "High-impact news event",
                    "Daily drawdown limit reached",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50 last:border-0">
                      <span className="text-[10px] text-[#64748b]">{item}</span>
                      <div className={`w-9 h-4 ${i < 4 ? "bg-[#06b6d4]/80" : "bg-[#111d2e]"} border border-[#1e2d3d] cursor-pointer relative`}>
                        <div className={`w-3 h-3 ${i < 4 ? "bg-white" : "bg-[#475569]"} absolute top-0.5 ${i < 4 ? "right-0.5" : "left-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Sound Alerts</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[10px] text-[#64748b]">Enable Sound Notifications</span>
                  <div className="w-9 h-4 bg-[#06b6d4]/80 border border-[#1e2d3d] cursor-pointer relative">
                    <div className="w-3 h-3 bg-white absolute top-0.5 right-0.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">API Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Twelve Data API Key</label>
                    <div className="flex gap-2">
                      <input type="password" defaultValue="••••••••••••••••" className="flex-1 bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30 font-mono" />
                      <button className="px-2 py-1 text-[8px] text-[#64748b] border border-[#1e2d3d] hover:border-[#06b6d4]/30">Test</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Webhook URL</label>
                    <input type="url" defaultValue="https://hooks.example.com/warriks" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                  </div>
                  <div className="text-[8px] text-[#475569] mt-2">
                    API keys are stored securely. Never share your API keys with anyone.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "risk" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Risk Defaults</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Default Risk %</label>
                    <input type="number" defaultValue="1.5" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Max Positions</label>
                    <input type="number" defaultValue="5" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Daily Loss Limit $</label>
                    <input type="number" defaultValue="500" className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none focus:border-[#06b6d4]/30" />
                  </div>
                  <div>
                    <label className="text-[8px] text-[#64748b] uppercase mb-1 block">Max Leverage</label>
                    <select className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 outline-none">
                      <option>1:1</option><option selected>1:10</option><option>1:20</option><option>1:50</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "trading" && (
            <div className="max-w-xl space-y-4">
              <div className="glass-card rounded-sm p-4">
                <h3 className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider mb-3">Trading Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <div>
                      <span className="text-[10px] text-[#64748b]">Auto-execute high-confluence signals</span>
                      <div className="text-[8px] text-[#475569]">≥ 85 confluence, 4/4 engine agreement</div>
                    </div>
                    <div className="w-9 h-4 bg-[#111d2e] border border-[#1e2d3d] cursor-pointer relative">
                      <div className="w-3 h-3 bg-[#475569] absolute top-0.5 left-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <div>
                      <span className="text-[10px] text-[#64748b]">Confirm before each trade</span>
                      <div className="text-[8px] text-[#475569]">Manual confirmation required</div>
                    </div>
                    <div className="w-9 h-4 bg-[#06b6d4]/80 border border-[#1e2d3d] cursor-pointer relative">
                      <div className="w-3 h-3 bg-white absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d]/50">
                    <div>
                      <span className="text-[10px] text-[#64748b]">Default Slippage Tolerance</span>
                    </div>
                    <select className="bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1 outline-none">
                      <option>0.1%</option><option selected>0.5%</option><option>1.0%</option><option>2.0%</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
