import React from 'react';
import { Bell, FileText, History, ArrowRight, Activity } from 'lucide-react';
import type { AlertItem } from '../types/telemetry';
import machineRigImage from '../assets/images/smartvibe_machine_rig_1794927624474.jpg';

interface BottomRowCardsProps {
  alerts: AlertItem[];
  onViewAllAlerts: () => void;
  onGenerateReport: () => void;
  onViewHistory: () => void;
}

export const BottomRowCards: React.FC<BottomRowCardsProps> = ({
  alerts,
  onViewAllAlerts,
  onGenerateReport,
  onViewHistory,
}) => {
  const recentAlerts = alerts.slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sv-enter-d3">
      {/* 1. ALERTS & NOTIFICATIONS PREVIEW (5 cols) */}
      <div className="sv-card sv-card-neutral lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-100">Alerts & Notifications</h4>
            </div>
            <button
              onClick={onViewAllAlerts}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-1.5 pr-2">Time</th>
                  <th className="py-1.5 px-2">Severity</th>
                  <th className="py-1.5 px-2">Sensor</th>
                  <th className="py-1.5 px-2">Value</th>
                  <th className="py-1.5 pl-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px] font-mono">
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                      No active anomalies — all ADXL345 & MAX9814 readings nominal
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-2 pr-2 text-slate-400 whitespace-nowrap tabular-nums">
                        {new Date(alt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold capitalize ${
                            alt.severity === 'anomaly'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-700/50'
                              : alt.severity === 'warning'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-700/50'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50'
                          }`}
                        >
                          {alt.severity}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-300 whitespace-nowrap font-sans">
                        {alt.sensor.replace(' (ADXL345)', '').replace(' (MAX9814)', '')}
                      </td>
                      <td className="py-2 px-2 text-slate-100 whitespace-nowrap tabular-nums">
                        {alt.value}
                      </td>
                      <td className="py-2 pl-2 text-slate-400 font-sans truncate max-w-[160px]">
                        {alt.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS (3 cols) */}
      <div className="sv-card sv-card-neutral lg:col-span-3 rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-100 mb-3">Quick Actions</h4>
          <div className="space-y-2.5">
            <button
              onClick={onGenerateReport}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left hover:border-cyan-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Generate Report</p>
                <p className="text-[10.5px] text-slate-400">Export PDF & upload to Drive</p>
              </div>
            </button>

            <button
              onClick={onViewHistory}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left hover:border-purple-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                <History className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">View History</p>
                <p className="text-[10.5px] text-slate-400">Explore archived telemetry</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. INDUSTRIAL MOTOR ASSET BANNER CARD (4 cols) */}
      <div className="sv-card sv-card-cyan lg:col-span-4 relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1322] shadow-lg shadow-black/30 min-h-[168px] flex items-end">
        <img
          src={machineRigImage}
          alt="SmartVibe Industrial Motor & Spindle Monitoring Rig"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-55 transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/65 to-transparent" />
        <div className="relative z-10 p-4 w-full flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-white leading-tight">
              Smarter Monitoring.
              <br />
              Healthier Machines.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-cyan-300">
              <Activity className="h-3.5 w-3.5" />
              <span>SmartVibe Edge AI</span>
            </div>
          </div>
          <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2 py-1 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
            ADXL345 · MAX9814
          </span>
        </div>
      </div>
    </div>
  );
};
