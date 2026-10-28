import React, { useState } from 'react';
import { 
  Cpu, 
  ChevronDown, 
  Bell, 
  User, 
  Menu, 
  Check, 
  ShieldAlert, 
  AlertTriangle,
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
  googleUser,
  onOpenGoogleDrive,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const machines = [
    { id: 'machine_01', name: 'Machine 01', type: 'CNC Spindle Motor' },
    { id: 'machine_02', name: 'Machine 02', type: 'Centrifugal Slurry Pump' },
    { id: 'machine_03', name: 'Machine 03', type: 'Industrial Blower' },
  ];

  const activeMachine = machines.find(m => m.id === currentMachineId) || machines[0];

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '14 Apr 2025';

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '10:24:36 AM';

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#070b14]/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      
      {/* Left Area: Mobile Menu + Machine Selector + Online Pill + Last Updated */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Machine Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0d1424] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:border-slate-600 transition-colors"
          >
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>{activeMachine.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-700 bg-[#0d1424] p-1.5 shadow-xl z-50">
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

        {/* Connection Status Badge: Never show Online unless valid packets received from live hardware */}
        <div className="flex items-center">
          {mode === 'demo' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span className="font-mono">Demo (Simulated)</span>
            </span>
          ) : deviceStatus === 'online' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">ESP32 Online</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-rose-500/30 bg-rose-950/40 text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="font-mono">ESP32 Offline</span>
            </span>
          )}
        </div>

        {/* Last data update timestamp */}
        <div className="hidden md:flex items-center text-xs font-mono text-slate-400">
          <span>Last updated: {formattedDate}, {formattedTime}</span>
        </div>
      </div>

      {/* Right Area: Google Drive Button + Alerts Bell + Student Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Google Drive Status Button */}
        <button
          onClick={onOpenGoogleDrive}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
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
          className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
          title="Active Alerts"
        >
          <Bell className="h-4.5 w-4.5" />
          {unacknowledgedAlerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm font-mono">
              {Math.min(9, unacknowledgedAlerts.length)}
            </span>
          )}
        </button>

        {/* User Profile Area */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 overflow-hidden">
            {googleUser?.photoURL ? (
              <img src={googleUser.photoURL} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-100 leading-tight">
              {googleUser?.displayName || 'Vinay Kumar'}
            </p>
            <p className="text-[10px] font-medium text-slate-400 leading-tight">
              {googleUser ? 'Workspace Synced' : 'Project Student'}
            </p>
          </div>
        </div>

      </div>

    </header>
  );
};
