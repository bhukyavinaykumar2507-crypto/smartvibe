import React, { useState } from 'react';

export interface DataSeries {
  name: string;
  color: string;
  unit: string;
  values: number[];
}

interface InteractiveChartProps {
  title: string;
  subtitle?: string;
  timestamps: string[];
  series: DataSeries[];
  thresholdWarning?: number;
  thresholdCritical?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  subtitle,
  timestamps,
  series,
  thresholdWarning,
  thresholdCritical,
  height = 220,
  yMin,
  yMax,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!timestamps.length || !series.length || !series[0].values.length) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
        <p className="text-sm">No telemetry points recorded for this window</p>
      </div>
    );
  }

  // Calculate bounds
  const allValues = series.flatMap(s => s.values).filter(v => typeof v === 'number' && !isNaN(v));
  if (thresholdWarning !== undefined) allValues.push(thresholdWarning);
  if (thresholdCritical !== undefined) allValues.push(thresholdCritical);

  const rawMin = yMin !== undefined ? yMin : Math.min(...allValues, 0);
  const rawMax = yMax !== undefined ? yMax : Math.max(...allValues, 10);
  const padding = (rawMax - rawMin) * 0.12 || 1;
  const minVal = yMin !== undefined ? yMin : Math.max(0, Math.floor(rawMin - padding));
  const maxVal = yMax !== undefined ? yMax : Math.ceil(rawMax + padding);
  const range = maxVal - minVal || 1;

  const width = 800; // SVG viewBox coordinate width
  const svgHeight = height;
  const padLeft = 46;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 28;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const n = timestamps.length;
  const getX = (index: number) => padLeft + (index / Math.max(1, n - 1)) * chartWidth;
  const getY = (val: number) => padTop + chartHeight - ((val - minVal) / range) * chartHeight;

  // Grid tick lines
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const val = minVal + (range * i) / tickCount;
    return {
      value: Number(val.toFixed(1)),
      y: getY(val),
    };
  });

  const activeIdx = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n ? hoverIndex : n - 1;
  const activeTime = timestamps[activeIdx] ? new Date(timestamps[activeIdx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  return (
    <div className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {series.map(s => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-300">{s.name}</span>
              <span className="font-mono text-slate-400 tabular-nums">
                {s.values[activeIdx] !== undefined ? `${s.values[activeIdx]} ${s.unit}` : '—'}
              </span>
            </div>
          ))}
          {thresholdWarning !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-b border-dashed border-amber-400" />
              <span className="text-amber-400/90 text-[11px]">Warn ({thresholdWarning})</span>
            </div>
          )}
          {thresholdCritical !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-b border-dashed border-rose-500" />
              <span className="text-rose-400/90 text-[11px]">Crit ({thresholdCritical})</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full select-none overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const boundedX = Math.max(padLeft, Math.min(width - padRight, relX));
            const ratio = (boundedX - padLeft) / chartWidth;
            const idx = Math.round(ratio * (n - 1));
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={`grad-${idx}`} id={`gradient-${s.name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={t.y + 3}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {t.value}
              </text>
            </g>
          ))}

          {/* Warning threshold line */}
          {thresholdWarning !== undefined && thresholdWarning <= maxVal && thresholdWarning >= minVal && (
            <line
              x1={padLeft}
              y1={getY(thresholdWarning)}
              x2={width - padRight}
              y2={getY(thresholdWarning)}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.85"
            />
          )}

          {/* Critical threshold line */}
          {thresholdCritical !== undefined && thresholdCritical <= maxVal && thresholdCritical >= minVal && (
            <line
              x1={padLeft}
              y1={getY(thresholdCritical)}
              x2={width - padRight}
              y2={getY(thresholdCritical)}
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.9"
            />
          )}

          {/* Series Area and Line */}
          {series.map((s) => {
            const points = s.values.map((v, i) => `${getX(i)},${getY(v)}`);
            const pathD = `M ${points.join(' L ')}`;
            const firstX = getX(0);
            const lastX = getX(s.values.length - 1);
            const bottomY = getY(minVal);
            const areaD = `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;

            return (
              <g key={s.name}>
                <path
                  d={areaD}
                  fill={`url(#gradient-${s.name.replace(/\s+/g, '-')})`}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Interactive Crosshair & Tooltip */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padTop}
                x2={getX(activeIdx)}
                y2={padTop + chartHeight}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {series.map((s) => {
                const val = s.values[activeIdx];
                if (val === undefined) return null;
                return (
                  <circle
                    key={s.name}
                    cx={getX(activeIdx)}
                    cy={getY(val)}
                    r="4"
                    fill={s.color}
                    stroke="#0b1120"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* X-axis time labels */}
          <text
            x={padLeft}
            y={svgHeight - 8}
            className="fill-slate-500 text-[10px] font-mono"
            textAnchor="start"
          >
            {timestamps[0] ? new Date(timestamps[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </text>
          <text
            x={width - padRight}
            y={svgHeight - 8}
            className="fill-slate-500 text-[10px] font-mono"
            textAnchor="end"
          >
            {timestamps[n - 1] ? new Date(timestamps[n - 1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </text>
        </svg>

        {hoverIndex !== null && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-slate-950/90 px-2 py-0.5 text-[11px] font-mono text-cyan-400 shadow-md border border-slate-700">
            {activeTime}
          </div>
        )}
      </div>
    </div>
  );
};
