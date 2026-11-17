import React, { useState } from 'react';
import { FileText, Download, CloudUpload, Printer, X, CheckCircle2 } from 'lucide-react';
import type { TelemetryPoint, AlertItem } from '../types/telemetry';
import { uploadReportToDrive, getAccessToken } from '../services/googleDrive';

interface HealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  latest: TelemetryPoint;
  history: TelemetryPoint[];
  alerts: AlertItem[];
  aiSummary: string | null;
}

export const HealthReportModal: React.FC<HealthReportModalProps> = ({
  isOpen,
  onClose,
  latest,
  history,
  alerts,
  aiSummary,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const avgVib = history.length
    ? (history.reduce((s, p) => s + p.vibration.resultant, 0) / history.length).toFixed(2)
    : latest.vibration.resultant.toFixed(2);
  const avgNoise = history.length
    ? Math.round(history.reduce((s, p) => s + p.noise.relativeLevel, 0) / history.length)
    : latest.noise.relativeLevel;

  const buildReportHtml = () => {
    const generatedAt = new Date().toLocaleString();
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SmartVibe Machine Health Report — ${latest.machineName}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; max-width: 820px; margin: 32px auto; padding: 0 20px; }
    h1 { color: #0e7490; margin-bottom: 4px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
    .val { font-size: 20px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background: #e2e8f0; }
  </style>
</head>
<body>
  <h1>SmartVibe — Machine Health Report</h1>
  <div class="meta">Machine: ${latest.machineName} | Mode: ${latest.mode.toUpperCase()} | Generated: ${generatedAt}</div>
  <div class="grid">
    <div class="card"><div class="label">Overall Health Score</div><div class="val">${latest.health.score}/100 (${latest.health.status.toUpperCase()})</div></div>
    <div class="card"><div class="label">ADXL345 Vibration</div><div class="val">${latest.vibration.resultant.toFixed(2)} m/s² (Avg ${avgVib})</div></div>
    <div class="card"><div class="label">MAX9814 Relative Noise</div><div class="val">${latest.noise.relativeLevel}% (Avg ${avgNoise}%)</div></div>
  </div>
  <h3>Diagnostic Summary</h3>
  <p>${(aiSummary || latest.health.recommendation).replace(/\n/g, '<br/>')}</p>
  <h3>Recent Alerts (${alerts.length})</h3>
  <table>
    <thead><tr><th>Time</th><th>Severity</th><th>Sensor</th><th>Value</th><th>Message</th></tr></thead>
    <tbody>
      ${alerts.slice(0, 12).map((a) => `<tr><td>${new Date(a.timestamp).toLocaleTimeString()}</td><td>${a.severity}</td><td>${a.sensor}</td><td>${a.value}</td><td>${a.message}</td></tr>`).join('') || '<tr><td colspan="5">No alerts recorded</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
  };

  const handleDownloadHtml = () => {
    const html = buildReportHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartvibe-report-${latest.machineId}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadDrive = async () => {
    setUploading(true);
    setUploadStatus(null);
    setUploadError(null);
    try {
      const html = buildReportHtml();
      const fileName = `SmartVibe_Report_${latest.machineId}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`;
      const uploaded = await uploadReportToDrive(fileName, html, 'text/html');
      setUploadStatus(`Uploaded "${uploaded.name}" to Google Drive.`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Drive upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const hasDriveToken = Boolean(getAccessToken());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0b1322] p-6 shadow-2xl sv-tab-enter max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Machine Health Report</h3>
              <p className="text-xs text-slate-400">
                2-Sensor Summary (ADXL345 Vibration + MAX9814 Noise)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[10.5px] text-slate-400 uppercase block">Health Score</span>
            <span className="text-xl font-extrabold font-mono text-white">
              {latest.health.score}/100
            </span>
            <span className="text-xs text-cyan-400 block capitalize">{latest.health.status}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[10.5px] text-slate-400 uppercase block">ADXL345 Avg Vib</span>
            <span className="text-xl font-extrabold font-mono text-cyan-300">{avgVib} m/s²</span>
            <span className="text-xs text-slate-400 block">Peak {latest.vibration.peak.toFixed(2)} m/s²</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[10.5px] text-slate-400 uppercase block">MAX9814 Avg Noise</span>
            <span className="text-xl font-extrabold font-mono text-purple-300">{avgNoise}%</span>
            <span className="text-xs text-slate-400 block">Peak {latest.noise.peakLevel}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 mb-5">
          <h4 className="text-xs font-bold text-slate-300 mb-1.5">AI & Rule Diagnostic Summary</h4>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {aiSummary || latest.health.recommendation}
          </p>
        </div>

        {uploadStatus && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            {uploadError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>

          <button
            onClick={handleUploadDrive}
            disabled={uploading || !hasDriveToken}
            title={hasDriveToken ? 'Upload to SmartVibe_Machine_Reports' : 'Sign in via Google Drive tab first'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <CloudUpload className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Save to Google Drive'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
