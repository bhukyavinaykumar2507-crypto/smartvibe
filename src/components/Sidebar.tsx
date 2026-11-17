import React from 'react';
import {
  LayoutDashboard,
  Activity,
  History,
  Brain,
  FileText,
  Settings,
  Cpu,
  Cloud,
  Waves,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'live'
  | 'history'
  | 'ai'
  | 'reports'
  | 'drive'
  | 'hardware'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  mode: 'demo' | 'live';
  deviceStatus: 'online' | 'offline';
  onSwitchMode: (mode: 'demo' | 'live') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  mode,
  deviceStatus,
  onSwitchMode,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { id: 'live', label: 'Live Monitoring', icon: <Activity className="h-4.5 w-4.5" /> },
    { id: 'history', label: 'Machine History', icon: <History className="h-4.5 w-4.5" /> },
    { id: 'ai', label: 'AI Analysis', icon: <Brain className="h-4.5 w-4.5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-4.5 w-4.5" /> },
    { id: 'drive', label: 'Google Drive', icon: <Cloud className="h-4.5 w-4.5" /> },
    { id: 'hardware', label: 'ESP32 Setup', icon: <Cpu className="h-4.5 w-4.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
  ];

  const handleSelect = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-800/80 bg-[#070b14] p-4">
      <div>
        {/* Brand Logo & Tagline */}
        <div className="flex items-center justify-between pb-5 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.2)]">
              <Waves className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                SmartVibe
              </span>
              <span className="text-[10px] font-medium text-cyan-400/90 tracking-wide block mt-1">
                Monitor • Analyze • Keep It Running
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/5 text-cyan-300 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mode Indicator Card at Bottom */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0b1322] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                mode === 'live'
                  ? deviceStatus === 'online'
                    ? 'bg-emerald-400'
                    : 'bg-rose-500'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="text-xs font-bold text-white">
              {mode === 'live' ? 'Live ESP32 Mode' : 'Demo Mode'}
            </span>
          </div>
          <button
            onClick={() => onSwitchMode(mode === 'demo' ? 'live' : 'demo')}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
          >
            Switch
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {mode === 'live'
            ? deviceStatus === 'online'
              ? 'Receiving real-time ADXL345 & MAX9814 telemetry.'
              : 'Waiting for ESP32 HTTP packets on /api/telemetry.'
            : 'Showing simulated 2-sensor telemetry. Connect your ESP32 to stream live data.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
