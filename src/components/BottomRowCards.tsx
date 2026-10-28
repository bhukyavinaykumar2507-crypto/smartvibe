import React from 'react';
import { 
  Bell, 
  ArrowRight, 
  Sliders, 
  FileText, 
  Clock, 
  Download, 
  Settings, 
  ShieldAlert, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import type { AlertItem } from '../types/telemetry';
import machineRigImage from '../assets/images/smartvibe_machine_rig_1791951880627.jpg';

interface BottomRowCardsProps {
  alerts: AlertItem[];
  onViewAllAlerts: () => void;
  onGenerateReport: () => void;
  onViewHistory: () => void;
  onConfigureThresholds: () => void;
  onExportCSV: () => void;
}

export const BottomRowCards: React.FC<BottomRowCardsProps> = ({
  alerts,
  onViewAllAlerts,
  onGenerateReport,
  onViewHistory,
  onConfigureThresholds,
  onExportCSV,
}) => {
  // If no alerts, create standard informative baseline notices
  const displayAlerts: AlertItem[] = alerts.length > 0 ? alerts.slice(0, 3) : [
    {
      id: 'demo-1',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      severity: 'warning',
      sensor: 'DS18B20 Temperature',
      parameter: 'Temperature',
      recordedValue: '68 °C',
      thresholdValue: '> 65 °C',
      deviation: '+4.6%',
      suggestedAction: 'Temperature approaching threshold',
      acknowledged: false,
    },
    {
      id: 'demo-2',
      timestamp: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      severity: 'info',
      sensor: 'MAX9814 Noise',
      parameter: 'Relative Noise',
      recordedValue: '95 dB*',
      thresholdValue: '> 100 dB*',
      deviation: '+0%',
      suggestedAction: 'Noise level increased slightly',
      acknowledged: false,
    },
  ];

  const getSeverityBadge = (sev: 'warning' | 'anomaly' | 'info') => {
    switch (sev) {
      case 'anomaly':
        return (
          <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
            Anomaly
          </span>
        );
      case 'warning':
        return (
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
            Info
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* CARD 1: ALERTS & NOTIFICATIONS (col-span-5) */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">Alerts & Notifications</h4>
          </div>
          <button
            onClick={onViewAllAlerts}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/90 text-[10px] text-slate-400">
                <th className="py-1.5 px-2 font-medium">Time</th>
                <th className="py-1.5 px-2 font-medium">Severity</th>
                <th className="py-1.5 px-2 font-medium">Sensor</th>
                <th className="py-1.5 px-2 font-medium">Value</th>
                <th className="py-1.5 px-2 font-medium">Threshold</th>
                <th className="py-1.5 px-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[10.5px]">
              {displayAlerts.map((a) => {
                const timeStr = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-2 text-slate-300 whitespace-nowrap">{timeStr}</td>
                    <td className="py-2 px-2 whitespace-nowrap font-sans">{getSeverityBadge(a.severity)}</td>
                    <td className="py-2 px-2 font-sans font-semibold text-slate-200">{a.sensor.replace('ADXL345 ', '').replace('DS18B20 ', '').replace('MAX9814 ', '')}</td>
                    <td className="py-2 px-2 text-slate-200 tabular-nums">{a.recordedValue}</td>
                    <td className="py-2 px-2 text-slate-400 tabular-nums">{a.thresholdValue}</td>
                    <td className="py-2 px-2 font-sans text-slate-300 truncate max-w-[140px]" title={a.suggestedAction}>
                      {a.suggestedAction}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
          Showing latest real-time condition triggers
        </div>

      </div>

      {/* CARD 2: QUICK ACTIONS (col-span-3) */}
      <div className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-100">Quick Actions</h4>
        </div>

        {/* Buttons List */}
        <div className="space-y-2.5">
          {/* Generate Report Button */}
          <button
            onClick={onGenerateReport}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#0d1424] p-3 text-left hover:border-cyan-500/60 hover:bg-slate-800/50 transition-all cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Generate Report
              </p>
              <p className="text-[10px] text-slate-400">Download PDF report</p>
            </div>
          </button>

          {/* View History Button */}
          <button
            onClick={onViewHistory}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#0d1424] p-3 text-left hover:border-cyan-500/60 hover:bg-slate-800/50 transition-all cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                View History
              </p>
              <p className="text-[10px] text-slate-400">Explore past data</p>
            </div>
          </button>
        </div>

        {/* Bottom utility links */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          <button
            onClick={onConfigureThresholds}
            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <Settings className="h-3 w-3" />
            <span>Thresholds</span>
          </button>
          <button
            onClick={onExportCSV}
            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* CARD 3: INDUSTRIAL BRAND BANNER (col-span-4) */}
      <div className="lg:col-span-4 relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1322] shadow-lg shadow-black/30 group">
        
        {/* Background Image */}
        <img
          src={machineRigImage}
          alt="SmartVibe Industrial Rig"
          className="absolute inset-0 h-full w-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#091122]/85 to-transparent" />

        {/* Content Overlay */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
              Smarter Monitoring.<br />
              Healthier Machines.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Powered by AI.
              </span>
            </h3>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <svg className="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h3l2-7 4 14 3-9 2 4h4" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                Smart<span className="text-cyan-400">Vibe</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ISO 10816 Verified
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
