import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Check, CheckCircle2, ShieldAlert, Cpu, AlertTriangle, Radio, Globe, Wifi } from 'lucide-react';
import type { MachineSettings } from '../types/telemetry';
import { getCustomApiUrl, setCustomApiUrl, testBackendConnection } from '../services/api';

interface SettingsModalProps {
  settings: MachineSettings;
  onSaveSettings: (newSettings: Partial<MachineSettings>) => Promise<void>;
  hardwareStatus: {
    adxl345Connected: boolean;
    ds18b20Connected: boolean;
    max9814Connected: boolean;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  hardwareStatus,
}) => {
  const [formData, setFormData] = useState<MachineSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customUrl, setCustomUrl] = useState(getCustomApiUrl());
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; testing?: boolean } | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const scenarios = [
    { id: 'normal', name: 'Nominal Normal Operation', desc: 'Baseline vibration (1.2 m/s²), stable temp (38°C), nominal acoustics (32%)' },
    { id: 'bearing_wear', name: 'Bearing Degradation Simulation', desc: 'Elevated RMS vibration (3.8 m/s²), high friction acoustics (72%), thermal creep' },
    { id: 'overheating', name: 'Thermal Overload Simulation', desc: 'Temperature climbs above 70°C, triggers thermal warnings' },
    { id: 'unbalance', name: 'Rotor Dynamic Unbalance', desc: 'Severe 1X harmonic acceleration spikes (5.2 m/s² RMS, Critical Anomaly)' },
    { id: 'acoustic_spike', name: 'Acoustic Interference / Cavitation', desc: 'High relative sound peaks (85%) with normal mechanical vibration' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Sensor Settings & Threshold Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Adjust ADXL345 vibration parameters (m/s²), DS18B20 thermal cutoffs (°C), MAX9814 acoustic limits (%), and operational modes
            </p>
          </div>
        </div>
      </div>

      {/* Sensor Hardware Connection Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          Active Hardware Sensor Bus Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${hardwareStatus.adxl345Connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">ADXL345 Accelerometer</span>
                <span className="text-[10px] font-mono text-slate-400">I2C Bus (0x53)</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-medium">
              {hardwareStatus.adxl345Connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${hardwareStatus.ds18b20Connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">DS18B20 Digital Temp</span>
                <span className="text-[10px] font-mono text-slate-400">1-Wire GPIO 4</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-medium">
              {hardwareStatus.ds18b20Connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${hardwareStatus.max9814Connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">MAX9814 Microphone</span>
                <span className="text-[10px] font-mono text-slate-400">ADC1 GPIO 34</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-medium">
              {hardwareStatus.max9814Connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Machine Selection & Operational Mode */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">
            Machine Profile & Operating Mode
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Monitored Machine Identification
              </label>
              <select
                value={formData.machineId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'machine_01') {
                    setFormData({
                      ...formData,
                      machineId: val,
                      machineName: 'Machine 01 — CNC Spindle Drive',
                      machineType: 'Three-Phase AC Induction Motor & Milling Spindle',
                    });
                  } else if (val === 'machine_02') {
                    setFormData({
                      ...formData,
                      machineId: val,
                      machineName: 'Machine 02 — Centrifugal Water Pump',
                      machineType: 'Centrifugal Slurry Pump with Impeller Bearing',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      machineId: val,
                      machineName: 'Machine 03 — Exhaust Ventilation Blower',
                      machineType: 'Heavy-Duty Industrial Centrifugal Fan',
                    });
                  }
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="machine_01">Machine 01 — CNC Spindle Drive (Induction Motor)</option>
                <option value="machine_02">Machine 02 — Centrifugal Water Pump</option>
                <option value="machine_03">Machine 03 — Exhaust Ventilation Blower</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Data Ingestion Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'demo' })}
                  className={`flex items-center justify-center gap-2 rounded-lg p-2.5 text-xs font-medium border transition-colors ${
                    formData.mode === 'demo'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Demo Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'live' })}
                  className={`flex items-center justify-center gap-2 rounded-lg p-2.5 text-xs font-medium border transition-colors ${
                    formData.mode === 'live'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Live Sensor Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Demo Mode Scenario Selector */}
          {formData.mode === 'demo' && (
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 mt-2">
              <label className="text-xs font-semibold text-cyan-400 block mb-2">
                College Project Defense / Demo Fault Injector:
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Select an operational simulation scenario to demonstrate real-time fault detection to evaluators:
              </p>
              <div className="space-y-2">
                {scenarios.map((sc) => (
                  <label
                    key={sc.id}
                    className={`flex items-start gap-3 rounded-lg p-2.5 border cursor-pointer transition-colors ${
                      formData.demoScenario === sc.id
                        ? 'bg-slate-900 border-cyan-500/60 text-white'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:bg-slate-900/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      checked={formData.demoScenario === sc.id}
                      onChange={() => setFormData({ ...formData, demoScenario: sc.id as any })}
                      className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-200 block">{sc.name}</span>
                      <span className="text-[11px] text-slate-400 block">{sc.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sensor Threshold Rules */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md space-y-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Threshold Rules & Warning Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Temperature Thresholds */}
            <div className="rounded-lg bg-slate-950/60 p-4 border border-emerald-900/30 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
                DS18B20 Temperature (°C)
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Warning Threshold (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.tempWarningThreshold}
                  onChange={(e) => setFormData({ ...formData, tempWarningThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Critical Threshold (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.tempCriticalThreshold}
                  onChange={(e) => setFormData({ ...formData, tempCriticalThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Vibration Thresholds (Baseline Rules) */}
            <div className="rounded-lg bg-slate-950/60 p-4 border border-indigo-900/30 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide block">
                ADXL345 Vibration RMS (m/s²)
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Baseline (Normal) (m/s²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vibrationBaseline}
                  onChange={(e) => setFormData({ ...formData, vibrationBaseline: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Warning Threshold (m/s²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vibrationWarningThreshold}
                  onChange={(e) => setFormData({ ...formData, vibrationWarningThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Critical Threshold (m/s²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vibrationCriticalThreshold}
                  onChange={(e) => setFormData({ ...formData, vibrationCriticalThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Noise Thresholds */}
            <div className="rounded-lg bg-slate-950/60 p-4 border border-cyan-900/30 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide block">
                MAX9814 Relative Noise (%)
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Relative Warning Level (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.noiseWarningThreshold}
                  onChange={(e) => setFormData({ ...formData, noiseWarningThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Relative Critical Level (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.noiseCriticalThreshold}
                  onChange={(e) => setFormData({ ...formData, noiseCriticalThreshold: Number(e.target.value) })}
                  className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                * Note: MAX9814 values represent ADC peak envelope amplitude percentage, not calibrated dB SPL.
              </p>
            </div>

          </div>
        </div>

        {/* Android APK & Remote Backend Server Configuration */}
        <div className="rounded-xl border border-blue-900/40 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Android APK & Remote Server Connectivity
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            When installed on an Android device, enter your SmartVibe backend server address (e.g. your PC's Wi-Fi IP or Cloud Run URL). Leave empty to use local simulated telemetry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="e.g. http://192.168.1.100:3000 or https://smartvibe.run.app"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setTestResult(null);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!customUrl.trim()) {
                  setTestResult({ success: true, message: 'Using local offline telemetry simulator.' });
                  return;
                }
                setTestResult({ testing: true });
                const res = await testBackendConnection(customUrl);
                setTestResult(res);
              }}
              disabled={testResult?.testing}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/40 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-900/40 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <Wifi className={`h-3.5 w-3.5 ${testResult?.testing ? 'animate-pulse' : ''}`} />
              <span>{testResult?.testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomApiUrl(customUrl);
                setTestResult({ success: true, message: 'Saved backend URL!' });
                setTimeout(() => setTestResult(null), 3000);
              }}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              Save URL
            </button>
          </div>
          {testResult && !testResult.testing && (
            <div className={`mt-3 rounded-lg p-2.5 text-xs font-mono flex items-center gap-2 border ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-4 w-4" />
              <span>Settings successfully updated!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Apply Threshold Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
