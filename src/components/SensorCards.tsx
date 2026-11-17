import React from 'react';
import {
  Waves,
  Volume2,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type {
  VibrationReading,
  NoiseReading,
  HealthStatus,
  TelemetryPoint,
} from '../types/telemetry';
import { AnimatedNumber } from './AnimatedNumber';

interface SensorCardsProps {
  vibration: VibrationReading;
  noise: NoiseReading;
  overallStatus: HealthStatus;
  historyPoints?: TelemetryPoint[];
  deviceStatus?: 'online' | 'offline';
  mode?: 'demo' | 'live';
  isStreaming?: boolean;
  lastUpdated?: string;
  onOpenVibrationDetails?: () => void;
  onOpenNoiseDetails?: () => void;
}

export const SensorCards: React.FC<SensorCardsProps> = ({
  vibration,
  noise,
  overallStatus,
  historyPoints = [],
  deviceStatus = 'offline',
  mode = 'demo',
  isStreaming = true,
  lastUpdated = '',
  onOpenVibrationDetails,
  onOpenNoiseDetails,
}) => {
  const isStale =
    mode === 'live' &&
    (!lastUpdated ||
      Date.now() - new Date(lastUpdated).getTime() > 15000 ||
      !isStreaming);
  const isLiveFresh =
    mode === 'live' && deviceStatus === 'online' && !isStale && isStreaming;

  const recentSlice = historyPoints.slice(-24);
  const vibSeries = recentSlice.map((p) => p.vibration.resultant);
  const noiseSeries = recentSlice.map((p) => p.noise.relativeLevel);

  const renderStatusText = (status: HealthStatus) => {
    switch (status) {
      case 'anomaly':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Anomaly</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Warning</span>
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Normal</span>
          </span>
        );
    }
  };

  const renderStreamStateLabel = () => {
    if (isLiveFresh) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="sv-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          LIVE
        </span>
      );
    }
    if (mode === 'live' && deviceStatus === 'online' && isStale) {
      return (
        <span className="text-[10px] font-mono font-semibold text-amber-400">
          STALE
        </span>
      );
    }
    if (mode === 'live') {
      return (
        <span className="text-[10px] font-mono font-semibold text-rose-400">
          OFFLINE
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono text-slate-400">
        {isStreaming ? 'DEMO STREAM' : 'PAUSED'}
      </span>
    );
  };

  // Real-data SVG waveform builder (no fake data)
  const buildSparkline = (
    values: number[],
    yMin: number,
    yMax: number,
    strokeColor: string,
    gradientId: string
  ) => {
    const width = 280;
    const height = 44;
    const padX = 4;
    const padY = 5;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const dynMax = Math.max(yMax, ...values, yMin + 0.1);
    const range = dynMax - yMin || 1;
    const count = values.length;

    if (count < 2) {
      return (
        <div className="flex h-11 items-center justify-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/40 text-[10px] font-mono text-slate-500">
          Awaiting incoming sensor points...
        </div>
      );
    }

    const coords = values.map((val, idx) => {
      const x = padX + (idx / Math.max(1, count - 1)) * plotW;
      const clamped = Math.min(dynMax, Math.max(yMin, val));
      const y = padY + plotH - ((clamped - yMin) / range) * plotH;
      return { x, y };
    });

    const lineD = `M ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ')}`;
    const areaD = `M ${coords[0].x.toFixed(1)},${height - padY} L ${coords
      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' L ')} L ${coords[coords.length - 1].x.toFixed(1)},${height - padY} Z`;
    const last = coords[coords.length - 1];

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-11 w-full overflow-visible select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line
          x1={padX}
          y1={height / 2}
          x2={width - padX}
          y2={height / 2}
          stroke="#1e293b"
          strokeWidth="0.7"
          strokeDasharray="2 3"
        />
        <path d={areaD} fill={`url(#${gradientId})`} className="sv-svg-smooth" />
        <path
          d={lineD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sv-svg-smooth"
        />
        {isLiveFresh && (
          <circle
            cx={last.x}
            cy={last.y}
            r="6"
            fill={strokeColor}
            opacity="0.28"
            className="sv-live-ping"
          />
        )}
        <circle
          cx={last.x}
          cy={last.y}
          r="2.8"
          fill={strokeColor}
          stroke="#0b1322"
          strokeWidth="1.5"
          className="sv-svg-smooth"
        />
      </svg>
    );
  };

  const overallSubtext =
    overallStatus === 'normal'
      ? 'All parameters are within safe limits.'
      : overallStatus === 'warning'
        ? 'Parameters approaching advisory limits.'
        : 'Immediate physical inspection recommended.';

  const axisScaleRatio = (val: number) => Math.min(1, Math.max(0.05, Math.abs(val) / 12));

  return (
    <div className="space-y-4 sv-enter">
      {/* Top Row: Machine Health Overview Title + Overall Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Machine Health Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring of ADXL345 vibration and MAX9814 noise levels
          </p>
        </div>

        {/* Top Right Overall Health Status Card */}
        <div
          className={`flex items-center gap-3.5 rounded-xl border p-3 sm:px-5 sm:py-2.5 backdrop-blur-md transition-all duration-300 ${
            overallStatus === 'anomaly'
              ? 'border-rose-600/80 bg-rose-950/35 sv-anomaly-glow'
              : overallStatus === 'warning'
                ? 'border-amber-700/80 bg-amber-950/30'
                : 'border-emerald-800/70 bg-emerald-950/20'
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-colors duration-300 ${
              overallStatus === 'anomaly'
                ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : overallStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
            }`}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Overall Health Status
            </span>
            <span
              className={`text-base font-bold uppercase tracking-wider block font-sans transition-colors duration-300 ${
                overallStatus === 'anomaly'
                  ? 'text-rose-400'
                  : overallStatus === 'warning'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {overallStatus}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {overallSubtext}
            </span>
          </div>
        </div>
      </div>

      {/* Two Primary Sensor Cards in One Row on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: VIBRATION (CYAN THEME) */}
        <div
          onClick={onOpenVibrationDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onOpenVibrationDetails) {
              e.preventDefault();
              onOpenVibrationDetails();
            }
          }}
          className={`sv-card sv-card-cyan sv-enter-d1 group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#0b1322]/95 p-5 shadow-lg shadow-cyan-950/20 ${
            vibration.status === 'anomaly'
              ? 'border-rose-600/70 sv-anomaly-glow'
              : 'border-cyan-800/50'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <Waves className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vibration</h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-400/90">ADXL345 Accelerometer</span>
                  <span aria-hidden="true">·</span>
                  {renderStreamStateLabel()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusText(vibration.status)}
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Primary Metric + Tri-Axis X/Y/Z Acceleration Readings */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={vibration.resultant}
                  decimals={2}
                  className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums"
                />
                <span className="text-sm font-semibold font-mono text-slate-300">m/s²</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Current Resultant Acceleration</p>
            </div>

            {/* X, Y, Z Axis Acceleration Breakdown with live magnitude bars */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-950/60 px-3 py-2 font-mono text-xs">
              <div className="w-12">
                <span className="text-[10px] text-slate-400 block">X-Axis</span>
                <AnimatedNumber value={vibration.x} decimals={2} className="font-bold text-cyan-300 tabular-nums block" />
                <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 origin-left transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${axisScaleRatio(vibration.x)})` }}
                  />
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="w-12">
                <span className="text-[10px] text-slate-400 block">Y-Axis</span>
                <AnimatedNumber value={vibration.y} decimals={2} className="font-bold text-cyan-300 tabular-nums block" />
                <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 origin-left transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${axisScaleRatio(vibration.y)})` }}
                  />
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="w-12">
                <span className="text-[10px] text-slate-400 block">Z-Axis</span>
                <AnimatedNumber value={vibration.z} decimals={2} className="font-bold text-cyan-300 tabular-nums block" />
                <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 origin-left transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${axisScaleRatio(vibration.z)})` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 self-end">m/s²</span>
            </div>
          </div>

          {/* Real-time ADXL345 Waveform Trace from incoming history */}
          <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/50 px-3 py-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Live Acceleration Waveform (Last {vibSeries.length} samples)</span>
              {mode === 'live' && (deviceStatus === 'offline' || isStale) && (
                <span className="text-amber-400">
                  {deviceStatus === 'offline' ? 'Sensor Disconnected' : 'Signal Stale'}
                </span>
              )}
            </div>
            {buildSparkline(vibSeries, 0, 1.0, '#06b6d4', 'card-vib-wave')}
          </div>

          {/* Bottom 3 metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/90 pt-3 text-left">
            <div>
              <span className="text-[10.5px] text-slate-400 block">RMS</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                <AnimatedNumber value={vibration.rms} decimals={2} /> m/s²
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Peak</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                <AnimatedNumber value={vibration.peak} decimals={2} /> m/s²
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Dominant Freq.</span>
              <span className="text-xs font-bold font-mono text-cyan-300 tabular-nums">
                {vibration.dominantFrequency != null
                  ? `${vibration.dominantFrequency} Hz ${vibration.dominantFreqSource === 'demo' ? '(Demo)' : ''}`
                  : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: NOISE (PURPLE THEME) */}
        <div
          onClick={onOpenNoiseDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onOpenNoiseDetails) {
              e.preventDefault();
              onOpenNoiseDetails();
            }
          }}
          className={`sv-card sv-card-purple sv-enter-d2 group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#0b1322]/95 p-5 shadow-lg shadow-purple-950/20 flex flex-col justify-between ${
            noise.status === 'anomaly'
              ? 'border-rose-600/70 sv-anomaly-glow'
              : 'border-purple-800/50'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Noise</h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="text-purple-400/90">MAX9814 Microphone</span>
                  <span aria-hidden="true">·</span>
                  {renderStreamStateLabel()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusText(noise.status)}
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Primary Metric: Relative Noise Level */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={noise.relativeLevel}
                  decimals={0}
                  className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums"
                />
                <span className="text-sm font-semibold font-mono text-purple-300">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative Sound Level (uncalibrated signal index)
              </p>
            </div>

            {/* Acoustic Envelope Level Meter */}
            <div className="w-full sm:w-40 rounded-xl border border-slate-800/90 bg-slate-950/60 px-3 py-2 font-mono text-[10px]">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Envelope</span>
                <span className="text-purple-300 tabular-nums">{Math.round(noise.relativeLevel)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-300 ease-out ${
                    noise.status === 'anomaly'
                      ? 'bg-rose-500'
                      : noise.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-purple-500'
                  }`}
                  style={{ transform: `scaleX(${Math.min(1, Math.max(0.02, noise.relativeLevel / 100))})` }}
                />
              </div>
            </div>
          </div>

          {/* Real-time MAX9814 Acoustic Waveform Trace */}
          <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/50 px-3 py-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Live Acoustic Envelope (Last {noiseSeries.length} samples)</span>
              {mode === 'live' && (deviceStatus === 'offline' || isStale) && (
                <span className="text-amber-400">
                  {deviceStatus === 'offline' ? 'Sensor Disconnected' : 'Signal Stale'}
                </span>
              )}
            </div>
            {buildSparkline(noiseSeries, 0, 100, '#a855f7', 'card-noise-wave')}
          </div>

          {/* Bottom 3 metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/90 pt-3 text-left">
            <div>
              <span className="text-[10.5px] text-slate-400 block">Peak Level</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                <AnimatedNumber value={noise.peakLevel} decimals={0} />%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Pattern</span>
              <span className="text-xs font-bold font-mono text-slate-100 capitalize">
                {noise.patternState.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Trend</span>
              <span className="text-xs font-bold font-mono text-purple-300">
                {noise.trend || 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
