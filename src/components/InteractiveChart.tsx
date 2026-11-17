import React, { useState } from 'react';
import type { TelemetryPoint } from '../types/telemetry';
import { AnimatedNumber } from './AnimatedNumber';

interface InteractiveChartProps {
  points: TelemetryPoint[];
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
  focusSensor?: 'all' | 'vibration' | 'noise';
  deviceStatus?: 'online' | 'offline';
  mode?: 'demo' | 'live';
  isStreaming?: boolean;
  lastUpdated?: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  points,
  selectedRange,
  onRangeChange,
  focusSensor = 'all',
  deviceStatus = 'offline',
  mode = 'demo',
  isStreaming = true,
  lastUpdated = '',
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const isStale =
    mode === 'live' &&
    (!lastUpdated ||
      Date.now() - new Date(lastUpdated).getTime() > 15000 ||
      !isStreaming);
  const isLiveFresh =
    mode === 'live' && deviceStatus === 'online' && !isStale && isStreaming;

  const width = 760;
  const height = 270;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 32;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const n = Math.max(1, points.length);
  const getX = (idx: number) => padLeft + (idx / Math.max(1, n - 1)) * chartW;
  const getYNorm = (pct: number) =>
    padTop + chartH - (Math.min(100, Math.max(0, pct)) / 100) * chartH;

  // Scale vibration (0 - 1.5 m/s²) and noise (0 - 100%) to 0-100 unified canvas
  const vibNorm = points.map((p) => Math.min(100, (p.vibration.resultant / 1.5) * 100));
  const noiseNorm = points.map((p) => Math.min(100, Math.max(0, p.noise.relativeLevel)));

  const buildPolyline = (arr: number[]) =>
    arr.map((v, i) => `${getX(i).toFixed(1)},${getYNorm(v).toFixed(1)}`).join(' ');

  const activeIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < points.length
      ? hoverIdx
      : Math.max(0, points.length - 1);
  const activePoint = points[activeIdx];

  const handleScrub = (clientX: number, rect: DOMRect) => {
    if (points.length < 2) return;
    const relX = ((clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(padLeft, Math.min(width - padRight, relX));
    const ratio = (clampedX - padLeft) / chartW;
    setHoverIdx(Math.round(ratio * (points.length - 1)));
  };

  return (
    <div className="sv-card sv-card-neutral rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-bold text-white">
            {focusSensor === 'vibration'
              ? 'ADXL345 Vibration Waveform Telemetry'
              : focusSensor === 'noise'
                ? 'MAX9814 Acoustic Envelope Telemetry'
                : 'Combined Sensor Stream (ADXL345 + MAX9814)'}
          </h3>
          {isLiveFresh ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="sv-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              LIVE
            </span>
          ) : mode === 'live' && isStale ? (
            <span className="rounded bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono text-amber-300">
              STALE
            </span>
          ) : mode === 'live' ? (
            <span className="rounded bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 text-[10px] font-mono text-rose-300">
              OFFLINE
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          {(['15m', '1h', '24h', '7d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`rounded px-2 py-1 text-[11px] font-mono transition-colors ${
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

      {/* Chart Canvas */}
      {points.length < 2 ? (
        <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs font-mono text-slate-500">
          {mode === 'live' && deviceStatus === 'offline'
            ? 'ESP32 offline — waiting for incoming ADXL345 & MAX9814 frames'
            : 'Collecting real-time sensor frames...'}
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible select-none touch-pan-y"
          onMouseMove={(e) => handleScrub(e.clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => {
            if (e.touches[0]) {
              handleScrub(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
            }
          }}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchEnd={() => setHoverIdx(null)}
        >
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getYNorm(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.9"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {(focusSensor === 'all' || focusSensor === 'vibration') && (
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(vibNorm)}
              className="sv-svg-smooth"
            />
          )}

          {(focusSensor === 'all' || focusSensor === 'noise') && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(noiseNorm)}
              className="sv-svg-smooth"
            />
          )}

          {/* Terminal point markers */}
          {points.length > 0 && (
            <g className="sv-svg-smooth">
              {(focusSensor === 'all' || focusSensor === 'vibration') && (
                <circle
                  cx={getX(points.length - 1)}
                  cy={getYNorm(vibNorm[vibNorm.length - 1])}
                  r="4"
                  fill="#06b6d4"
                  stroke="#0b1322"
                  strokeWidth="1.5"
                />
              )}
              {(focusSensor === 'all' || focusSensor === 'noise') && (
                <circle
                  cx={getX(points.length - 1)}
                  cy={getYNorm(noiseNorm[noiseNorm.length - 1])}
                  r="4"
                  fill="#a855f7"
                  stroke="#0b1322"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverIdx !== null && activePoint && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padTop}
                x2={getX(activeIdx)}
                y2={padTop + chartH}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {(focusSensor === 'all' || focusSensor === 'vibration') && (
                <circle
                  cx={getX(activeIdx)}
                  cy={getYNorm(vibNorm[activeIdx])}
                  r="4.5"
                  fill="#06b6d4"
                  stroke="#0b1322"
                  strokeWidth="2"
                />
              )}
              {(focusSensor === 'all' || focusSensor === 'noise') && (
                <circle
                  cx={getX(activeIdx)}
                  cy={getYNorm(noiseNorm[activeIdx])}
                  r="4.5"
                  fill="#a855f7"
                  stroke="#0b1322"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {[0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1].map((idx) => {
            const p = points[idx];
            if (!p) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {new Date(p.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </text>
            );
          })}
        </svg>
      )}

      {/* Readout Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          {(focusSensor === 'all' || focusSensor === 'vibration') && (
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Vibration:
              <strong className="text-cyan-300 tabular-nums">
                {activePoint ? <AnimatedNumber value={activePoint.vibration.resultant} decimals={2} duration={220} /> : '0.00'} m/s²
              </strong>
            </span>
          )}
          {(focusSensor === 'all' || focusSensor === 'noise') && (
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              Noise:
              <strong className="text-purple-300 tabular-nums">
                {activePoint ? <AnimatedNumber value={activePoint.noise.relativeLevel} decimals={0} duration={220} /> : '0'}%
              </strong>
            </span>
          )}
        </div>
        <span className="text-slate-500">
          {hoverIdx !== null && activePoint
            ? new Date(activePoint.timestamp).toLocaleTimeString()
            : 'Scrub chart to inspect past packets'}
        </span>
      </div>
    </div>
  );
};
