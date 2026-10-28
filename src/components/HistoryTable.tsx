import React, { useState, useMemo } from 'react';
import { Download, Search, CheckCircle2, AlertTriangle, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import type { TelemetryPoint } from '../types/telemetry';

interface HistoryTableProps {
  points: TelemetryPoint[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ points }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'anomaly'>('all');
  const [selectedPoint, setSelectedPoint] = useState<TelemetryPoint | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filteredPoints = useMemo(() => {
    return points
      .filter((p) => {
        if (statusFilter !== 'all' && p.health.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          p.timestamp.toLowerCase().includes(term) ||
          p.machineName.toLowerCase().includes(term) ||
          p.health.status.toLowerCase().includes(term)
        );
      })
      .reverse(); // Latest first
  }, [points, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredPoints.length / pageSize) || 1;
  const paginatedPoints = filteredPoints.slice((page - 1) * pageSize, page * pageSize);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Machine ID',
      'Vibration RMS (mm/s)',
      'Vibration Resultant (m/s²)',
      'Vibration Peak (m/s²)',
      'Temperature (°C)',
      'Noise Relative (%)',
      'Noise Peak (%)',
      'Health Score (0-100)',
      'Condition Status',
    ];

    const rows = filteredPoints.map((p) => [
      p.timestamp,
      p.machineId,
      p.vibration.rms,
      p.vibration.resultant,
      p.vibration.peak,
      p.temperature.current,
      p.noise.relativeLevel,
      p.noise.peakLevel,
      p.health.score,
      p.health.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartvibe_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: 'normal' | 'warning' | 'anomaly') => {
    switch (status) {
      case 'anomaly':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-3 w-3" /> Anomaly
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Normal
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
      
      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Telemetry History Logs</h3>
          <p className="text-xs text-slate-400">
            Showing <strong className="text-slate-200 tabular-nums">{filteredPoints.length}</strong> recorded telemetry packets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', 'normal', 'warning', 'anomaly'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`rounded px-2.5 py-1 capitalize font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search timestamp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-400">
            <tr>
              <th className="py-2.5 px-4 font-medium">Timestamp</th>
              <th className="py-2.5 px-4 font-medium text-right">Vib RMS (mm/s)</th>
              <th className="py-2.5 px-4 font-medium text-right">Resultant (m/s²)</th>
              <th className="py-2.5 px-4 font-medium text-right">Temp (°C)</th>
              <th className="py-2.5 px-4 font-medium text-right">Noise Rel. (%)</th>
              <th className="py-2.5 px-4 font-medium text-center">Health Score</th>
              <th className="py-2.5 px-4 font-medium text-center">Status</th>
              <th className="py-2.5 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedPoints.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                  No telemetry points match the current filter.
                </td>
              </tr>
            ) : (
              paginatedPoints.map((p) => {
                const date = new Date(p.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedPoint(p)}
                  >
                    <td className="py-2 px-4 whitespace-nowrap text-slate-300">
                      <span>{dateStr}</span> <span className="text-slate-500">{timeStr}</span>
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums font-semibold text-indigo-300">
                      {p.vibration.rms.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-slate-300">
                      {p.vibration.resultant.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums font-semibold text-emerald-300">
                      {p.temperature.current.toFixed(1)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-cyan-300">
                      {p.noise.relativeLevel.toFixed(1)}%
                    </td>
                    <td className="py-2 px-4 text-center tabular-nums font-bold text-white">
                      {p.health.score}
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(p.health.status)}
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoint(p);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 p-3 text-xs text-slate-400">
        <span>
          Page <strong className="text-slate-200 tabular-nums">{page}</strong> of{' '}
          <strong className="text-slate-200 tabular-nums">{totalPages}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detailed Point Inspection Modal */}
      {selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Telemetry Snapshot Details</h4>
                <p className="text-xs font-mono text-slate-400">{selectedPoint.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ADXL345 Vibration RMS</span>
                  <span className="text-base font-bold text-indigo-300">{selectedPoint.vibration.rms} mm/s</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Axes: X={selectedPoint.vibration.x}, Y={selectedPoint.vibration.y}, Z={selectedPoint.vibration.z}
                  </span>
                </div>
                <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DS18B20 Temperature</span>
                  <span className="text-base font-bold text-emerald-300">{selectedPoint.temperature.current}°C</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Range: Min {selectedPoint.temperature.min}°C · Max {selectedPoint.temperature.max}°C
                  </span>
                </div>
              </div>

              <div className="rounded bg-slate-900 p-2.5 border border-slate-800 font-mono">
                <span className="text-slate-400 block text-[10px]">MAX9814 Relative Noise</span>
                <span className="text-base font-bold text-cyan-300">{selectedPoint.noise.relativeLevel}%</span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Peak: {selectedPoint.noise.peakLevel}% · Pattern: {selectedPoint.noise.patternState}
                </span>
              </div>

              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200">Health Score & Evaluation:</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedPoint.health.score} / 100</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {selectedPoint.health.reasons[0] || 'Nominal operational status'}
                </p>
                <p className="text-amber-400/90 text-[11px] mt-1">
                  Recommendation: {selectedPoint.health.recommendations[0]}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPoint(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
