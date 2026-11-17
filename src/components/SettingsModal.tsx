import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import type { MachineSettings } from '../types/telemetry';

interface SettingsModalProps {
  settings: MachineSettings;
  onSave: (updated: Partial<MachineSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave }) => {
  const [form, setForm] = useState<MachineSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      await onSave(form);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setForm({
      ...form,
      vibWarningThreshold: 0.45,
      vibAnomalyThreshold: 0.85,
      noiseWarningThreshold: 72,
      noiseAnomalyThreshold: 88,
      esp32TimeoutSeconds: 15,
    });
  };

  return (
    <div className="sv-enter rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-6 shadow-lg max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <Settings className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">System & Threshold Settings</h2>
            <p className="text-xs text-slate-400">
              Configure ADXL345 vibration limits, MAX9814 noise thresholds, and ESP32 telemetry mode
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Operation Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Telemetry Data Source Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, mode: 'demo' })}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                form.mode === 'demo'
                  ? 'border-cyan-500/60 bg-cyan-950/35 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="text-xs font-bold">Demo Simulation Mode</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Streams synthetic ADXL345 & MAX9814 telemetry every 2 seconds for demonstration.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, mode: 'live' })}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                form.mode === 'live'
                  ? 'border-emerald-500/60 bg-emerald-950/30 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="text-xs font-bold">Live ESP32 Hardware Mode</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Accepts genuine HTTP POST packets from your ESP32 node. Marks Offline when idle.
              </p>
            </button>
          </div>
        </div>

        {/* ADXL345 Vibration Thresholds */}
        <div className="rounded-xl border border-cyan-900/40 bg-slate-950/50 p-4 space-y-4">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            ADXL345 Vibration Thresholds (Resultant m/s²)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Warning Limit (m/s²)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="10"
                value={form.vibWarningThreshold}
                onChange={(e) =>
                  setForm({ ...form, vibWarningThreshold: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Anomaly Limit (m/s²)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="20"
                value={form.vibAnomalyThreshold}
                onChange={(e) =>
                  setForm({ ...form, vibAnomalyThreshold: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* MAX9814 Noise Thresholds */}
        <div className="rounded-xl border border-purple-900/40 bg-slate-950/50 p-4 space-y-4">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            MAX9814 Acoustic Thresholds (Relative Sound Index %)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Warning Limit (%)
              </label>
              <input
                type="number"
                step="1"
                min="10"
                max="95"
                value={form.noiseWarningThreshold}
                onChange={(e) =>
                  setForm({ ...form, noiseWarningThreshold: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Anomaly Limit (%)
              </label>
              <input
                type="number"
                step="1"
                min="20"
                max="100"
                value={form.noiseAnomalyThreshold}
                onChange={(e) =>
                  setForm({ ...form, noiseAnomalyThreshold: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">
            ESP32 Stale / Offline Timeout (Seconds)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={form.esp32TimeoutSeconds}
            onChange={(e) =>
              setForm({ ...form, esp32TimeoutSeconds: Number(e.target.value) })
            }
            className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {savedBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300 sv-tab-enter">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Settings updated cleanly.</span>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-60 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
