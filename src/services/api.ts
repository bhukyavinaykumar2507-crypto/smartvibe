import type {
  TelemetryPoint,
  AlertItem,
  MachineSettings,
  AiDiagnosisResponse,
  HealthStatus,
  NoisePatternState,
} from '../types/telemetry';

const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' && window.location.port === '')
    ? import.meta.env.VITE_API_URL || ''
    : '';

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

// Local offline simulation fallback for standalone Capacitor APK when backend is unreachable
let localSettings: MachineSettings = {
  machineId: 'machine_01',
  machineName: 'Machine 01',
  mode: 'demo',
  vibWarningThreshold: 0.45,
  vibAnomalyThreshold: 0.85,
  noiseWarningThreshold: 72,
  noiseAnomalyThreshold: 88,
  esp32TimeoutSeconds: 15,
};

let localStep = 0;
const localHistory: TelemetryPoint[] = [];
const localAlerts: AlertItem[] = [];

function evaluateLocalHealth(
  vibResultant: number,
  noiseLevel: number,
  settings: MachineSettings
) {
  let vibStatus: HealthStatus = 'normal';
  if (vibResultant >= settings.vibAnomalyThreshold) vibStatus = 'anomaly';
  else if (vibResultant >= settings.vibWarningThreshold) vibStatus = 'warning';

  let noiseStatus: HealthStatus = 'normal';
  if (noiseLevel >= settings.noiseAnomalyThreshold) noiseStatus = 'anomaly';
  else if (noiseLevel >= settings.noiseWarningThreshold) noiseStatus = 'warning';

  const vibPenalty = Math.min(
    65,
    Math.round((vibResultant / Math.max(0.1, settings.vibAnomalyThreshold)) * 55)
  );
  const acousticPenalty = Math.min(
    35,
    Math.round((noiseLevel / Math.max(1, settings.noiseAnomalyThreshold)) * 30)
  );

  const score = Math.max(0, Math.min(100, 100 - (vibPenalty + acousticPenalty)));
  let overallStatus: HealthStatus = 'normal';
  if (vibStatus === 'anomaly' || noiseStatus === 'anomaly' || score < 55) {
    overallStatus = 'anomaly';
  } else if (vibStatus === 'warning' || noiseStatus === 'warning' || score < 78) {
    overallStatus = 'warning';
  }

  const detectedConditions: string[] = [];
  if (vibStatus === 'normal') detectedConditions.push('ADXL345 vibration within nominal bounds');
  else if (vibStatus === 'warning') detectedConditions.push('Elevated ADXL345 vibration amplitude');
  else detectedConditions.push('Critical ADXL345 vibration anomaly');

  if (noiseStatus === 'normal') detectedConditions.push('MAX9814 acoustic signature stable');
  else if (noiseStatus === 'warning') detectedConditions.push('Elevated MAX9814 noise index');
  else detectedConditions.push('Severe MAX9814 acoustic spike detected');

  const recommendation =
    overallStatus === 'anomaly'
      ? 'Inspect shaft coupling, rotor balance, and bearing housing immediately.'
      : overallStatus === 'warning'
        ? 'Schedule preventive lubrication and fastener torque verification.'
        : 'Continue nominal monitoring. All 2-sensor readings are healthy.';

  return {
    vibStatus,
    noiseStatus,
    health: {
      score,
      status: overallStatus,
      vibrationPenalty: vibPenalty,
      acousticPenalty,
      detectedConditions,
      recommendation,
    },
  };
}

