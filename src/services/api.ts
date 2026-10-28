import type {
  TelemetryPoint,
  MachineSettings,
  AlertItem,
  HealthStatus,
  MachineHealthEvaluation
} from '../types/telemetry';

const STORAGE_KEY_API_URL = 'smartvibe_api_url';

export function getCustomApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API_URL) || '';
  } catch {
    return '';
  }
}

export function setCustomApiUrl(url: string) {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem(STORAGE_KEY_API_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    }
  } catch {
    // ignore
  }
}

export function getApiBaseUrl(): string {
  const custom = getCustomApiUrl();
  if (custom) return custom;
  // If in standard web browser, use relative path to Express
  return '';
}

// Client-side fallback simulator for standalone offline Android APK
let localSimulationStep = 0;
let localSettings: MachineSettings = {
  machineId: 'machine_01',
  machineName: 'Machine 01 — CNC Spindle Drive',
  machineType: 'Three-Phase AC Induction Motor & Milling Spindle',
  location: 'Lab Test Bay 3 / Bench A',
  mode: 'demo',
  demoScenario: 'normal',
  tempWarningThreshold: 55,
  tempCriticalThreshold: 75,
  vibrationBaseline: 1.2,
  vibrationWarningThreshold: 2.8,
  vibrationCriticalThreshold: 4.5,
  noiseWarningThreshold: 68,
  noiseCriticalThreshold: 85,
};

let localAlerts: AlertItem[] = [];
let localHistory: TelemetryPoint[] = [];

