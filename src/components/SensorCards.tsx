import React from 'react';
import { 
  Waves, 
  Thermometer, 
  Volume2, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert 
} from 'lucide-react';
import type { 
  VibrationReading, 
  TemperatureReading, 
  NoiseReading, 
  HealthStatus 
} from '../types/telemetry';

interface SensorCardsProps {
  vibration: VibrationReading;
  temperature: TemperatureReading;
  noise: NoiseReading;
  overallStatus: HealthStatus;
  onOpenVibrationDetails?: () => void;
  onOpenTemperatureDetails?: () => void;
  onOpenNoiseDetails?: () => void;
}

export const SensorCards: React.FC<SensorCardsProps> = ({
  vibration,
  temperature,
  noise,
  overallStatus,
  onOpenVibrationDetails,
  onOpenTemperatureDetails,
  onOpenNoiseDetails,
}) => {
  const getStatusPill = (status: HealthStatus) => {
    switch (status) {
      case 'anomaly':
        return (
          <span className="flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
            Anomaly
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            Warning
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            Normal
          </span>
        );
    }
  };

  const overallSubtext = overallStatus === 'normal' 
    ? 'All parameters are within safe limits.' 
    : overallStatus === 'warning'
      ? 'Parameters approaching advisory limits.'
      : 'Immediate physical inspection recommended.';

  return (
    <div className="space-y-4">
      
      {/* Top Row: Machine Health Overview Title + Overall Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Machine Health Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring of vibration, temperature and noise levels
          </p>
        </div>

        {/* Top Right Overall Health Status Card */}
        <div className={`flex items-center gap-3.5 rounded-xl border p-3 sm:px-5 sm:py-2.5 backdrop-blur-md transition-all ${
          overallStatus === 'anomaly'
            ? 'border-rose-800/80 bg-rose-950/30'
            : overallStatus === 'warning'
              ? 'border-amber-800/80 bg-amber-950/30'
              : 'border-emerald-800/70 bg-emerald-950/20'
        }`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
            overallStatus === 'anomaly'
              ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : overallStatus === 'warning'
                ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
          }`}>
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Overall Health Status
            </span>
            <span className={`text-base font-bold uppercase tracking-wider block font-sans ${
              overallStatus === 'anomaly'
                ? 'text-rose-400'
                : overallStatus === 'warning'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}>
              {overallStatus}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {overallSubtext}
            </span>
          </div>
        </div>
      </div>

      {/* Three Primary Sensor Cards in One Row on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: VIBRATION (CYAN THEME) */}
        <div 
          onClick={onOpenVibrationDetails}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-cyan-800/50 bg-[#0b1322] p-5 shadow-lg shadow-cyan-950/20 hover:border-cyan-500/70 transition-all duration-300"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <Waves className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Vibration</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {getStatusPill(vibration.status)}
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>

          {/* Primary Metric: Current Acceleration */}
          <div className="mt-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {vibration.resultant.toFixed(2)}
              </span>
              <span className="text-sm font-semibold font-mono text-slate-300">m/s²</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Current Acceleration</p>
          </div>

          {/* Bottom 3 metrics */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/90 pt-3 text-left">
            <div>
              <span className="text-[10.5px] text-slate-400 block">RMS</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                {vibration.rms.toFixed(2)} m/s²
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Peak</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                {vibration.peak.toFixed(2)} m/s²
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

        {/* CARD 2: TEMPERATURE (ORANGE THEME) */}
        <div 
          onClick={onOpenTemperatureDetails}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-800/50 bg-[#0b1322] p-5 shadow-lg shadow-amber-950/20 hover:border-amber-500/70 transition-all duration-300"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <Thermometer className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Temperature</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {getStatusPill(temperature.status)}
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>

          {/* Primary Metric: Current Temperature */}
          <div className="mt-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {temperature.current.toFixed(1)}
              </span>
              <span className="text-sm font-semibold font-mono text-amber-300">°C</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Current Temperature</p>
          </div>

          {/* Bottom 3 metrics */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/90 pt-3 text-left">
            <div>
              <span className="text-[10.5px] text-slate-400 block">Min</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                {temperature.min}°C
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Max</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                {temperature.max}°C
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block">Threshold</span>
              <span className="text-xs font-bold font-mono text-amber-400 tabular-nums">
                {temperature.criticalThreshold || 70}°C
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: NOISE (PURPLE THEME) */}
        <div 
          onClick={onOpenNoiseDetails}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-800/50 bg-[#0b1322] p-5 shadow-lg shadow-purple-950/20 hover:border-purple-500/70 transition-all duration-300"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <Volume2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Noise</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {getStatusPill(noise.status)}
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
          </div>

          {/* Primary Metric: Relative Noise Level */}
          <div className="mt-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {Math.round(noise.relativeLevel)}
              </span>
              <span className="text-sm font-semibold font-mono text-purple-300">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Relative Noise Level</p>
          </div>

          {/* Bottom 2 metrics */}
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-800/90 pt-3 text-left">
            <div>
              <span className="text-[10.5px] text-slate-400 block">Peak Level</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                {Math.round(noise.peakLevel)}%
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
