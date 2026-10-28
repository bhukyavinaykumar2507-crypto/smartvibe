import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, Check, Trash2, CheckCircle2, Filter } from 'lucide-react';
import type { AlertItem } from '../types/telemetry';

interface AlertsPanelProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
  onClearAcknowledged: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledge,
  onClearAcknowledged,
}) => {
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'warning' | 'anomaly'>('unacknowledged');

  const filtered = alerts.filter((a) => {
    if (filter === 'unacknowledged') return !a.acknowledged;
    if (filter === 'warning') return a.severity === 'warning';
    if (filter === 'anomaly') return a.severity === 'anomaly';
    return true;
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">Machine Alert Log</h3>
            {unacknowledgedCount > 0 ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-mono font-bold text-rose-400 border border-rose-500/30">
                {unacknowledgedCount} Active
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-mono text-emerald-400 border border-emerald-500/30">
                0 Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real-time threshold exceedance alerts and suggested operational steps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            {(['unacknowledged', 'all', 'warning', 'anomaly'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-2.5 py-1 capitalize font-medium transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'unacknowledged' ? 'Active' : f}
              </button>
            ))}
          </div>

          {/* Clear acknowledged */}
          <button
            onClick={onClearAcknowledged}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Trash2 className="h-3 w-3 text-slate-400" />
            <span>Purge Acked</span>
          </button>
        </div>
      </div>

      {/* Alert Items List */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">No active alerts</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Machine sensors are currently operating within nominal baseline parameters.
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const isAnomaly = alert.severity === 'anomaly';
            return (
              <div
                key={alert.id}
                className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
                  alert.acknowledged
                    ? 'border-slate-800/80 bg-slate-950/40 opacity-70'
                    : isAnomaly
                      ? 'border-rose-500/40 bg-rose-950/15 shadow-[0_0_12px_rgba(244,63,94,0.08)]'
                      : 'border-amber-500/40 bg-amber-950/15 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${
                      isAnomaly ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isAnomaly ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isAnomaly ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs font-semibold text-slate-200">{alert.sensor}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
                        <span>Parameter: <strong className="text-white">{alert.parameter}</strong></span>
                        <span>Value: <strong className="text-rose-300">{alert.recordedValue}</strong></span>
                        <span>Limit: <strong className="text-slate-400">{alert.thresholdValue}</strong></span>
                        <span>Deviation: <strong className="text-amber-300">{alert.deviation}</strong></span>
                      </div>

                      <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 rounded p-2 border border-slate-800">
                        <span className="text-cyan-400 font-medium">Suggested Next Step: </span>
                        <span>{alert.suggestedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledge button */}
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
