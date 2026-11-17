import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ChevronDown, 
  Bell, 
  User, 
  Menu, 
  Check, 
  Cloud 
} from 'lucide-react';
import type { AlertItem } from '../types/telemetry';
import type { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  currentMachineId: string;
  onSelectMachine: (machineId: string) => void;
  deviceStatus: 'online' | 'offline';
  lastUpdated: string;
  alerts: AlertItem[];
  onOpenAlerts: () => void;
  onToggleMobileMenu: () => void;
  mode: 'demo' | 'live';
  isStreaming?: boolean;
  googleUser?: FirebaseUser | null;
  onOpenGoogleDrive: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMachineId,
  onSelectMachine,
  deviceStatus,
  lastUpdated,
  alerts,
  onOpenAlerts,
  onToggleMobileMenu,
  mode,
  isStreaming = true,
  googleUser,
  onOpenGoogleDrive,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (mode !== 'live') return;
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [mode]);

  const machines = [
    { id: 'machine_01', name: 'Machine 01', type: 'CNC Spindle Motor' },
    { id: 'machine_02', name: 'Machine 02', type: 'Centrifugal Slurry Pump' },
    { id: 'machine_03', name: 'Machine 03', type: 'Industrial Blower' },
  ];

  const activeMachine = machines.find(m => m.id === currentMachineId) || machines[0];

  const parsedTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;
  const isStale = mode === 'live' && (!parsedTime || nowMs - parsedTime > 15000 || !isStreaming);

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : 'Awaiting telemetry';

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#070b14]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      
      {/* Left Area: Mobile Menu + Machine Selector + Connection State + Last Updated */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Machine Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0d1424] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            <Cpu className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{activeMachine.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-700 bg-[#0d1424] p-1.5 shadow-xl z-50 sv-tab-enter">
              {machines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMachine(m.id);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    m.id === currentMachineId ? 'bg-cyan-950/80 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.type}</p>
                  </div>
                  {m.id === currentMachineId && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connection Status Indicator: Strictly reflects live hardware state & packet freshness */}
        <div className="flex items-center shrink-0">
          {mode === 'demo' ? (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 whitespace-nowrap">
              <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? 'bg-cyan-400' : 'bg-slate-400'}`} />
              <span className="font-mono">{isStreaming ? 'Demo (Simulated)' : 'Demo (Paused)'}</span>
            </span>
          ) : deviceStatus === 'online' && !isStale ? (
            <span className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-semibold border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 whitespace-nowrap">
              <span className="relative flex h-2 w-2">
                <span className="sv-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono tracking-wide">LIVE · ESP32</span>
            </span>
          ) : deviceStatus === 'online' && isStale ? (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border border-amber-500/40 bg-amber-950/40 text-amber-300 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="font-mono">{!isStreaming ? 'Stream Paused' : 'Stale Data (>15s)'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border border-rose-500/35 bg-rose-950/40 text-rose-300 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="font-mono">ESP32 Offline</span>
            </span>
          )}
        </div>

        {/* Last data update timestamp */}
        <div className="hidden md:flex items-center text-xs font-mono text-slate-400 tabular-nums whitespace-nowrap">
          <span>Updated: {formattedDate}, {formattedTime}</span>
        </div>
      </div>

      {/* Right Area: Google Drive Button + Alerts Bell + Student Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Google Drive Status Button */}
        <button
          onClick={onOpenGoogleDrive}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            googleUser
              ? 'border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40'
              : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title={googleUser ? `Google Drive Connected: ${googleUser.email}` : 'Connect Google Drive'}
        >
          <Cloud className={`h-3.5 w-3.5 ${googleUser ? 'text-blue-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">
            {googleUser ? 'Drive Synced' : 'Google Drive'}
          </span>
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenAlerts}
          aria-label="Active Alerts"
          className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
          title="Active Alerts"
        >
          <Bell className="h-4.5 w-4.5" />
          {unacknowledgedAlerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm font-mono tabular-nums">
              {Math.min(9, unacknowledgedAlerts.length)}
            </span>
          )}
        </button>

        {/* User Profile Area */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 overflow-hidden shrink-0">
            {googleUser?.photoURL ? (
              <img src={googleUser.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-100 leading-tight whitespace-nowrap">
              {googleUser?.displayName || 'Vinay Kumar'}
            </p>
            <p className="text-[10px] font-medium text-slate-400 leading-tight whitespace-nowrap">
              {googleUser ? 'Workspace Synced' : 'Project Student'}
            </p>
          </div>
        </div>

      </div>

    </header>
  );
};
