import React, { useState } from 'react';
import { 
  Layers, 
  Table, 
  BrainCircuit, 
  Lightbulb, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react';
import type { TelemetryPoint, MachineHealthEvaluation } from '../types/telemetry';

interface MiddleRowCardsProps {
  points: TelemetryPoint[];
  latestHealth: MachineHealthEvaluation;
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
  onViewAllHistory: () => void;
  onOpenAiDeepDive: () => void;
}

export const MiddleRowCards: React.FC<MiddleRowCardsProps> = ({
  points,
  latestHealth,
  selectedRange,
  onRangeChange,
  onViewAllHistory,
  onOpenAiDeepDive,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Time & values for Combined Chart
  const timestamps = points.map(p => p.timestamp);
  const n = Math.max(1, timestamps.length);

  // Normalized values for comparison
  const vibValues = points.map(p => Math.min(100, p.vibration.resultant * 50)); // scaled representation
  const tempValues = points.map(p => Math.min(100, p.temperature.current)); // 0-100 scale
  const noiseValues = points.map(p => Math.min(100, p.noise.relativeLevel)); // 0-100 scale

  // Circular gauge math for AI Health Score
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (latestHealth.score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#06b6d4'; // Cyan/Teal
    if (score >= 60) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  // Recent 5 readings (latest first)
  const recentReadings = [...points].reverse().slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* CARD 1: COMBINED SENSOR VIEW */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">Combined Sensor View</h4>
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

        {/* SVG Multi-Line Chart */}
        <div className="relative w-full">
          {(() => {
            const width = 360;
            const height = 180;
            const padLeft = 32;
            const padRight = 12;
            const padTop = 14;
            const padBottom = 26;

            const chartW = width - padLeft - padRight;
            const chartH = height - padTop - padBottom;
            const getX = (idx: number) => padLeft + (idx / Math.max(1, n - 1)) * chartW;
            const getY = (val: number) => padTop + chartH - ((Math.min(100, Math.max(0, val))) / 100) * chartH;

            const vibPoints = vibValues.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            const tempPoints = tempValues.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            const noisePoints = noiseValues.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

            const yTicks = [0, 25, 50, 75, 100];
            const timeTickIndices = [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];

            return (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible select-none">
                {/* Y-Axis Label */}
                <text
                  x={-height / 2}
                  y={8}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  className="fill-slate-500 text-[8.5px] font-sans font-medium"
                >
                  Value
                </text>

                {/* Grid ticks */}
                {yTicks.map((val) => {
                  const yPos = getY(val);
                  return (
                    <g key={val}>
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
                        x={padLeft - 4}
                        y={yPos + 3}
                        textAnchor="end"
                        className="fill-slate-400 text-[8.5px] font-mono tabular-nums"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Vibration Line (Cyan) */}
                {vibValues.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={vibPoints}
                  />
                )}

                {/* Temperature Line (Orange) */}
                {tempValues.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={tempPoints}
                  />
                )}

                {/* Noise Line (Purple) */}
                {noiseValues.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={noisePoints}
                  />
                )}

                {/* X-axis Timestamps */}
                {timeTickIndices.map((idx) => {
                  const timeStr = timestamps[idx]
                    ? new Date(timestamps[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
            );
          })()}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[10px] font-mono border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-cyan-400" />
              <span className="text-slate-300">Vibration (m/s²)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">Temperature (°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-slate-300">Noise (relative %)</span>
            </div>
          </div>
        </div>

      </div>

      {/* CARD 2: RECENT READINGS TABLE */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">Recent Readings</h4>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/90 text-[10px] text-slate-400">
                <th className="py-1.5 px-2 font-medium">Time</th>
                <th className="py-1.5 px-2 font-medium text-right">Vib (m/s²)</th>
                <th className="py-1.5 px-2 font-medium text-right">Temp (°C)</th>
                <th className="py-1.5 px-2 font-medium text-right">Noise (%)</th>
                <th className="py-1.5 px-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {recentReadings.map((p) => {
                const timeStr = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-2 text-slate-300 whitespace-nowrap">{timeStr}</td>
                    <td className="py-2 px-2 text-right text-cyan-300 font-semibold tabular-nums">
                      {p.vibration.resultant.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right text-amber-300 font-semibold tabular-nums">
                      {p.temperature.current.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right text-purple-300 font-semibold tabular-nums">
                      {Math.round(p.noise.relativeLevel)}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap font-sans">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Normal
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* View All Link */}
        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            onClick={onViewAllHistory}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>

      {/* CARD 3: AI MACHINE HEALTH ANALYSIS */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-100">AI Machine Health Analysis</h4>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px]">Status</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Normal
            </span>
          </div>
        </div>

        {/* Gauge + Detected Conditions */}
        <div className="grid grid-cols-12 gap-3 items-center py-2">
          {/* Radial Gauge */}
          <div className="col-span-5 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={getScoreColor(latestHealth.score)}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                  {latestHealth.score}
                </span>
                <span className="text-[9px] font-mono text-slate-400 tracking-tight">
                  Health Score
                </span>
              </div>
            </div>
          </div>

          {/* Detected Conditions List */}
          <div className="col-span-7 space-y-1.5 text-left text-xs">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">Detected Conditions</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Vibration within normal range</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Temperature stable</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Noise level normal</span>
            </div>
          </div>
        </div>

        {/* Recommendation Box */}
        <div 
          onClick={onOpenAiDeepDive}
          className="mt-2 flex items-center justify-between rounded-xl border border-cyan-900/50 bg-[#0d1728] p-2.5 cursor-pointer hover:border-cyan-600 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Recommendation
              </span>
              <span className="text-xs font-medium text-slate-200 block">
                {latestHealth.recommendations[0] || 'Continue monitoring. No action required.'}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0" />
        </div>

      </div>

    </div>
  );
};
