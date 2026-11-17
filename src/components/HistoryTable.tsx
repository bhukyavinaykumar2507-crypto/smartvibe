import React, { useState } from 'react';
import { Download, Search, Database } from 'lucide-react';
import type { TelemetryPoint, HealthStatus } from '../types/telemetry';

interface HistoryTableProps {
  points: TelemetryPoint[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ points }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | HealthStatus>('all');
  const [query, setQuery] = useState('');

  const filtered = [...points]
    .reverse()
    .filter((p) => {
      if (statusFilter !== 'all' && p.health.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.machineName.toLowerCase().includes(q) ||
          p.health.status.includes(q) ||
          p.noise.patternState.includes(q) ||
          new Date(p.timestamp).toLocaleTimeString().toLowerCase().includes(q)
        );
      }
      return true;
    });

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Machine',
      'Mode',
      'Vib_X_ms2',
      'Vib_Y_ms2',
      'Vib_Z_ms2',
      'Vib_Resultant_ms2',
      'Vib_RMS_ms2',
      'Vib_Peak_ms2',
      'Noise_Relative_Pct',
      'Noise_Peak_Pct',
      'Noise_Pattern',
      'Health_Score',
      'Overall_Status',
    ];
    const rows = filtered.map((p) => [
      p.timestamp,
      p.machineName,
      p.mode,
      p.vibration.x,
      p.vibration.y,
      p.vibration.z,
      p.vibration.resultant,
      p.vibration.rms,
      p.vibration.peak,
      p.noise.relativeLevel,
      p.noise.peakLevel,
      p.noise.patternState,
      p.health.score,
      p.health.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartvibe-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sv-enter rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Database className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">Machine Telemetry History</h2>
            <p className="text-xs text-slate-400">
              Archived ADXL345 vibration and MAX9814 relative sound readings ({filtered.length} records)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter logs..."
              className="rounded-xl border border-slate-700/80 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | HealthStatus)}
            className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="anomaly">Anomaly</option>
          </select>

          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pr-3">Timestamp</th>
              <th className="py-2.5 px-3">Vib Resultant</th>
              <th className="py-2.5 px-3">X / Y / Z (m/s²)</th>
              <th className="py-2.5 px-3">RMS / Peak</th>
              <th className="py-2.5 px-3">MAX9814 Noise</th>
              <th className="py-2.5 px-3">Pattern</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 pl-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 font-sans">
                  No matching telemetry history records found.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 80).map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-800/35 transition-colors">
                  <td className="py-2.5 pr-3 text-slate-300 whitespace-nowrap tabular-nums">
                    {new Date(pt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold tabular-nums">
                    {pt.vibration.resultant.toFixed(2)} m/s²
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap tabular-nums">
                    {pt.vibration.x.toFixed(2)} / {pt.vibration.y.toFixed(2)} / {pt.vibration.z.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap tabular-nums">
                    {pt.vibration.rms.toFixed(2)} / {pt.vibration.peak.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-purple-300 font-bold tabular-nums">
                    {pt.noise.relativeLevel}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 capitalize font-sans">
                    {pt.noise.patternState.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-white font-bold tabular-nums">
                    {pt.health.score}/100
                  </td>
                  <td className="py-2.5 pl-3 text-right font-sans">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold capitalize ${
                        pt.health.status === 'anomaly'
                          ? 'bg-rose-950/70 text-rose-400 border border-rose-700/50'
                          : pt.health.status === 'warning'
                            ? 'bg-amber-950/70 text-amber-400 border border-amber-700/50'
                            : 'bg-emerald-950/70 text-emerald-400 border border-emerald-700/50'
                      }`}
                    >
                      {pt.health.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
