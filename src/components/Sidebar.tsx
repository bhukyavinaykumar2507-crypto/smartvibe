import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Clock, 
  BrainCircuit, 
  FileText, 
  Settings, 
  Radio, 
  Cpu, 
  X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mode: 'demo' | 'live';
  onOpenSettings: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mode,
  onOpenSettings,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Activity },
    { id: 'history', label: 'Machine History', icon: Clock },
    { id: 'ai-analysis', label: 'AI Analysis', icon: BrainCircuit },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-800/80 bg-[#090e18] p-4 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {/* Cyan Vibration Waveform Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <svg className="h-6 w-6 stroke-cyan-400" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h3l2-7 4 14 3-9 2 4h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold tracking-tight text-white font-sans">
                    Smart<span className="text-cyan-400">Vibe</span>
                  </span>
                </div>
                <p className="text-[9.5px] font-medium tracking-tight text-slate-400 whitespace-nowrap">
                  Monitor • Analyze • Keep It Running
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            {mobileOpen && (
              <button 
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600/90 text-white font-semibold shadow-md shadow-cyan-950/50'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Demo / Live Mode Box */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-3.5 shadow-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${mode === 'demo' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span className="text-xs font-bold text-emerald-400">
                {mode === 'demo' ? 'Demo Mode' : 'Live Sensor Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {mode === 'demo' ? 'Showing sample data' : 'Streaming from ESP32'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight pt-1">
              {mode === 'demo' ? 'Connect your ESP32 to see real-time sensor data.' : 'Active telemetry ingestion.'}
            </p>
            <button
              onClick={onOpenSettings}
              className="mt-1 w-full text-left text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Configure Mode →
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
