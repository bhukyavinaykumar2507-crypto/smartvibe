import React, { useState } from 'react';
import { Waves, Thermometer, Volume2 } from 'lucide-react';
import type { TelemetryPoint } from '../types/telemetry';

interface IndividualTrendChartsProps {
  points: TelemetryPoint[];
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
}

export const IndividualTrendCharts: React.FC<IndividualTrendChartsProps> = ({
  points,
  selectedRange,
  onRangeChange,
}) => {
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Time labels
  const timestamps = points.map(p => p.timestamp);
  const n = Math.max(1, timestamps.length);

  // Values
  const vibValues = points.map(p => p.vibration.resultant);
  const tempValues = points.map(p => p.temperature.current);
  const noiseValues = points.map(p => p.noise.relativeLevel);

  // Chart rendering helper
  const renderSingleChart = (
    title: string,
    icon: React.ReactNode,
    iconColor: string,
    yLabel: string,
    values: number[],
    lineColor: string,
    gradientId: string,
    yTicks: number[],
    yMin: number,
    yMax: number,
    unit: string,
    chartId: string
  ) => {
    const width = 360;
    const height = 180;
    const padLeft = 38;
    const padRight = 14;
    const padTop = 16;
    const padBottom = 26;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const range = yMax - yMin || 1;

    const getX = (idx: number) => padLeft + (idx / Math.max(1, n - 1)) * chartW;
    const getY = (val: number) => padTop + chartH - ((Math.min(yMax, Math.max(yMin, val)) - yMin) / range) * chartH;

    const pointsStr = values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
    const firstX = getX(0);
    const lastX = getX(values.length - 1);
    const bottomY = getY(yMin);
    const areaPath = `M ${firstX},${bottomY} L ${values.map((v, i) => `${getX(i)},${getY(v)}`).join(' L ')} L ${lastX},${bottomY} Z`;

    const activeIdx = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n ? hoverIndex : n - 1;
    const activeValue = values[activeIdx] !== undefined ? values[activeIdx] : values[values.length - 1];

    // Timestamp display ticks (show 5 clean equidistant timestamps)
    const timeTickIndices = [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];

    return (
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322] p-4 shadow-lg shadow-black/30 backdrop-blur-md flex flex-col justify-between">
        
        {/* Header with Title and Time Filter Segment */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={iconColor}>{icon}</span>
            <h4 className="text-xs font-bold text-slate-100">{title}</h4>
          </div>

          {/* Time range buttons */}
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

        {/* Chart SVG Canvas */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full overflow-visible select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * width;
              const boundedX = Math.max(padLeft, Math.min(width - padRight, relX));
              const ratio = (boundedX - padLeft) / chartW;
              const idx = Math.round(ratio * (n - 1));
              setHoverIndex(idx);
              setHoveredChart(chartId);
            }}
            onMouseLeave={() => {
              setHoverIndex(null);
              setHoveredChart(null);
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Label (Vertical) */}
            <text
              x={-height / 2}
              y={10}
              transform="rotate(-90)"
              textAnchor="middle"
              className="fill-slate-500 text-[8.5px] font-sans font-medium"
            >
              {yLabel}
            </text>

            {/* Horizontal Grid lines and Y-ticks */}
            {yTicks.map((tickVal) => {
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

            {/* Area Fill */}
            {values.length > 1 && (
              <path d={areaPath} fill={`url(#${gradientId})`} />
            )}

            {/* Series Line */}
            {values.length > 1 && (
              <polyline
                fill="none"
                stroke={lineColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStr}
              />
            )}

            {/* Hover Tooltip & Crosshair */}
            {hoveredChart === chartId && hoverIndex !== null && (
              <g>
                <line
                  x1={getX(activeIdx)}
                  y1={padTop}
                  x2={getX(activeIdx)}
                  y2={padTop + chartH}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(activeIdx)}
                  cy={getY(activeValue)}
                  r="3.5"
                  fill={lineColor}
                  stroke="#0b1322"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* X-axis Timestamps */}
            {timeTickIndices.map((idx) => {
              const timeStr = timestamps[idx]
                ? new Date(timestamps[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              const xPos = getX(idx);
              return (
                <text
                  key={idx}
                  x={xPos}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[8.5px] font-mono tabular-nums"
                >
                  {timeStr}
                </text>
              );
            })}
          </svg>

          {/* Active tooltip value readout */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/60 mt-1">
            <span>Reading:</span>
            <span className="font-bold text-white tabular-nums">
              {activeValue !== undefined ? `${activeValue.toFixed(2)} ${unit}` : '—'}
            </span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Vibration Trend (Cyan) */}
      {renderSingleChart(
        'Vibration Trend',
        <Waves className="h-4 w-4" />,
        'text-cyan-400',
        'Acceleration (m/s²)',
        vibValues,
        '#06b6d4',
        'grad-vib-cyan',
        [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        0.0,
        1.0,
        'm/s²',
        'vib'
      )}

      {/* 2. Temperature Trend (Orange) */}
      {renderSingleChart(
        'Temperature Trend',
        <Thermometer className="h-4 w-4" />,
        'text-amber-400',
        'Temperature (°C)',
        tempValues,
        '#f59e0b',
        'grad-temp-orange',
        [0, 20, 40, 60, 80],
        0,
        80,
        '°C',
        'temp'
      )}

      {/* 3. Noise Trend (Purple) */}
      {renderSingleChart(
        'Noise Trend',
        <Volume2 className="h-4 w-4" />,
        'text-purple-400',
        'Signal Level',
        noiseValues,
        '#a855f7',
        'grad-noise-purple',
        [0, 50, 100, 150, 200],
        0,
        200,
        'dB*',
        'noise'
      )}
    </div>
  );
};