function generateOfflinePoint(): TelemetryPoint {
  localStep += 1;
  const now = new Date();
  const isSpike = localStep % 19 === 0;
  const wave = Math.sin(localStep * 0.45) * 0.04;
  const x = Number((0.12 + wave + (isSpike ? 0.35 : 0)).toFixed(3));
  const y = Number((0.1 + Math.cos(localStep * 0.35) * 0.03 + (isSpike ? 0.25 : 0)).toFixed(3));
  const z = Number((0.14 + Math.sin(localStep * 0.25) * 0.02 + (isSpike ? 0.28 : 0)).toFixed(3));
  const resultant = Number(Math.sqrt(x * x + y * y + z * z).toFixed(2));
  const rms = Number((resultant * 0.72).toFixed(2));
  const peak = Number((resultant * 1.48).toFixed(2));

  const noiseRaw = 54 + Math.sin(localStep * 0.3) * 8 + (isSpike ? 28 : 0);
  const relativeLevel = Math.max(15, Math.min(99, Math.round(noiseRaw)));
  const peakLevel = Math.min(100, Math.round(relativeLevel + 9));
  const patternState: NoisePatternState =
    relativeLevel >= localSettings.noiseAnomalyThreshold
      ? 'spike_detected'
      : relativeLevel >= localSettings.noiseWarningThreshold
        ? 'high_noise'
        : 'normal';

  const evalRes = evaluateLocalHealth(resultant, relativeLevel, localSettings);

  const pt: TelemetryPoint = {
    id: `offline_${localStep}_${now.getTime()}`,
    machineId: localSettings.machineId,
    machineName: localSettings.machineName,
    timestamp: now.toISOString(),
    mode: localSettings.mode,
    deviceStatus: 'offline',
    vibration: {
      x,
      y,
      z,
      resultant,
      rms,
      peak,
      dominantFrequency: Number((48.2 + Math.sin(localStep * 0.2) * 1.1).toFixed(1)),
      dominantFreqSource: 'demo',
      status: evalRes.vibStatus,
    },
    noise: {
      relativeLevel,
      peakLevel,
      patternState,
      trend: isSpike ? 'Spiking' : 'Stable',
      status: evalRes.noiseStatus,
    },
    health: evalRes.health,
  };

  localHistory.push(pt);
  if (localHistory.length > 200) localHistory.shift();
  return pt;
}

export async function fetchLatestTelemetry(machineId = 'machine_01'): Promise<TelemetryPoint> {
  try {
    const res = await fetch(buildUrl(`/api/telemetry/latest?machineId=${encodeURIComponent(machineId)}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return generateOfflinePoint();
  }
}

export async function fetchTelemetryHistory(
  range: '15m' | '1h' | '24h' | '7d' = '15m',
  machineId = 'machine_01'
): Promise<TelemetryPoint[]> {
  try {
    const res = await fetch(
      buildUrl(`/api/telemetry/history?range=${range}&machineId=${encodeURIComponent(machineId)}`)
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    if (localHistory.length < 15) {
      for (let i = 0; i < 20; i++) generateOfflinePoint();
    }
    return [...localHistory];
  }
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch(buildUrl('/api/alerts'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [...localAlerts];
  }
}

export async function acknowledgeAlert(id: string): Promise<void> {
  try {
    await fetch(buildUrl('/api/alerts/acknowledge'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch {
    const item = localAlerts.find((a) => a.id === id);
    if (item) item.acknowledged = true;
  }
}

export async function clearAllAlerts(): Promise<void> {
  try {
    await fetch(buildUrl('/api/alerts/clear'), { method: 'POST' });
  } catch {
    localAlerts.length = 0;
  }
}

export async function fetchSettings(): Promise<MachineSettings> {
  try {
    const res = await fetch(buildUrl('/api/settings'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { ...localSettings };
  }
}

export async function updateSettings(
  patch: Partial<MachineSettings>
): Promise<MachineSettings> {
  try {
    const res = await fetch(buildUrl('/api/settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    localSettings = { ...localSettings, ...patch };
    return { ...localSettings };
  }
}

export async function runAiDiagnosis(
  machineId = 'machine_01'
): Promise<AiDiagnosisResponse> {
  try {
    const res = await fetch(buildUrl('/api/ai/diagnose'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const latest = localHistory[localHistory.length - 1] || generateOfflinePoint();
    return {
      evaluation: latest.health,
      detailedReport:
        `Offline Rule-Based Diagnostic Summary (${latest.machineName}):\n` +
        `• ADXL345 Resultant Acceleration: ${latest.vibration.resultant} m/s² (RMS ${latest.vibration.rms} m/s², Peak ${latest.vibration.peak} m/s²)\n` +
        `• MAX9814 Relative Sound Index: ${latest.noise.relativeLevel}% (Pattern: ${latest.noise.patternState})\n` +
        `• Deterministic Health Score: ${latest.health.score}/100 (${latest.health.status.toUpperCase()})\n\n` +
        `Recommendation: ${latest.health.recommendation}`,
      generatedBy: 'rule-engine',
      timestamp: new Date().toISOString(),
    };
  }
}
