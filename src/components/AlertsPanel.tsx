import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import type { AlertItem } from '../types/telemetry';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'anomaly'>('all');

  if (!isOpen) return null;

  const visibleAlerts = alerts.filter((a) =>
    filter === 'all' ? true : a.severity === filter
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#0b1322] shadow-2xl sv-tab-enter">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Alerts & Notifications</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close alerts drawer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5">
          <div className="flex items-center gap-1">
            {(['all', 'warning', 'anomaly'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  filter === f
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No active alerts</p>
              <p className="text-xs text-slate-500 mt-1">
                ADXL345 vibration & MAX9814 noise thresholds are clear.
              </p>
            </div>
          ) : (
            visibleAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  alt.acknowledged
                    ? 'border-slate-800 bg-slate-900/40 opacity-65'
                    : alt.severity === 'anomaly'
                      ? 'border-rose-500/50 bg-rose-950/25'
                      : 'border-amber-500/45 bg-amber-950/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      alt.severity === 'anomaly'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {alt.severity} · {alt.sensor}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(alt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{alt.message}</p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    Value: <strong className="text-white">{alt.value}</strong> ({alt.threshold})
                  </span>
                  {!alt.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alt.id)}
                      className="inline-flex items-center gap-1 font-sans font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
