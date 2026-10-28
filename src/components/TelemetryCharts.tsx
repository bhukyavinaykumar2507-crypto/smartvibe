import React, { useState } from 'react';
import { InteractiveChart } from './InteractiveChart';
import type { TelemetryPoint, MachineSettings } from '../types/telemetry';
import { Filter, Layers, Activity } from 'lucide-react';

interface TelemetryChartsProps {
  points: TelemetryPoint[];
  settings: MachineSettings;
  selectedRange: '15m' | '1h' | '24h' | '7d';
  onRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  points,
  settings,
  selectedRange,
  onRangeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vibration' | 'temperature' | 'noise' | 'correlation'>('all');

  const timestamps = points.map((p) => p.timestamp);
  const vibRms = points.map((p) => p.vibration.rms);
  const vibResultant = points.map((p) => p.vibration.resultant);
  const tempValues = points.map((p) => p.temperature.current);
  const noiseValues = points.map((p) => p.noise.relativeLevel);
  const healthScores = points.map((p) => p.health.score);

  // Normalized correlation values (0 - 100 scale for comparison)
  const normVib = vibRms.map((v) => Math.min(100, Math.round((v / (settings.vibrationCriticalThreshold * 1.2)) * 100)));
  const normTemp = tempValues.map((t) => Math.min(100, Math.round((t / (settings.tempCriticalThreshold * 1.2)) * 100)));

  return (
    <div className="space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 backdrop-blur-md">
        
        {/* View Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sensors
          </button>
          <button
            onClick={() => setActiveTab('vibration')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'vibration'
                ? 'bg-indigo-950/80 text-indigo-300 ring-1 ring-indigo-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vibration (ADXL345)
          </button>
          <button
            onClick={() => setActiveTab('temperature')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'temperature'
                ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature (DS18B20)
          </button>
          <button
            onClick={() => setActiveTab('noise')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'noise'
                ? 'bg-cyan-950/80 text-cyan-300 ring-1 ring-cyan-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Noise Envelope (MAX9814)
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'correlation'
                ? 'bg-purple-950/80 text-purple-300 ring-1 ring-purple-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Multi-Sensor Correlation</span>
          </button>
        </div>

        {/* Time Window Range Filters */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <Filter className="h-3.5 w-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {(['15m', '1h', '24h', '7d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`rounded px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
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

      {/* Render Charts */}
      {(activeTab === 'all' || activeTab === 'vibration') && (
        <InteractiveChart
          title="Vibration Trend — ADXL345 Accelerometer"
          subtitle="Resultant dynamic acceleration (m/s²) and ISO 10816 RMS velocity (mm/s)"
          timestamps={timestamps}
          series={[
            { name: 'Resultant (m/s²)', color: '#38bdf8', unit: 'm/s²', values: vibResultant },
            { name: 'RMS (mm/s)', color: '#818cf8', unit: 'mm/s', values: vibRms },
          ]}
          thresholdWarning={settings.vibrationWarningThreshold}
          thresholdCritical={settings.vibrationCriticalThreshold}
          height={210}
        />
      )}

      {(activeTab === 'all' || activeTab === 'temperature') && (
        <InteractiveChart
          title="Temperature Trend — DS18B20 Digital Sensor"
          subtitle="Machine casing and bearing surface temperature (°C)"
          timestamps={timestamps}
          series={[
            { name: 'Temperature (°C)', color: '#34d399', unit: '°C', values: tempValues },
          ]}
          thresholdWarning={settings.tempWarningThreshold}
          thresholdCritical={settings.tempCriticalThreshold}
          height={210}
        />
      )}

      {(activeTab === 'all' || activeTab === 'noise') && (
        <InteractiveChart
          title="Acoustic Signal Envelope — MAX9814 Microphone"
          subtitle="Relative amplitude index (0-100%). Uncalibrated ADC envelope; not calibrated dB SPL"
          timestamps={timestamps}
          series={[
            { name: 'Relative Level (%)', color: '#06b6d4', unit: '%', values: noiseValues },
          ]}
          thresholdWarning={settings.noiseWarningThreshold}
          thresholdCritical={settings.noiseCriticalThreshold}
          height={210}
          yMin={0}
          yMax={100}
        />
      )}

      {(activeTab === 'all' || activeTab === 'correlation') && (
        <InteractiveChart
          title="Multi-Sensor Correlation & Health Impact"
          subtitle="Simultaneous overlay of normalized sensor stress factors vs. Holistic Machine Health Score"
          timestamps={timestamps}
          series={[
            { name: 'Vibration Normalized (%)', color: '#818cf8', unit: '%', values: normVib },
            { name: 'Thermal Normalized (%)', color: '#34d399', unit: '%', values: normTemp },
            { name: 'Acoustic Relative (%)', color: '#06b6d4', unit: '%', values: noiseValues },
            { name: 'Health Score (0-100)', color: '#f59e0b', unit: 'pts', values: healthScores },
          ]}
          height={230}
          yMin={0}
          yMax={105}
        />
      )}
    </div>
  );
};
