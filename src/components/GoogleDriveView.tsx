import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  FolderCheck,
  Search,
  Download,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { TelemetryPoint, MachineSettings } from '../types/telemetry';
import { 
  googleSignIn, 
  logoutGoogle, 
  listSmartVibeFiles, 
  uploadReportToDrive, 
  deleteFileFromDrive,
  DriveFile 
} from '../services/googleDrive';

interface GoogleDriveViewProps {
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onSignOut: () => void;
  latestData: TelemetryPoint | null;
  historyData: TelemetryPoint[];
  settings: MachineSettings;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({
  currentUser,
  accessToken,
  onAuthSuccess,
  onSignOut,
  latestData,
  historyData,
  settings,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive Action Confirmation Modal State
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load files when authenticated
  const loadFiles = async () => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const data = await listSmartVibeFiles();
      setFiles(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to list files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    onSignOut();
    setFiles([]);
  };

  // Upload current machine health audit report
  const handleUploadCurrentReport = async () => {
    if (!latestData) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const reportPayload = {
        title: `SmartVibe Machine Health Audit - ${settings.machineName}`,
        generatedAt: new Date().toISOString(),
        machineId: settings.machineId,
        machineName: settings.machineName,
        location: settings.location,
        overallStatus: latestData.health.status.toUpperCase(),
        healthScore: latestData.health.score,
        metrics: {
          vibrationRms: `${latestData.vibration.rms} m/s²`,
          vibrationPeak: `${latestData.vibration.peak} m/s²`,
          vibrationDominantFreq: `${latestData.vibration.dominantFrequency || 48.7} Hz`,
          temperature: `${latestData.temperature.current} °C`,
          noiseRelativeLevel: `${latestData.noise.relativeLevel}%`,
          noisePattern: latestData.noise.patternState,
        },
        reasons: latestData.health.reasons,
        recommendations: latestData.health.recommendations,
        standardCompliance: 'Configured Baseline Threshold Health Rules',
        disclaimer: latestData.health.disclaimer
      };

      const filename = `SmartVibe_Health_Audit_${settings.machineId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const uploadedFile = await uploadReportToDrive(filename, JSON.stringify(reportPayload, null, 2), 'application/json');

      setUploadSuccessMessage(`Successfully uploaded "${uploadedFile.name}" to Google Drive folder "SmartVibe_Machine_Reports"!`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
      loadFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload to Google Drive failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Telemetry CSV to Google Drive
  const handleUploadCSV = async () => {
    if (!historyData.length) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const headers = ['Timestamp', 'Machine', 'Vibration RMS (m/s²)', 'Resultant (m/s²)', 'Temp (°C)', 'Noise Relative (%)', 'Health Score', 'Status'];
      const rows = historyData.map(p => [
        p.timestamp,
        p.machineName,
        p.vibration.rms,
        p.vibration.resultant,
        p.temperature.current,
        p.noise.relativeLevel,
        p.health.score,
        p.health.status
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const filename = `SmartVibe_Telemetry_Logs_${settings.machineId}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

      const uploadedFile = await uploadReportToDrive(filename, csvContent, 'text/csv');
      setUploadSuccessMessage(`Successfully uploaded "${uploadedFile.name}" to Google Drive!`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
      loadFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload CSV to Google Drive failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Confirmed Deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFileFromDrive(fileToDelete.id);
      setFileToDelete(null);
      loadFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete file from Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Google Drive Cloud Storage</h2>
                <span className="rounded bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                  Google Workspace API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically backup and sync machine health reports, calibration logs, and telemetry history to your Google Drive
              </p>
            </div>
          </div>

          {/* Authentication State button */}
          <div>
            {!currentUser ? (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-md hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {/* Official Google G Logo */}
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Drive...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-1.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-blue-500/30 flex items-center justify-center text-xs text-blue-300">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div className="text-left text-xs">
                    <p className="font-semibold text-white leading-tight">{currentUser.displayName || 'Google User'}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success Message Banner */}
        {uploadSuccessMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{uploadSuccessMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!currentUser ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0b1322]/60 p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <HardDrive className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-white">Connect Google Drive to Backup Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authenticate with Google Workspace to securely store machine health reports, vibration velocity summaries, and long-term diagnostic records directly in your Google Drive cloud account.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all cursor-pointer"
          >
            <Cloud className="h-4 w-4" />
            <span>Connect Google Drive</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Upload Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Upload Current Audit */}
            <div className="rounded-xl border border-slate-800 bg-[#0b1322] p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Export Health Audit to Drive</span>
                  <FileText className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload current snapshot with baseline vibration evaluation and AI diagnostic summary.
                </p>
              </div>
              <button
                onClick={handleUploadCurrentReport}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Save Health Audit to Drive'}</span>
              </button>
            </div>

            {/* Upload Telemetry CSV */}
            <div className="rounded-xl border border-slate-800 bg-[#0b1322] p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Backup Telemetry History CSV</span>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload historical sensor time-series ({historyData.length} data points) as a CSV table.
                </p>
              </div>
              <button
                onClick={handleUploadCSV}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Backup Telemetry CSV to Drive'}</span>
              </button>
            </div>

            {/* Folder Location Box */}
            <div className="rounded-xl border border-slate-800 bg-[#0b1322] p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Google Drive Destination</span>
                  <FolderCheck className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  My Drive &gt; SmartVibe_Machine_Reports
                </p>
              </div>
              <button
                onClick={loadFiles}
                disabled={isLoadingFiles}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Refresh Drive Files</span>
              </button>
            </div>

          </div>

          {/* Files List in Google Drive */}
          <div className="rounded-2xl border border-slate-800 bg-[#0b1322] shadow-lg backdrop-blur-md">
            
            {/* Table Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
              <div>
                <h3 className="text-sm font-bold text-white">SmartVibe Files in Google Drive</h3>
                <p className="text-xs text-slate-400">
                  Showing <strong className="text-slate-200 font-mono">{filteredFiles.length}</strong> cloud audit reports and telemetry archives
                </p>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">File Name</th>
                    <th className="py-2.5 px-4 font-medium">Type</th>
                    <th className="py-2.5 px-4 font-medium">Last Modified</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {isLoadingFiles ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-cyan-400" />
                        Fetching files from Google Drive...
                      </td>
                    </tr>
                  ) : filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                        No SmartVibe reports found in Google Drive. Click "Save Health Audit to Drive" above to create your first cloud backup.
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => {
                      const modifiedDate = file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const isJson = file.mimeType.includes('json') || file.name.endsWith('.json');
                      const isCsv = file.mimeType.includes('csv') || file.name.endsWith('.csv');

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-200 font-medium">
                            <div className="flex items-center gap-2">
                              {isJson ? (
                                <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                              ) : isCsv ? (
                                <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <HardDrive className="h-4 w-4 text-blue-400 shrink-0" />
                              )}
                              <span className="truncate max-w-xs sm:max-w-md" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {isJson ? 'JSON Audit Report' : isCsv ? 'CSV Telemetry Data' : file.mimeType}
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                            {modifiedDate}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                            <div className="flex items-center justify-end gap-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                                >
                                  <span>Open in Drive</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                                title="Delete from Drive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE OPERATIONS */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#0d1424] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete File from Google Drive?</h4>
                <p className="text-[11px] text-slate-400">User Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white font-mono">{fileToDelete.name}</strong> from your Google Drive? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete from Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