function generateLocalPoint(timestamp?: string): TelemetryPoint {
  localSimulationStep += 0.2;
  const time = timestamp || new Date().toISOString();

  let x = 0.4 + Math.sin(localSimulationStep * 0.7) * 0.2;
  let y = 0.3 + Math.cos(localSimulationStep * 0.5) * 0.15;
  let z = 9.81 + Math.sin(localSimulationStep * 1.2) * 0.25;
  let temp = 39.2 + Math.sin(localSimulationStep * 0.1) * 2.5;
  let noiseRel = 35 + Math.sin(localSimulationStep * 0.8) * 8;
  let pattern: 'steady' | 'periodic_pulses' | 'erratic_bursts' = 'steady';

  switch (localSettings.demoScenario) {
    case 'bearing_wear':
      x += (Math.random() > 0.7 ? 2.5 : 1.2) + Math.sin(localSimulationStep * 2.8) * 0.9;
      y += 1.4 + Math.cos(localSimulationStep * 2.1) * 0.7;
      temp += 8.5 + Math.sin(localSimulationStep * 0.15) * 3;
      noiseRel = 69 + Math.random() * 12;
      pattern = 'periodic_pulses';
      break;
    case 'overheating':
      temp = 68.4 + Math.sin(localSimulationStep * 0.2) * 6;
      x += 0.6;
      y += 0.5;
      noiseRel = 44 + Math.random() * 6;
      pattern = 'steady';
      break;
    case 'unbalance':
      x += Math.sin(localSimulationStep * 1.8) * 3.8;
      y += Math.cos(localSimulationStep * 1.8) * 3.6;
      temp += 4.2;
      noiseRel = 58 + Math.sin(localSimulationStep * 1.8) * 14;
      pattern = 'periodic_pulses';
      break;
    case 'acoustic_spike':
      noiseRel = 82 + Math.random() * 14;
      temp = 41.2;
      pattern = 'erratic_bursts';
      break;
    case 'normal':
    default:
      temp = 38.5 + Math.sin(localSimulationStep * 0.1) * 1.8;
      noiseRel = 32 + Math.random() * 6;
      pattern = 'steady';
      break;
  }

  const dynamicAcc = Math.sqrt(x * x + y * y + Math.pow(z - 9.81, 2));
  const resultant = Number(dynamicAcc.toFixed(2));
  const rms = Number((dynamicAcc * 0.707 + (localSettings.demoScenario === 'unbalance' ? 1.8 : 0.4)).toFixed(2));
  const peak = Number((dynamicAcc * 1.414 + 0.3).toFixed(2));

  let vibStatus: HealthStatus = 'normal';
  if (rms >= localSettings.vibrationCriticalThreshold) vibStatus = 'anomaly';
  else if (rms >= localSettings.vibrationWarningThreshold) vibStatus = 'warning';

  let tempStatus: HealthStatus = 'normal';
  if (temp >= localSettings.tempCriticalThreshold) tempStatus = 'anomaly';
  else if (temp >= localSettings.tempWarningThreshold) tempStatus = 'warning';

  let noiseStatus: HealthStatus = 'normal';
  if (noiseRel >= localSettings.noiseCriticalThreshold) noiseStatus = 'anomaly';
  else if (noiseRel >= localSettings.noiseWarningThreshold) noiseStatus = 'warning';

  let vibPen = 0;
  if (rms > localSettings.vibrationBaseline) {
    vibPen = Math.min(45, Math.max(0, Math.round(((rms - localSettings.vibrationBaseline) / Math.max(0.1, localSettings.vibrationCriticalThreshold - localSettings.vibrationBaseline)) * 45)));
  }
  let thermPen = 0;
  if (temp > localSettings.tempWarningThreshold) {
    thermPen = Math.min(35, Math.max(0, Math.round(((temp - localSettings.tempWarningThreshold) / Math.max(1, localSettings.tempCriticalThreshold - localSettings.tempWarningThreshold)) * 35)));
  }
  let noisePen = 0;
  if (noiseRel > localSettings.noiseWarningThreshold) {
    noisePen = Math.min(20, Math.max(0, Math.round(((noiseRel - localSettings.noiseWarningThreshold) / Math.max(1, localSettings.noiseCriticalThreshold - localSettings.noiseWarningThreshold)) * 20)));
  }

  const score = Math.max(0, 100 - (vibPen + thermPen + noisePen));
  let status: HealthStatus = 'normal';
  if (score < 60 || vibStatus === 'anomaly' || tempStatus === 'anomaly') status = 'anomaly';
  else if (score < 80 || vibStatus === 'warning' || tempStatus === 'warning' || noiseStatus === 'warning') status = 'warning';

  const reasons: string[] = [];
  const recommendations: string[] = [];
  if (vibStatus === 'anomaly') {
    reasons.push(`Vibration RMS (${rms} m/s²) exceeds configured critical limit (${localSettings.vibrationCriticalThreshold} m/s²).`);
    recommendations.push('Immediate mechanical inspection of spindle/bearing assembly; inspect for unbalance or loose coupling.');
  } else if (vibStatus === 'warning') {
    reasons.push(`Vibration RMS (${rms} m/s²) has exceeded configured warning threshold (${localSettings.vibrationWarningThreshold} m/s²).`);
    recommendations.push('Check sensor ADXL345 magnetic/screw mounting rigidity; verify baseline alignment during off-peak load.');
  }
  if (tempStatus === 'anomaly') {
    reasons.push(`DS18B20 temperature (${temp.toFixed(1)}°C) exceeds critical limit (${localSettings.tempCriticalThreshold}°C).`);
    recommendations.push('Inspect cooling fan ducting, thermal paste/heatsink contact, and thermal overload relay.');
  } else if (tempStatus === 'warning') {
    reasons.push(`DS18B20 temperature (${temp.toFixed(1)}°C) elevated above warning threshold (${localSettings.tempWarningThreshold}°C).`);
    recommendations.push('Verify machine ambient airflow and monitor motor casing temperature gradient.');
  }
  if (noiseStatus === 'anomaly') {
    reasons.push(`MAX9814 relative acoustic envelope (${noiseRel.toFixed(1)}%) reached high-intensity peaks.`);
    recommendations.push('Check for external acoustic interference, microphone placement proximity, or continuous bearing friction chatter.');
  } else if (noiseStatus === 'warning') {
    reasons.push(`MAX9814 relative acoustic level (${noiseRel.toFixed(1)}%) is above baseline operational envelope.`);
    recommendations.push('Perform frequency spot check; verify if noise correlates with motor rotational speed.');
  }
  if (reasons.length === 0) {
    reasons.push('All parameters (vibration, temperature, acoustic envelope) are operating within nominal baseline tolerances.');
    recommendations.push('Maintain regular predictive maintenance logging and baseline calibration schedule.');
  }

  const health: MachineHealthEvaluation = {
    score,
    status,
    reasons,
    recommendations,
    scoringFormula: {
      vibrationPenalty: vibPen,
      thermalPenalty: thermPen,
      acousticPenalty: noisePen,
      explanation: 'Health Score = 100 - (VibrationPenalty [0-45] + ThermalPenalty [0-35] + AcousticPenalty [0-20])'
    },
    disclaimer: 'Cautious Engineering Notice: Sensor deviations suggest condition variance. Physical inspection is required before asserting any confirmed mechanical failure.'
  };

  const point: TelemetryPoint = {
    id: `local-pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: time,
    machineId: localSettings.machineId,
    machineName: localSettings.machineName,
    vibration: {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      z: Number(z.toFixed(2)),
      resultant,
      rms,
      peak,
      dominantFrequency: Number((48.7 + (localSettings.demoScenario === 'unbalance' ? 51.3 : (Math.random() - 0.5) * 0.4)).toFixed(1)),
      dominantFreqSource: 'demo',
      baseline: localSettings.vibrationBaseline,
      deviationPercent: Number((((rms - localSettings.vibrationBaseline) / localSettings.vibrationBaseline) * 100).toFixed(1)),
      status: vibStatus
    },
    temperature: {
      current: Number(temp.toFixed(1)),
      min: 28.3,
      max: 56.2,
      warningThreshold: localSettings.tempWarningThreshold,
      criticalThreshold: localSettings.tempCriticalThreshold,
      status: tempStatus
    },
    noise: {
      relativeLevel: Number(noiseRel.toFixed(1)),
      peakLevel: Number(Math.min(100, noiseRel * 1.3).toFixed(1)),
      variance: 1.2,
      patternState: pattern,
      trend: localSettings.demoScenario === 'bearing_wear' ? 'Rising' : localSettings.demoScenario === 'acoustic_spike' ? 'Fluctuating' : 'Stable',
      status: noiseStatus,
      calibrationNote: 'Uncalibrated relative acoustic envelope index (0-100%). Not calibrated dB SPL.'
    },
    health,
    deviceStatus: 'offline', // Offline because demo mode / no ESP32 hardware connection
    hardware: {
      adxl345Connected: false,
      ds18b20Connected: false,
      max9814Connected: false
    },
    source: 'demo_simulation'
  };

  return point;
}

// Seed local history
function initLocalHistory() {
  if (localHistory.length === 0) {
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      localHistory.push(generateLocalPoint(new Date(now - i * 15000).toISOString()));
    }
  }
}
initLocalHistory();

// API Client Functions with Fallback
export async function fetchLatestTelemetry(): Promise<{ point: TelemetryPoint; settings: MachineSettings }> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/telemetry/latest`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { point: data, settings: data.settings || localSettings };
  } catch (err) {
    // Fallback to local simulator (essential for APK without remote server configured)
    const pt = generateLocalPoint();
    localHistory.push(pt);
    if (localHistory.length > 300) localHistory.shift();
    return { point: pt, settings: localSettings };
  }
}

