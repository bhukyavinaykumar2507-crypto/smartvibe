/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SensorCards } from './components/SensorCards';
import { IndividualTrendCharts } from './components/IndividualTrendCharts';
import { MiddleRowCards } from './components/MiddleRowCards';
import { BottomRowCards } from './components/BottomRowCards';
import { HistoryTable } from './components/HistoryTable';
import { AlertsPanel } from './components/AlertsPanel';
import { AiHealthScorePanel } from './components/AiHealthScorePanel';
import { HealthReportModal } from './components/HealthReportModal';
import { HardwareGuide } from './components/HardwareGuide';
import { SettingsModal } from './components/SettingsModal';
import type { 
  TelemetryPoint, 
  MachineSettings, 
  AlertItem, 
  HealthStatus 
} from './types/telemetry';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'15m' | '1h' | '24h' | '7d'>('15m');
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Telemetry data states
  const [latestData, setLatestData] = useState<TelemetryPoint | null>(null);
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState<MachineSettings>({
    machineId: 'machine_01',
    machineName: 'Machine 01 — CNC Spindle Drive',
    machineType: 'Three-Phase AC Induction Motor & Milling Spindle',
    location: 'Lab Test Bay 3 / Bench A',
    mode: 'demo',
    demoScenario: 'normal',
    tempWarningThreshold: 55,
    tempCriticalThreshold: 70,
    vibrationBaseline: 1.2,
    vibrationWarningThreshold: 2.8,
    vibrationCriticalThreshold: 4.5,
    noiseWarningThreshold: 68,
    noiseCriticalThreshold: 85,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);
  const [isSendingPacket, setIsSendingPacket] = useState(false);

  // Fetch latest telemetry
  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/latest');
      if (res.ok) {
        const data = await res.json();
        setLatestData(data);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.warn('Failed to fetch latest telemetry:', err);
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async (range = selectedRange) => {
    try {
      const res = await fetch(`/api/telemetry/history?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        if (data.points && Array.isArray(data.points)) {
          setHistoryData(data.points);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    }
  }, [selectedRange]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.warn('Failed to fetch alerts:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await Promise.all([fetchLatest(), fetchHistory(), fetchAlerts()]);
      setIsLoading(false);
    }
    init();
  }, [fetchLatest, fetchHistory, fetchAlerts]);

  // Live polling
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      fetchLatest();
      fetchHistory(selectedRange);
      fetchAlerts();
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming, fetchLatest, fetchHistory, fetchAlerts, selectedRange]);

  // Handle Range change
  const handleRangeChange = (range: '15m' | '1h' | '24h' | '7d') => {
    setSelectedRange(range);
    fetchHistory(range);
  };

  // Trigger Deep AI Diagnosis
  const handleTriggerDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.detailedAiReport) {
          setAiReportText(data.detailedAiReport);
        } else {
          setAiReportText(
            `Rule-Based Engineering Evaluation:\n• ${data.vibrationAnalysis}\n• ${data.temperatureAnalysis}\n• ${data.acousticAnalysis}\n• Condition Score: ${data.holisticConditionScore}/100\n• Summary: ${data.overallAssessment}\n\nPrescribed Steps:\n${data.cautiousRecommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
          );
        }
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Clear acknowledged alerts
  const handleClearAcknowledged = async () => {
    try {
      await fetch('/api/alerts/clear', { method: 'POST' });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<MachineSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      fetchLatest();
    }
  };

  // Select Machine from header
  const handleSelectMachine = (machineId: string) => {
    handleSaveSettings({
      machineId,
      machineName: machineId === 'machine_01' 
        ? 'Machine 01 — CNC Spindle Drive' 
        : machineId === 'machine_02' 
          ? 'Machine 02 — Centrifugal Water Pump' 
          : 'Machine 03 — Exhaust Ventilation Blower'
    });
  };

  // Simulate ESP32 Live Packet
  const handleSendTestPacket = async () => {
    setIsSendingPacket(true);
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: settings.machineId,
          vibration_x: (0.15 + Math.random() * 0.05).toFixed(2),
          vibration_y: (0.12 + Math.random() * 0.04).toFixed(2),
          vibration_z: (9.81 + Math.random() * 0.05).toFixed(2),
          vibration_rms: (0.12 + Math.random() * 0.02).toFixed(2),
          temperature: (42.5 + Math.random() * 0.5).toFixed(1),
          noise_relative: (68.0 + Math.random() * 3).toFixed(1),
          hardware_status: { adxl345: true, ds18b20: true, max9814: true },
        }),
      });
      await fetchLatest();
      await fetchHistory();
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to send packet:', err);
    } finally {
      setIsSendingPacket(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Machine ID',
      'Vibration RMS (mm/s)',
      'Vibration Resultant (m/s²)',
      'Temperature (°C)',
      'Noise Relative (%)',
      'Health Score',
      'Condition Status',
    ];

    const rows = historyData.map((p) => [
      p.timestamp,
      p.machineId,
      p.vibration.rms,
      p.vibration.resultant,
      p.temperature.current,
      p.noise.relativeLevel,
      p.health.score,
      p.health.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartvibe_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const overallStatus: HealthStatus = latestData?.health.status || 'normal';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-row font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={settings.mode}
        onOpenSettings={() => setActiveTab('settings')}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <Header
          currentMachineId={settings.machineId}
          onSelectMachine={handleSelectMachine}
          deviceStatus={latestData?.deviceStatus || 'online'}
          lastUpdated={latestData?.timestamp || ''}
          alerts={alerts}
          onOpenAlerts={() => setActiveTab('dashboard')}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          mode={settings.mode}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1600px] w-full mx-auto">
          
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-200">Initializing SmartVibe Telemetry Engine...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting to ADXL345, DS18B20, and MAX9814 sensor buffers</p>
            </div>
          )}

          {!isLoading && latestData && (
            <>
              {/* VIEW 1: DASHBOARD (PRIMARY REFERENCE IMAGE DESIGN) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Top Section: Machine Health Overview Title & Three Sensor Cards */}
                  <SensorCards
                    vibration={latestData.vibration}
                    temperature={latestData.temperature}
                    noise={latestData.noise}
                    overallStatus={overallStatus}
                    onOpenVibrationDetails={() => setActiveTab('live')}
                    onOpenTemperatureDetails={() => setActiveTab('live')}
                    onOpenNoiseDetails={() => setActiveTab('live')}
                  />

                  {/* Row 2: Three Individual Sensor Trend Charts in a Row */}
                  <IndividualTrendCharts
                    points={historyData}
                    selectedRange={selectedRange}
                    onRangeChange={handleRangeChange}
                  />

                  {/* Row 3: Combined Sensor View + Recent Readings + AI Machine Health Analysis */}
                  <MiddleRowCards
                    points={historyData}
                    latestHealth={latestData.health}
                    selectedRange={selectedRange}
                    onRangeChange={handleRangeChange}
                    onViewAllHistory={() => setActiveTab('history')}
                    onOpenAiDeepDive={() => setActiveTab('ai-analysis')}
                  />

                  {/* Row 4: Alerts & Notifications + Quick Actions + Brand Banner */}
                  <BottomRowCards
                    alerts={alerts}
                    onViewAllAlerts={() => setActiveTab('history')}
                    onGenerateReport={() => setIsReportOpen(true)}
                    onViewHistory={() => setActiveTab('history')}
                    onConfigureThresholds={() => setActiveTab('settings')}
                    onExportCSV={handleExportCSV}
                  />

                </div>
              )}

              {/* VIEW 2: LIVE MONITORING */}
              {activeTab === 'live' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Live Sensor Telemetry Monitor</h2>
                      <p className="text-xs text-slate-400">High-resolution sensor stream, multi-axis acceleration, and acoustic wave diagnostics</p>
                    </div>
                    <button
                      onClick={() => setIsStreaming(!isStreaming)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isStreaming ? 'bg-amber-600/80 text-white' : 'bg-emerald-600/80 text-white'
                      }`}
                    >
                      {isStreaming ? 'Pause Stream' : 'Resume Stream'}
                    </button>
                  </div>

                  {/* Sensor Cards */}
                  <SensorCards
                    vibration={latestData.vibration}
                    temperature={latestData.temperature}
                    noise={latestData.noise}
                    overallStatus={overallStatus}
                  />

                  {/* Interactive charts */}
                  <IndividualTrendCharts
                    points={historyData}
                    selectedRange={selectedRange}
                    onRangeChange={handleRangeChange}
                  />

                  {/* Hardware Integration Section */}
                  <HardwareGuide
                    onSendTestPacket={handleSendTestPacket}
                    isSendingPacket={isSendingPacket}
                    appUrl={window.location.origin}
                  />
                </div>
              )}

              {/* VIEW 3: MACHINE HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Machine Historical Telemetry & Log Audit</h2>
                    <p className="text-xs text-slate-400">Complete historical record of vibration, temperature, acoustic levels, and health assessments</p>
                  </div>

                  <HistoryTable points={historyData} />
                  
                  <AlertsPanel
                    alerts={alerts}
                    onAcknowledge={handleAcknowledgeAlert}
                    onClearAcknowledged={handleClearAcknowledged}
                  />
                </div>
              )}

              {/* VIEW 4: AI ANALYSIS */}
              {activeTab === 'ai-analysis' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">AI-Based Machine Health Analysis & Anomaly Detection</h2>
                    <p className="text-xs text-slate-400">Multi-parameter correlation heuristics, condition scoring, and diagnostic advisories</p>
                  </div>

                  <AiHealthScorePanel
                    evaluation={latestData.health}
                    onTriggerDiagnosis={handleTriggerDiagnosis}
                    isDiagnosing={isDiagnosing}
                    detailedReport={aiReportText}
                  />

                  <MiddleRowCards
                    points={historyData}
                    latestHealth={latestData.health}
                    selectedRange={selectedRange}
                    onRangeChange={handleRangeChange}
                    onViewAllHistory={() => setActiveTab('history')}
                    onOpenAiDeepDive={() => {}}
                  />
                </div>
              )}

              {/* VIEW 5: REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Machine Health Audit & Compliance Reports</h2>
                      <p className="text-xs text-slate-400">ISO 10816 machinery vibration standard compliance, statistics, and formal print/export</p>
                    </div>
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 shadow-md transition-colors"
                    >
                      Open Full PDF Report
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-200">
                      Generate an authenticated engineering condition report for {settings.machineName}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto">
                      Includes current sensor statistics, operational thresholds, recent anomalies, mathematical health scoring breakdown, and academic project sign-off block.
                    </p>
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer"
                    >
                      Generate & Print Machine Health Report
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 6: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <SettingsModal
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                    hardwareStatus={latestData.hardware}
                  />

                  <HardwareGuide
                    onSendTestPacket={handleSendTestPacket}
                    isSendingPacket={isSendingPacket}
                    appUrl={window.location.origin}
                  />
                </div>
              )}
            </>
          )}

        </main>

        {/* Global Modal: Machine Health Report */}
        <HealthReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          latest={latestData}
          history={historyData}
          alerts={alerts}
          settings={settings}
        />

      </div>

    </div>
  );
}
