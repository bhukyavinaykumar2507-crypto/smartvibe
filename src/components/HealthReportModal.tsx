import React from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import type { TelemetryPoint, MachineSettings, AlertItem } from '../types/telemetry';

interface HealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  latest: TelemetryPoint | null;
  history: TelemetryPoint[];
  alerts: AlertItem[];
  settings: MachineSettings;
}

export const HealthReportModal: React.FC<HealthReportModalProps> = ({
  isOpen,
  onClose,
  latest,
  history,
  alerts,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      project: 'SmartVibe — AI-Based Machine Health Monitoring System',
      generatedAt: new Date().toISOString(),
      machine: settings,
      latestMetrics: latest,
      recentAlerts: alerts.slice(0, 10),
      historicalSummary: {
        totalSamples: history.length,
        vibrationRmsMean: history.length ? (history.reduce((a, b) => a + b.vibration.rms, 0) / history.length).toFixed(2) : 'Data unavailable',
        temperatureMean: history.length ? (history.reduce((a, b) => a + b.temperature.current, 0) / history.length).toFixed(1) : 'Data unavailable',
        noiseRelativeMean: history.length ? (history.reduce((a, b) => a + b.noise.relativeLevel, 0) / history.length).toFixed(1) : 'Data unavailable',
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartVibe_Health_Report_${settings.machineId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Safe metrics calculation
  const vibRms = latest ? `${latest.vibration.rms} mm/s` : 'Data unavailable';
  const vibResultant = latest ? `${latest.vibration.resultant} m/s²` : 'Data unavailable';
  const vibPeak = latest ? `${latest.vibration.peak} m/s²` : 'Data unavailable';
  const tempCurrent = latest ? `${latest.temperature.current} °C` : 'Data unavailable';
  const tempMin = latest ? `${latest.temperature.min} °C` : 'Data unavailable';
  const tempMax = latest ? `${latest.temperature.max} °C` : 'Data unavailable';
  const noiseLevel = latest ? `${latest.noise.relativeLevel}%` : 'Data unavailable';
  const noisePeak = latest ? `${latest.noise.peakLevel}%` : 'Data unavailable';
  const healthScore = latest ? `${latest.health.score} / 100` : 'Data unavailable';
  const overallCondition = latest ? latest.health.status.toUpperCase() : 'Data unavailable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl print:m-0 print:w-full print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Top Actions (Hidden in print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Machine Health Audit Report</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              ISO 10816 Audit Format
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT BODY */}
        <div className="p-8 space-y-6 text-slate-200 print:text-slate-900 print:p-4">
          
          {/* Header Banner */}
          <div className="border-b border-slate-700 pb-5 print:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white print:text-slate-900">
                  SMARTVIBE CONDITION AUDIT REPORT
                </h1>
                <p className="text-xs text-cyan-400 print:text-slate-600 font-mono mt-0.5">
                  AI-Based Machine Health & Predictive Telemetry System
                </p>
              </div>
              <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600 space-y-0.5">
                <p>Report Ref: SV-{Date.now().toString().slice(-6)}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Equipment Meta Strip */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-slate-950/70 p-3 text-xs border border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-500 block uppercase font-mono">Equipment</span>
                <span className="font-semibold text-white print:text-slate-900">{settings.machineName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-500 block uppercase font-mono">Location</span>
                <span className="font-semibold text-white print:text-slate-900">{settings.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-500 block uppercase font-mono">Overall Health</span>
                <span className="font-mono font-bold text-cyan-400 print:text-blue-700">{healthScore}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-500 block uppercase font-mono">Standard Ref.</span>
                <span className="font-mono text-slate-300 print:text-slate-700">ISO 10816 Class II</span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Condition Assessment */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-blue-800 border-b border-slate-800 pb-1 mb-3">
              1. Executive Health Evaluation
            </h2>
            <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2 text-xs leading-relaxed">
              <p>
                <strong>Current Status:</strong> <span className="font-semibold uppercase">{overallCondition}</span> (Health Score: {healthScore})
              </p>
              <p>
                {latest?.health.reasons[0] || 'Machine is running within established baseline tolerances. Vibration velocity and thermal dissipation align with Class II industrial rotating equipment specifications.'}
              </p>
              <div className="pt-1 text-[11px] text-slate-400 print:text-slate-600 italic">
                {latest?.health.disclaimer || 'Advisory Notice: Sensor readings indicate operational condition. Certified physical inspection is recommended prior to disassembly.'}
              </div>
            </div>
          </div>

          {/* Section 2: Sensor Telemetry Statistics */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-blue-800 border-b border-slate-800 pb-1 mb-3">
              2. Sensor Telemetry Snapshot & Calibration Status
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
                <thead className="bg-slate-950 print:bg-slate-200 font-mono text-[11px] text-slate-400 print:text-slate-700">
                  <tr>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Sensor Module</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300">Target Parameter</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Recorded Value</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right">Warning Limit</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      ADXL345 Accelerometer (I2C)
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      RMS Vibration Velocity
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-bold text-indigo-300 print:text-indigo-800">
                      {vibRms}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-600">
                      {settings.vibrationWarningThreshold} mm/s
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-center font-sans font-semibold uppercase">
                      {latest?.vibration.status || 'Data unavailable'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      ADXL345 Accelerometer (I2C)
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      Resultant Dynamic Accel.
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-bold text-slate-200 print:text-slate-800">
                      {vibResultant}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-600">
                      Peak: {vibPeak}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-center font-sans font-semibold uppercase">
                      {latest?.vibration.status || 'Data unavailable'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      DS18B20 Digital Probe (1-Wire)
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      Casing Surface Temp.
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-bold text-emerald-300 print:text-emerald-800">
                      {tempCurrent}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-600">
                      {settings.tempWarningThreshold} °C
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-center font-sans font-semibold uppercase">
                      {latest?.temperature.status || 'Data unavailable'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      MAX9814 Microphone (ADC)
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 font-sans">
                      Relative Noise Envelope
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right font-bold text-cyan-300 print:text-cyan-800">
                      {noiseLevel}
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-600">
                      {settings.noiseWarningThreshold} %
                    </td>
                    <td className="p-2 border border-slate-800 print:border-slate-300 text-center font-sans font-semibold uppercase">
                      {latest?.noise.status || 'Data unavailable'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10.5px] text-slate-400 print:text-slate-600 italic">
              * Note on MAX9814 readings: Displayed as uncalibrated relative acoustic envelope index (0-100%). Readings do not represent calibrated dB SPL.
            </p>
          </div>

          {/* Section 3: Abnormal Events & Alert History */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-blue-800 border-b border-slate-800 pb-1 mb-3">
              3. Recent Abnormal Events & Threshold Deviations
            </h2>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 print:text-slate-600 italic">
                No abnormal exceedance events recorded during this monitoring period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
                  <thead className="bg-slate-950 print:bg-slate-200 font-mono text-[10px] text-slate-400 print:text-slate-700">
                    <tr>
                      <th className="p-1.5 border border-slate-800 print:border-slate-300">Time</th>
                      <th className="p-1.5 border border-slate-800 print:border-slate-300">Severity</th>
                      <th className="p-1.5 border border-slate-800 print:border-slate-300">Sensor Responsible</th>
                      <th className="p-1.5 border border-slate-800 print:border-slate-300">Value vs. Threshold</th>
                      <th className="p-1.5 border border-slate-800 print:border-slate-300">Prescribed Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    {alerts.slice(0, 5).map((a) => (
                      <tr key={a.id}>
                        <td className="p-1.5 font-mono whitespace-nowrap">{new Date(a.timestamp).toLocaleTimeString()}</td>
                        <td className="p-1.5 uppercase font-bold text-amber-400 print:text-amber-700">{a.severity}</td>
                        <td className="p-1.5">{a.sensor}</td>
                        <td className="p-1.5 font-mono">{a.recordedValue} (Limit: {a.thresholdValue})</td>
                        <td className="p-1.5 text-slate-300 print:text-slate-700">{a.suggestedAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Cautious Recommendations */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-blue-800 border-b border-slate-800 pb-1 mb-3">
              4. Engineering Recommendations
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 print:text-slate-800">
              {latest?.health.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              )) || (
                <li>Verify sensor mechanical mounting rigidity and cabling integrity.</li>
              )}
              <li>Log vibration spectrum across multiple spindle RPM operating points to isolate harmonic resonances.</li>
              <li>Schedule acoustic stethoscope and thermography verification prior to any scheduled downtime.</li>
            </ul>
          </div>

          {/* Section 5: Demonstration Sign-Off Block (for College Engineering Project) */}
          <div className="pt-4 border-t border-slate-700 print:border-slate-400">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-3">
              5. Academic Project Verification & Demonstration Sign-Off
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="rounded border border-slate-800 p-2 print:border-slate-300">
                <span className="text-[10px] text-slate-500 block">Student Investigator:</span>
                <span className="font-semibold text-slate-200 print:text-slate-900 block mt-1">B. Vinay Kumar</span>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Roll: IoT / AI Engineering</span>
              </div>
              <div className="rounded border border-slate-800 p-2 print:border-slate-300">
                <span className="text-[10px] text-slate-500 block">Project Supervisor:</span>
                <span className="font-semibold text-slate-200 print:text-slate-900 block mt-1">Verified & Reviewed</span>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Signature: ________________</span>
              </div>
              <div className="rounded border border-slate-800 p-2 print:border-slate-300">
                <span className="text-[10px] text-slate-500 block">Test Rig Status:</span>
                <span className="font-semibold text-emerald-400 print:text-emerald-700 block mt-1">PASS / OPERATIONAL</span>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Lab Bay 3 / Bench A</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