export async function fetchTelemetryHistory(range: string = '15m'): Promise<TelemetryPoint[]> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/telemetry/history?range=${range}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.points || [];
  } catch (err) {
    return localHistory.slice(-40);
  }
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/alerts`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return localAlerts;
  }
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const base = getApiBaseUrl();
  try {
    await fetch(`${base}/api/alerts/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId })
    });
  } catch {
    localAlerts = localAlerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
  }
}

export async function clearAcknowledgedAlerts(): Promise<void> {
  const base = getApiBaseUrl();
  try {
    await fetch(`${base}/api/alerts/clear`, { method: 'POST' });
  } catch {
    localAlerts = localAlerts.filter(a => !a.acknowledged);
  }
}

export async function fetchSettings(): Promise<MachineSettings> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/settings`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return localSettings;
  }
}

export async function updateSettings(newSettings: Partial<MachineSettings>): Promise<MachineSettings> {
  const base = getApiBaseUrl();
  localSettings = { ...localSettings, ...newSettings };
  try {
    const res = await fetch(`${base}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.settings || localSettings;
  } catch {
    return localSettings;
  }
}

export async function requestAiDiagnosis(): Promise<any> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/ai/diagnose`, { method: 'POST', signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const pt = localHistory[localHistory.length - 1] || generateLocalPoint();
    return {
      vibrationAnalysis: `ADXL345 recorded resultant vibration is ${pt.vibration.resultant} m/s² with RMS of ${pt.vibration.rms} m/s² (baseline: ${pt.vibration.baseline} m/s², deviation: ${pt.vibration.deviationPercent}%). Based on configured machine threshold rules, vibration status sits in ${pt.vibration.status.toUpperCase()} band.`,
      temperatureAnalysis: `DS18B20 digital temperature probe indicates ${pt.temperature.current}°C (warning threshold: ${pt.temperature.warningThreshold}°C, critical: ${pt.temperature.criticalThreshold}°C). Thermal status is ${pt.temperature.status.toUpperCase()}.`,
      acousticAnalysis: `MAX9814 relative acoustic amplitude index is ${pt.noise.relativeLevel}% (peak: ${pt.noise.peakLevel}%). Pattern classified as ${pt.noise.patternState}. Note: Uncalibrated relative microphone signal.`,
      holisticConditionScore: pt.health.score,
      overallAssessment: pt.health.reasons.join(' '),
      cautiousRecommendations: pt.health.recommendations,
      disclaimer: 'Notice: This AI diagnostic evaluation is advisory. Sensor telemetry alone cannot establish conclusive mechanical diagnosis. Certified personnel physical inspection is required before taking equipment offline or performing teardown.',
      geminiEnriched: false,
      detailedAiReport: null
    };
  }
}

export async function testBackendConnection(url: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const clean = url.trim().replace(/\/+$/, '');
  const start = Date.now();
  try {
    const res = await fetch(`${clean}/api/telemetry/latest`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: `Connected to ${data.machineName || 'SmartVibe Server'} (${latencyMs}ms)`, latencyMs };
    }
    return { success: false, message: `HTTP Error ${res.status} from server` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed or timed out' };
  }
}
