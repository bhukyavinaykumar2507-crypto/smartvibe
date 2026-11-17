import React from 'react';
import {
  Activity,
  Database,
  Brain,
  Check,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { TelemetryPoint, MachineHealthEvaluation } from '../types/telemetry';
import { AnimatedNumber } from './AnimatedNumber';

interface MiddleRowCardsProps {
  points: TelemetryPoint[];
  latestHealth: MachineHealthEvaluation;
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
  onViewAllHistory: () => void;
  onOpenAiAnalysis: () => void;
  deviceStatus?: 'online' | 'offline';
  mode?: 'demo' | 'live';
  isStreaming?: boolean;
  lastUpdated?: string;
}

export const MiddleRowCards: React.FC<MiddleRowCardsProps> = ({
  points,
  latestHealth,
  selectedRange,
  onRangeChange,
  onViewAllHistory,
  onOpenAiAnalysis,
  deviceStatus = 'offline',
  mode = 'demo',
  isStreaming = true,
  lastUpdated = '',
}) => {
  const isStale =
    mode === 'live' &&
    (!lastUpdated ||
      Date.now() - new Date(lastUpdated).getTime() > 15000 ||
      !isStreaming);
  const isLiveFresh =
    mode === 'live' && deviceStatus === 'online' && !isStale && isStreaming;

  // SVG Combined Multi-Series Chart
  const width = 440;
  const height = 190;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 26;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const n = Math.max(1, points.length);
  const getX = (idx: number) => padLeft + (idx / Math.max(1, n - 1)) * chartW;
  const getY = (val: number) =>
    padTop + chartH - (Math.min(100, Math.max(0, val)) / 100) * chartH;

  // Normalize vibration (0 - 1.5 m/s² -> 0 - 100) and noise (0 - 100%)
  const vibNorm = points.map((p) => Math.min(100, (p.vibration.resultant / 1.5) * 100));
  const noiseNorm = points.map((p) => Math.min(100, Math.max(0, p.noise.relativeLevel)));

  const buildPolyline = (arr: number[]) =>
    arr.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');

  const timeTickIndices = [
    0,
    Math.floor(n * 0.25),
    Math.floor(n * 0.5),
    Math.floor(n * 0.75),
    n - 1,
  ];
  const recentFive = [...points].reverse().slice(0, 5);

  // Health Circular Gauge SVG geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, latestHealth.score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const gaugeColor =
    latestHealth.status === 'anomaly'
      ? '#f43f5e'
      : latestHealth.status === 'warning'
        ? '#f59e0b'
        : '#10b981';

  const statusColorClass =
    latestHealth.status === 'anomaly'
      ? 'text-rose-400'
      : latestHealth.status === 'warning'
        ? 'text-amber-400'
        : 'text-emerald-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sv-enter-d3">
      {/* 1. COMBINED SENSOR VIEW (5 Columns on lg) */}
      <div className="sv-card sv-card-neutral lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">Combined Sensor View</h4>
            {isLiveFresh && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {(['15m', '1h', '24h', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                  selectedRange === r
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {points.length < 2 ? (
          <div className="flex h-[185px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs font-mono text-slate-500">
            Waiting for dual-sensor telemetry points...
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible select-none">
            {[0, 25, 50, 75, 100].map((tickVal) => {
              const yPos = getY(tickVal);
              return (
                <g key={tickVal}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={width - padRight}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padLeft - 5}
                    y={yPos + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[8.5px] font-mono tabular-nums"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(vibNorm)}
              className="sv-svg-smooth"
            />
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(noiseNorm)}
              className="sv-svg-smooth"
            />

            {/* Latest points */}
            <circle
              cx={getX(points.length - 1)}
              cy={getY(vibNorm[vibNorm.length - 1])}
              r="3"
              fill="#06b6d4"
              stroke="#0b1322"
              strokeWidth="1.4"
              className="sv-svg-smooth"
            />
            <circle
              cx={getX(points.length - 1)}
              cy={getY(noiseNorm[noiseNorm.length - 1])}
              r="3"
              fill="#a855f7"
              stroke="#0b1322"
              strokeWidth="1.4"
              className="sv-svg-smooth"
            />

            {timeTickIndices.map((idx) => {
              const timeStr = points[idx]?.timestamp
                ? new Date(points[idx].timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[8.5px] font-mono tabular-nums"
                >
                  {timeStr}
                </text>
              );
            })}
          </svg>
        )}

        <div className="flex flex-wrap items-center justify-center gap-5 pt-2 border-t border-slate-800/70 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-cyan-400" />
            <span>Vibration (ADXL345 scaled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Noise (MAX9814 relative %)</span>
          </div>
        </div>
      </div>

      {/* 2. RECENT READINGS TABLE (3.5/12 -> 3 Columns on lg) */}
      <div className="sv-card sv-card-neutral lg:col-span-3 rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">Recent Readings</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-1.5 pr-1">Time</th>
                  <th className="py-1.5 px-1">Vib</th>
                  <th className="py-1.5 px-1">Noise</th>
                  <th className="py-1.5 pl-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px] font-mono">
                {recentFive.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                      No packets received yet
                    </td>
                  </tr>
                ) : (
                  recentFive.map((pt) => (
                    <tr key={pt.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-2 pr-1 text-slate-300 tabular-nums">
                        {new Date(pt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-1 text-slate-100 tabular-nums">
                        {pt.vibration.resultant.toFixed(2)}
                      </td>
                      <td className="py-2 px-1 text-slate-100 tabular-nums">
                        {pt.noise.relativeLevel}%
                      </td>
                      <td className="py-2 pl-1 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-sans font-semibold ${
                            pt.health.status === 'anomaly'
                              ? 'text-rose-400'
                              : pt.health.status === 'warning'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              pt.health.status === 'anomaly'
                                ? 'bg-rose-400'
                                : pt.health.status === 'warning'
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                            }`}
                          />
                          <span className="capitalize">{pt.health.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={onViewAllHistory}
          className="mt-3 flex w-full items-center justify-end gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors pt-2 border-t border-slate-800/70"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* 3. AI MACHINE HEALTH ANALYSIS CARD (4 Columns on lg) */}
      <div
        className={`sv-card sv-card-neutral lg:col-span-4 rounded-2xl border bg-[#0b1322]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between ${
          latestHealth.status === 'anomaly'
            ? 'border-rose-500/70 sv-anomaly-glow'
            : latestHealth.status === 'warning'
              ? 'border-amber-600/60'
              : 'border-slate-800/80'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-100">AI Machine Health Analysis</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              -{latestHealth.vibrationPenalty + latestHealth.acousticPenalty} pts penalty
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Animated Radial Gauge */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="sv-svg-smooth"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <AnimatedNumber
                  value={clampedScore}
                  decimals={0}
                  duration={450}
                  className="text-2xl font-extrabold font-mono text-white leading-none tabular-nums"
                />
                <span className="text-[8.5px] font-medium text-slate-400 mt-1">Health Score</span>
              </div>
            </div>

            {/* Status & Conditions */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Status</span>
                <span className={`inline-flex items-center gap-1.5 font-bold capitalize ${statusColorClass}`}>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      latestHealth.status === 'anomaly'
                        ? 'bg-rose-400'
                        : latestHealth.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                  {latestHealth.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-1">Detected Conditions</p>
                <div className="space-y-1 text-[10.5px] text-slate-300">
                  {latestHealth.detectedConditions.slice(0, 3).map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      {latestHealth.status === 'anomaly' ? (
                        <ShieldAlert className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                      ) : latestHealth.status === 'warning' ? (
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{cond}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Box */}
        <button
          onClick={onOpenAiAnalysis}
          className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-teal-500/30 bg-teal-950/20 px-3 py-2 text-left hover:bg-teal-950/40 hover:border-teal-400/50 transition-all group"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Lightbulb className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-teal-300">Recommendation</p>
              <p className="text-[10.5px] text-slate-300 truncate">{latestHealth.recommendation}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>
    </div>
  );
};
