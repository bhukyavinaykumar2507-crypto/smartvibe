import React, { useState, useEffect, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { SensorCards } from './components/SensorCards';
import { IndividualTrendCharts } from './components/IndividualTrendCharts';
import { MiddleRowCards } from './components/MiddleRowCards';
import { BottomRowCards } from './components/BottomRowCards';
import { TelemetryCharts } from './components/TelemetryCharts';
import { HistoryTable } from './components/HistoryTable';
import { AiHealthScorePanel } from './components/AiHealthScorePanel';
import { AlertsPanel } from './components/AlertsPanel';
import { HealthReportModal } from './components/HealthReportModal';
import { SettingsModal } from './components/SettingsModal';
import { HardwareGuide } from './components/HardwareGuide';
import { GoogleDriveView } from './components/GoogleDriveView';
import {
  fetchLatestTelemetry,
  fetchTelemetryHistory,
  fetchAlerts,
  acknowledgeAlert,
  clearAllAlerts,
  fetchSettings,
  updateSettings,
  runAiDiagnosis,
} from './services/api';
import { initAuth } from './services/googleDrive';
import type {
  TelemetryPoint,
  AlertItem,
  MachineSettings,
} from './types/telemetry';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currentMachineId, setCurrentMachineId] = useState('machine_01');
  const [selectedRange, setSelectedRange] = useState<'15m' | '1h' | '24h' | '7d'>('15m');
  const [isStreaming, setIsStreaming] = useState(true);

  const [latestData, setLatestData] = useState<TelemetryPoint | null>(null);
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState<MachineSettings>({
    machineId: 'machine_01',
    machineName: 'Machine 01',
    mode: 'demo',
    vibWarningThreshold: 0.45,
    vibAnomalyThreshold: 0.85,
    noiseWarningThreshold: 72,
    noiseAnomalyThreshold: 88,
    esp32TimeoutSeconds: 15,
  });

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiGeneratedBy, setAiGeneratedBy] = useState<'gemini' | 'rule-engine' | undefined>(
    undefined
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setGoogleUser(user);
    });
    return unsubscribe;
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [latest, hist, alts, cfg] = await Promise.all([
        fetchLatestTelemetry(currentMachineId),
        fetchTelemetryHistory(selectedRange, currentMachineId),
        fetchAlerts(),
        fetchSettings(),
      ]);
      setLatestData(latest);
      setHistoryData(hist);
      setAlerts(alts);
      setSettings(cfg);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  }, [currentMachineId, selectedRange]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time 2s polling when streaming is active
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(async () => {
      try {
        const [latest, hist, alts] = await Promise.all([
          fetchLatestTelemetry(currentMachineId),
          fetchTelemetryHistory(selectedRange, currentMachineId),
          fetchAlerts(),
        ]);
        setLatestData(latest);
        setHistoryData(hist);
        setAlerts(alts);
      } catch {
        // Ignore transient poll glitches
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming, currentMachineId, selectedRange]);

  const handleSelectMachine = (machineId: string) => {
    setCurrentMachineId(machineId);
    setAiReport(null);
  };

  const handleSwitchMode = async (newMode: 'demo' | 'live') => {
    const updated = await updateSettings({ mode: newMode });
    setSettings(updated);
    await loadAll();
  };

  const handleSaveSettings = async (patch: Partial<MachineSettings>) => {
    const updated = await updateSettings(patch);
    setSettings(updated);
    await loadAll();
  };

  const handleAcknowledgeAlert = async (id: string) => {
    await acknowledgeAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleClearAlerts = async () => {
    await clearAllAlerts();
    setAlerts([]);
  };

  const handleRunAiDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await runAiDiagnosis(currentMachineId);
      setAiReport(res.detailedReport);
      setAiGeneratedBy(res.generatedBy);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const deviceStatus = latestData?.deviceStatus || 'offline';
  const lastUpdated = latestData?.timestamp || '';

  return (
    <div className="bg-industrial-grid relative flex min-h-screen w-full text-slate-100 overflow-x-hidden">
      {/* Subtle non-distracting ambient radial highlights */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/[0.045] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-1/4 h-96 w-96 rounded-full bg-teal-500/[0.04] blur-3xl"
      />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'reports') {
            setReportModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        mode={settings.mode}
        deviceStatus={deviceStatus}
        onSwitchMode={handleSwitchMode}
      />

      {/* Main Content Shell */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <Header
          currentMachineId={currentMachineId}
          onSelectMachine={handleSelectMachine}
          deviceStatus={deviceStatus}
          lastUpdated={lastUpdated}
          alerts={alerts}
          onOpenAlerts={() => setAlertsOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          mode={settings.mode}
          isStreaming={isStreaming}
          googleUser={googleUser}
          onOpenGoogleDrive={() => setActiveTab('drive')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {!latestData ? (
            /* Industrial Skeleton Loading State */
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="sv-skeleton h-7 w-64 rounded-lg" />
                  <div className="sv-skeleton h-3.5 w-80 rounded-md" />
                </div>
                <div className="sv-skeleton h-16 w-56 rounded-xl" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="sv-skeleton h-64 rounded-2xl border border-slate-800/70" />
                <div className="sv-skeleton h-64 rounded-2xl border border-slate-800/70" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="sv-skeleton h-56 rounded-2xl border border-slate-800/70" />
                <div className="sv-skeleton h-56 rounded-2xl border border-slate-800/70" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="sv-skeleton lg:col-span-5 h-60 rounded-2xl border border-slate-800/70" />
                <div className="sv-skeleton lg:col-span-3 h-60 rounded-2xl border border-slate-800/70" />
                <div className="sv-skeleton lg:col-span-4 h-60 rounded-2xl border border-slate-800/70" />
              </div>
            </div>
          ) : (
            <div key={activeTab} className="sv-tab-enter space-y-6">
              {activeTab === 'dashboard' && (
                <>
                  <SensorCards
                    vibration={latestData.vibration}
                    noise={latestData.noise}
                    overallStatus={latestData.health.status}
                    historyPoints={historyData}
                    deviceStatus={deviceStatus}
                    mode={settings.mode}
                    isStreaming={isStreaming}
                    lastUpdated={lastUpdated}
                    onOpenVibrationDetails={() => setActiveTab('live')}
                    onOpenNoiseDetails={() => setActiveTab('live')}
                  />

                  <IndividualTrendCharts
                    points={historyData}
                    selectedRange={selectedRange}
                    onRangeChange={setSelectedRange}
                    deviceStatus={deviceStatus}
                    mode={settings.mode}
                    isStreaming={isStreaming}
                    lastUpdated={lastUpdated}
                  />

                  <MiddleRowCards
                    points={historyData}
                    latestHealth={latestData.health}
                    selectedRange={selectedRange}
                    onRangeChange={setSelectedRange}
                    onViewAllHistory={() => setActiveTab('history')}
                    onOpenAiAnalysis={() => setActiveTab('ai')}
                    deviceStatus={deviceStatus}
                    mode={settings.mode}
                    isStreaming={isStreaming}
                    lastUpdated={lastUpdated}
                  />

                  <BottomRowCards
                    alerts={alerts}
                    onViewAllAlerts={() => setAlertsOpen(true)}
                    onGenerateReport={() => setReportModalOpen(true)}
                    onViewHistory={() => setActiveTab('history')}
                  />
                </>
              )}

              {activeTab === 'live' && (
                <TelemetryCharts
                  points={historyData}
                  latest={latestData}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                  isStreaming={isStreaming}
                  onToggleStreaming={() => setIsStreaming((s) => !s)}
                  deviceStatus={deviceStatus}
                  mode={settings.mode}
                  lastUpdated={lastUpdated}
                />
              )}

              {activeTab === 'history' && <HistoryTable points={historyData} />}

              {activeTab === 'ai' && (
                <AiHealthScorePanel
                  evaluation={latestData.health}
                  detailedReport={aiReport}
                  generatedBy={aiGeneratedBy}
                  isDiagnosing={isDiagnosing}
                  onRunDiagnosis={handleRunAiDiagnosis}
                />
              )}

              {activeTab === 'drive' && (
                <GoogleDriveView
                  googleUser={googleUser}
                  onUserChange={setGoogleUser}
                  latestData={latestData}
                />
              )}

              {activeTab === 'hardware' && <HardwareGuide onPacketSent={loadAll} />}

              {activeTab === 'settings' && (
                <SettingsModal settings={settings} onSave={handleSaveSettings} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <AlertsPanel
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onClearAll={handleClearAlerts}
      />

      {latestData && (
        <HealthReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          latest={latestData}
          history={historyData}
          alerts={alerts}
          aiSummary={aiReport}
        />
      )}
    </div>
  );
}

export default App;
