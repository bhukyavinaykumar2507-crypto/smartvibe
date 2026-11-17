import React, { useState } from 'react';
import { Waves, Volume2, Pause, Play } from 'lucide-react';
import type { TelemetryPoint } from '../types/telemetry';
import { InteractiveChart } from './InteractiveChart';
import { IndividualTrendCharts } from './IndividualTrendCharts';
import { AnimatedNumber } from './AnimatedNumber';

interface TelemetryChartsProps {
  points: TelemetryPoint[];
  latest: TelemetryPoint;
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  deviceStatus: 'online' | 'offline';
  mode: 'demo' | 'live';
  lastUpdated: string;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  points,
  latest,
  selectedRange,
  onRangeChange,
  isStreaming,
  onToggleStreaming,
  deviceStatus,
  mode,
  lastUpdated,
}) => {
  const [focusSensor, setFocusSensor] = useState<'all' | 'vibration' | 'noise'>('all');

  return (
    <div className="space-y-5 sv-enter">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-4">
        <div>
          <h2 className="text-lg font-bold text-white">Live Sensor Monitoring</h2>
          <p className="text-xs text-slate-400">
            High-resolution telemetry stream from ADXL345 accelerometer and MAX9814 acoustic sensor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
            {(
              [
                { id: 'all', label: 'All Sensors' },
                { id: 'vibration', label: 'ADXL345 Vib' },
                { id: 'noise', label: 'MAX9814 Noise' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setFocusSensor(item.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  focusSensor === item.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleStreaming}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isStreaming
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-950/60'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Tri-Axial & Acoustic Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sv-card sv-card-cyan rounded-2xl border border-cyan-800/40 bg-[#0b1322]/95 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Waves className="h-4 w-4" />
              ADXL345 Tri-Axial Acceleration
            </span>
            <span className="font-mono text-xs text-white font-bold tabular-nums">
              <AnimatedNumber value={latest.vibration.resultant} decimals={2} /> m/s²
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            {[
              { label: 'X-Axis', val: latest.vibration.x },
              { label: 'Y-Axis', val: latest.vibration.y },
              { label: 'Z-Axis', val: latest.vibration.z },
            ].map((axis) => (
              <div key={axis.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-[10px] text-slate-400 block">{axis.label}</span>
                <AnimatedNumber value={axis.val} decimals={3} className="text-sm font-bold text-cyan-300 tabular-nums" />
              </div>
            ))}
          </div>
        </div>

        <div className="sv-card sv-card-purple rounded-2xl border border-purple-800/40 bg-[#0b1322]/95 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-purple-300">
              <Volume2 className="h-4 w-4" />
              MAX9814 Acoustic Telemetry
            </span>
            <span className="font-mono text-xs text-white font-bold tabular-nums">
              <AnimatedNumber value={latest.noise.relativeLevel} decimals={0} />%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="text-[10px] text-slate-400 block">Peak Level</span>
              <AnimatedNumber value={latest.noise.peakLevel} decimals={0} className="text-sm font-bold text-purple-300 tabular-nums" />%
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="text-[10px] text-slate-400 block">Pattern</span>
              <span className="text-xs font-bold text-slate-100 capitalize">
                {latest.noise.patternState.replace('_', ' ')}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="text-[10px] text-slate-400 block">Trend</span>
              <span className="text-xs font-bold text-purple-300">{latest.noise.trend}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focused Interactive Chart */}
      <InteractiveChart
        points={points}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        focusSensor={focusSensor}
        deviceStatus={deviceStatus}
        mode={mode}
        isStreaming={isStreaming}
        lastUpdated={lastUpdated}
      />

      {/* Side-by-side Trend Charts */}
      <IndividualTrendCharts
        points={points}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        deviceStatus={deviceStatus}
        mode={mode}
        isStreaming={isStreaming}
        lastUpdated={lastUpdated}
      />
    </div>
  );
};
