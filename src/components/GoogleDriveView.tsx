import React, { useEffect, useState } from 'react';
import {
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  Trash2,
  ExternalLink,
  Upload,
  FileText,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  googleSignIn,
  logoutGoogle,
  listSmartVibeFiles,
  uploadReportToDrive,
  deleteFileFromDrive,
  getAccessToken,
  type DriveFile,
} from '../services/googleDrive';
import type { TelemetryPoint } from '../types/telemetry';

interface GoogleDriveViewProps {
  googleUser: User | null;
  onUserChange: (user: User | null) => void;
  latestData: TelemetryPoint;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({
  googleUser,
  onUserChange,
  latestData,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listSmartVibeFiles();
      setFiles(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch Drive files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleUser && getAccessToken()) {
      loadFiles();
    }
  }, [googleUser]);

  const handleSignIn = async () => {
    setError(null);
    try {
      const { user } = await googleSignIn();
      onUserChange(user);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    onUserChange(null);
    setFiles([]);
  };

  const handleUploadSnapshot = async () => {
    setUploading(true);
    setError(null);
    try {
      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          machine: latestData.machineName,
          sensors: {
            adxl345: latestData.vibration,
            max9814: latestData.noise,
          },
          health: latestData.health,
        },
        null,
        2
      );
      const name = `SmartVibe_Snapshot_${latestData.machineId}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      await uploadReportToDrive(name, payload, 'application/json');
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Snapshot upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFileFromDrive(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="space-y-5 sv-enter">
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Google Drive Report Archive
              </h2>
              <p className="text-xs text-slate-400">
                Sync machine health reports and snapshots to SmartVibe_Machine_Reports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {googleUser && getAccessToken() ? (
              <>
                <button
                  onClick={handleUploadSnapshot}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploading ? 'Syncing...' : 'Upload JSON Snapshot'}</span>
                </button>
                <button
                  onClick={loadFiles}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        {!googleUser || !getAccessToken() ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 py-14 text-center px-4">
            <Cloud className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-200">
              Google Drive Not Connected
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Connect your Google account to back up HTML health reports and 2-sensor telemetry snapshots into your Drive folder.
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No files found in SmartVibe_Machine_Reports yet. Click Upload JSON Snapshot to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[10.5px] font-mono text-slate-400">
                      {file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleString()
                        : 'Synced'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="rounded-lg border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-950/40"
                    title="Delete from Drive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
