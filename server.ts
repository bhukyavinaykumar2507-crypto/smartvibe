import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import type {
  TelemetryPoint,
  AlertItem,
  MachineSettings,
  HealthStatus,
  NoisePatternState,
  MachineHealthEvaluation,
} from './src/types/telemetry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

const MACHINE_CATALOG: Record<string, string> = {
  machine_01: 'Machine 01 — CNC Spindle Motor',
  machine_02: 'Machine 02 — Centrifugal Slurry Pump',
  machine_03: 'Machine 03 — Industrial Blower',
};

let settings: MachineSettings = {
  machineId: 'machine_01',
  machineName: 'Machine 01',
  mode: 'demo',
  vibWarningThreshold: 0.45,
  vibAnomalyThreshold: 0.85,
  noiseWarningThreshold: 72,
  noiseAnomalyThreshold: 88,
  esp32TimeoutSeconds: 15,
};

const historyByMachine: Record<string, TelemetryPoint[]> = {
  machine_01: [],
  machine_02: [],
  machine_03: [],
};

const lastHardwarePacketByMachine: Record<string, number> = {
  machine_01: 0,
  machine_02: 0,
  machine_03: 0,
};

const alerts: AlertItem[] = [];
let simCounter = 0;

function evaluateMachineHealth(
  vibResultant: number,
  noiseLevel: number,
  cfg: MachineSettings
): {
  vibStatus: HealthStatus;
  noiseStatus: HealthStatus;
  health: MachineHealthEvaluation;
} {
  let vibStatus: HealthStatus = 'normal';
  if (vibResultant >= cfg.vibAnomalyThreshold) vibStatus = 'anomaly';
  else if (vibResultant >= cfg.vibWarningThreshold) vibStatus = 'warning';

  let noiseStatus: HealthStatus = 'normal';
  if (noiseLevel >= cfg.noiseAnomalyThreshold) noiseStatus = 'anomaly';
  else if (noiseLevel >= cfg.noiseWarningThreshold) noiseStatus = 'warning';

  // Deterministic 2-sensor scoring: Vibration penalty (0-65) + Acoustic penalty (0-35)
  const vibPenalty = Math.min(
    65,
    Math.round((vibResultant / Math.max(0.1, cfg.vibAnomalyThreshold)) * 55)
  );
  const acousticPenalty = Math.min(
    35,
    Math.round((noiseLevel / Math.max(1, cfg.noiseAnomalyThreshold)) * 30)
  );
  const score = Math.max(0, Math.min(100, 100 - (vibPenalty + acousticPenalty)));

  let overallStatus: HealthStatus = 'normal';
  if (vibStatus === 'anomaly' || noiseStatus === 'anomaly' || score < 55) {
    overallStatus = 'anomaly';
  } else if (vibStatus === 'warning' || noiseStatus === 'warning' || score < 78) {
    overallStatus = 'warning';
  }

  const detectedConditions: string[] = [];
  if (vibStatus === 'normal') {
    detectedConditions.push('ADXL345 tri-axial vibration within nominal operating envelope');
  } else if (vibStatus === 'warning') {
    detectedConditions.push('Elevated ADXL345 resultant acceleration approaching warning limit');
  } else {
    detectedConditions.push('Severe ADXL345 vibration anomaly — check imbalance or misalignment');
  }

  if (noiseStatus === 'normal') {
    detectedConditions.push('MAX9814 acoustic envelope within normal baseline');
  } else if (noiseStatus === 'warning') {
    detectedConditions.push('Elevated MAX9814 relative sound intensity detected');
  } else {
    detectedConditions.push('Critical MAX9814 acoustic transient spike detected');
  }

  const recommendation =
    overallStatus === 'anomaly'
      ? 'Inspect shaft alignment, bearing raceway wear, and mounting bolts immediately.'
      : overallStatus === 'warning'
        ? 'Schedule bearing lubrication check and fastener torque verification.'
        : 'Continue routine telemetry monitoring. No corrective maintenance required.';

  return {
    vibStatus,
    noiseStatus,
    health: {
      score,
      status: overallStatus,
      vibrationPenalty: vibPenalty,
      acousticPenalty: acousticPenalty,
      detectedConditions,
      recommendation,
    },
  };
}

function recordAlertsIfNeeded(point: TelemetryPoint) {
  if (point.vibration.status !== 'normal') {
    const severity = point.vibration.status === 'anomaly' ? 'anomaly' : 'warning';
    const lastSame = alerts.find(
      (a) => a.sensor === 'Vibration (ADXL345)' && a.severity === severity
    );
    const recentlyAdded =
      lastSame && Date.now() - new Date(lastSame.timestamp).getTime() < 20000;
    if (!recentlyAdded) {
      alerts.unshift({
        id: `alt_vib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: point.timestamp,
        severity,
        sensor: 'Vibration (ADXL345)',
        value: `${point.vibration.resultant.toFixed(2)} m/s²`,
        threshold:
          severity === 'anomaly'
            ? `>= ${settings.vibAnomalyThreshold} m/s²`
            : `>= ${settings.vibWarningThreshold} m/s²`,
        message:
          severity === 'anomaly'
            ? `Vibration spike (${point.vibration.resultant.toFixed(2)} m/s²) exceeded anomaly threshold on ${point.machineName}`
            : `Vibration amplitude (${point.vibration.resultant.toFixed(2)} m/s²) approaching advisory limit`,
        acknowledged: false,
      });
    }
  }

  if (point.noise.status !== 'normal') {
    const severity = point.noise.status === 'anomaly' ? 'anomaly' : 'warning';
    const lastSame = alerts.find(
      (a) => a.sensor === 'Noise (MAX9814)' && a.severity === severity
    );
    const recentlyAdded =
      lastSame && Date.now() - new Date(lastSame.timestamp).getTime() < 20000;
    if (!recentlyAdded) {
      alerts.unshift({
        id: `alt_noise_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: point.timestamp,
        severity,
        sensor: 'Noise (MAX9814)',
        value: `${point.noise.relativeLevel}%`,
        threshold:
          severity === 'anomaly'
            ? `>= ${settings.noiseAnomalyThreshold}%`
            : `>= ${settings.noiseWarningThreshold}%`,
        message:
          severity === 'anomaly'
            ? `Acoustic transient (${point.noise.relativeLevel}%) exceeded anomaly limit on ${point.machineName}`
            : `Elevated relative noise level (${point.noise.relativeLevel}%) detected`,
        acknowledged: false,
      });
    }
  }

  if (alerts.length > 60) {
    alerts.length = 60;
  }
}

function generateDemoPoint(machineId: string, timestampMs = Date.now()): TelemetryPoint {
  simCounter += 1;
  const offset = machineId === 'machine_02' ? 0.08 : machineId === 'machine_03' ? 0.05 : 0;
  const isPulse = simCounter % 29 === 0;

  const x = Number((0.12 + offset + Math.sin(simCounter * 0.42) * 0.04 + (isPulse ? 0.34 : 0)).toFixed(3));
  const y = Number((0.11 + offset * 0.7 + Math.cos(simCounter * 0.31) * 0.03 + (isPulse ? 0.25 : 0)).toFixed(3));
  const z = Number((0.15 + offset * 0.5 + Math.sin(simCounter * 0.24) * 0.02 + (isPulse ? 0.22 : 0)).toFixed(3));
  const resultant = Number(Math.sqrt(x * x + y * y + z * z).toFixed(2));
  const rms = Number((resultant * 0.72).toFixed(2));
  const peak = Number((resultant * 1.46).toFixed(2));

  const noiseBase = machineId === 'machine_02' ? 61 : machineId === 'machine_03' ? 58 : 52;
  const noiseLevel = Math.max(
    18,
    Math.min(
      98,
      Math.round(noiseBase + Math.sin(simCounter * 0.29) * 8 + (isPulse ? 24 : 0))
    )
  );
  const peakLevel = Math.min(100, Math.round(noiseLevel + 9));
  const patternState: NoisePatternState =
    noiseLevel >= settings.noiseAnomalyThreshold
      ? 'spike_detected'
      : noiseLevel >= settings.noiseWarningThreshold
        ? 'high_noise'
        : 'normal';

  const evalRes = evaluateMachineHealth(resultant, noiseLevel, settings);
  const ts = new Date(timestampMs).toISOString();

  const point: TelemetryPoint = {
    id: `demo_${machineId}_${timestampMs}_${simCounter}`,
    machineId,
    machineName: MACHINE_CATALOG[machineId]?.split(' — ')[0] || 'Machine 01',
    timestamp: ts,
    mode: 'demo',
    deviceStatus: 'offline',
    vibration: {
      x,
      y,
      z,
      resultant,
      rms,
      peak,
      dominantFrequency: Number((48.5 + Math.sin(simCounter * 0.17) * 1.3).toFixed(1)),
      dominantFreqSource: 'demo',
      status: evalRes.vibStatus,
    },
    noise: {
      relativeLevel: noiseLevel,
      peakLevel,
      patternState,
      trend: isPulse ? 'Rising' : 'Stable',
      status: evalRes.noiseStatus,
    },
    health: evalRes.health,
  };

  return point;
}

// Seed initial demo history across machines
for (const mId of Object.keys(historyByMachine)) {
  const now = Date.now();
  for (let i = 45; i >= 1; i--) {
    const pt = generateDemoPoint(mId, now - i * 15000);
    historyByMachine[mId].push(pt);
  }
}

// Background simulation tick when in demo mode
setInterval(() => {
  if (settings.mode !== 'demo') return;
  for (const mId of Object.keys(historyByMachine)) {
    const pt = generateDemoPoint(mId);
    const list = historyByMachine[mId];
    list.push(pt);
    if (list.length > 300) list.shift();
    if (mId === settings.machineId) {
      recordAlertsIfNeeded(pt);
    }
  }
}, 2000);

function isHardwareOnline(machineId: string): boolean {
  const lastMs = lastHardwarePacketByMachine[machineId] || 0;
  if (!lastMs) return false;
  return Date.now() - lastMs <= settings.esp32TimeoutSeconds * 1000;
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: settings.mode, sensors: ['ADXL345', 'MAX9814'] });
  });

  app.get('/api/telemetry/latest', (req, res) => {
    const machineId = String(req.query.machineId || settings.machineId || 'machine_01');
    const list = historyByMachine[machineId] || historyByMachine.machine_01;
    const online = isHardwareOnline(machineId);

    if (settings.mode === 'live') {
      const latestHardware = [...list].reverse().find((p) => p.mode === 'live');
      if (latestHardware) {
        return res.json({
          ...latestHardware,
          deviceStatus: online ? 'online' : 'offline',
        });
      }
      // Return honest empty/offline live telemetry state when awaiting first ESP32 packet
      const evalRes = evaluateMachineHealth(0, 0, settings);
      return res.json({
        id: `live_awaiting_${machineId}`,
        machineId,
        machineName: MACHINE_CATALOG[machineId]?.split(' — ')[0] || 'Machine 01',
        timestamp: '',
        mode: 'live',
        deviceStatus: 'offline',
        vibration: {
          x: 0,
          y: 0,
          z: 0,
          resultant: 0,
          rms: 0,
          peak: 0,
          dominantFrequency: null,
          dominantFreqSource: 'unavailable',
          status: 'normal',
        },
        noise: {
          relativeLevel: 0,
          peakLevel: 0,
          patternState: 'normal',
          trend: 'Awaiting packet',
          status: 'normal',
        },
        health: {
          ...evalRes.health,
          detectedConditions: ['Awaiting valid ESP32 ADXL345 + MAX9814 HTTP telemetry packet'],
          recommendation: 'Ensure ESP32 is connected to Wi-Fi and POSTing to /api/telemetry.',
        },
      } satisfies TelemetryPoint);
    }

    const latest = list[list.length - 1] || generateDemoPoint(machineId);
    res.json({
      ...latest,
      mode: 'demo',
      deviceStatus: online ? 'online' : 'offline',
    });
  });

  app.get('/api/telemetry/history', (req, res) => {
    const machineId = String(req.query.machineId || settings.machineId || 'machine_01');
    const range = String(req.query.range || '15m');
    const list = historyByMachine[machineId] || historyByMachine.machine_01;

    const filtered =
      settings.mode === 'live' ? list.filter((p) => p.mode === 'live') : list;

    const sliceCount =
      range === '15m' ? 40 : range === '1h' ? 80 : range === '24h' ? 160 : 240;
    res.json(filtered.slice(-sliceCount));
  });

  // Real ESP32 HTTP POST endpoint for ADXL345 + MAX9814
  app.post('/api/telemetry', (req, res) => {
    const body = req.body || {};
    const machineId = String(body.machineId || settings.machineId || 'machine_01');
    const x = Number(body.x ?? 0);
    const y = Number(body.y ?? 0);
    const z = Number(body.z ?? 0);
    const noiseLevel = Math.max(0, Math.min(100, Number(body.noiseLevel ?? body.noise ?? 0)));

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(noiseLevel)) {
      return res.status(400).json({ error: 'Invalid ADXL345 or MAX9814 numeric payload.' });
    }

    const resultant = Number(
      (body.resultant !== undefined ? Number(body.resultant) : Math.sqrt(x * x + y * y + z * z)).toFixed(2)
    );
    const rms = Number((body.rms !== undefined ? Number(body.rms) : resultant * 0.72).toFixed(2));
    const peak = Number((body.peak !== undefined ? Number(body.peak) : resultant * 1.35).toFixed(2));
    const domFreq =
      body.dominantFrequency !== undefined && Number.isFinite(Number(body.dominantFrequency))
        ? Number(body.dominantFrequency)
        : null;

    const patternState: NoisePatternState =
      noiseLevel >= settings.noiseAnomalyThreshold
        ? 'spike_detected'
        : noiseLevel >= settings.noiseWarningThreshold
          ? 'high_noise'
          : 'normal';

    const evalRes = evaluateMachineHealth(resultant, noiseLevel, settings);
    const nowMs = Date.now();
    lastHardwarePacketByMachine[machineId] = nowMs;

    const point: TelemetryPoint = {
      id: `esp32_${machineId}_${nowMs}`,
      machineId,
      machineName: MACHINE_CATALOG[machineId]?.split(' — ')[0] || 'Machine 01',
      timestamp: new Date(nowMs).toISOString(),
      mode: 'live',
      deviceStatus: 'online',
      vibration: {
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        z: Number(z.toFixed(3)),
        resultant,
        rms,
        peak,
        dominantFrequency: domFreq,
        dominantFreqSource: domFreq !== null ? 'demo' : 'unavailable',
        status: evalRes.vibStatus,
      },
      noise: {
        relativeLevel: Math.round(noiseLevel),
        peakLevel: Math.min(100, Math.round(Number(body.noisePeak ?? noiseLevel + 6))),
        patternState,
        trend: evalRes.noiseStatus === 'anomaly' ? 'Spiking' : 'Live',
        status: evalRes.noiseStatus,
      },
      health: evalRes.health,
    };

    if (!historyByMachine[machineId]) historyByMachine[machineId] = [];
    historyByMachine[machineId].push(point);
    if (historyByMachine[machineId].length > 300) historyByMachine[machineId].shift();
    recordAlertsIfNeeded(point);

    res.status(201).json(point);
  });

  app.get('/api/alerts', (_req, res) => {
    res.json(alerts);
  });

  app.post('/api/alerts/acknowledge', (req, res) => {
    const id = String(req.body?.id || '');
    const target = alerts.find((a) => a.id === id);
    if (target) target.acknowledged = true;
    res.json({ ok: true });
  });

  app.post('/api/alerts/clear', (_req, res) => {
    alerts.length = 0;
    res.json({ ok: true });
  });

  app.get('/api/settings', (_req, res) => {
    res.json(settings);
  });

  app.post('/api/settings', (req, res) => {
    const patch = req.body || {};
    settings = {
      ...settings,
      ...patch,
      vibWarningThreshold: Number(patch.vibWarningThreshold ?? settings.vibWarningThreshold),
      vibAnomalyThreshold: Number(patch.vibAnomalyThreshold ?? settings.vibAnomalyThreshold),
      noiseWarningThreshold: Number(patch.noiseWarningThreshold ?? settings.noiseWarningThreshold),
      noiseAnomalyThreshold: Number(patch.noiseAnomalyThreshold ?? settings.noiseAnomalyThreshold),
      esp32TimeoutSeconds: Number(patch.esp32TimeoutSeconds ?? settings.esp32TimeoutSeconds),
    };
    res.json(settings);
  });

  app.post('/api/ai/diagnose', async (req, res) => {
    const machineId = String(req.body?.machineId || settings.machineId || 'machine_01');
    const list = historyByMachine[machineId] || historyByMachine.machine_01;
    const recent = list.slice(-10);
    const latest = recent[recent.length - 1] || generateDemoPoint(machineId);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Analyze the following real-time industrial machine telemetry from a 2-sensor ESP32 node (ADXL345 Tri-Axis Accelerometer + MAX9814 Electret Microphone ONLY — there is NO temperature sensor).
Machine: ${latest.machineName}
Operation Mode: ${settings.mode.toUpperCase()}
Deterministic Health Score: ${latest.health.score}/100 (${latest.health.status.toUpperCase()})
ADXL345 Vibration: X=${latest.vibration.x} m/s², Y=${latest.vibration.y} m/s², Z=${latest.vibration.z} m/s², Resultant=${latest.vibration.resultant} m/s², RMS=${latest.vibration.rms} m/s², Peak=${latest.vibration.peak} m/s² (Warning >= ${settings.vibWarningThreshold}, Anomaly >= ${settings.vibAnomalyThreshold})
MAX9814 Relative Sound Index: ${latest.noise.relativeLevel}% (Peak ${latest.noise.peakLevel}%, Pattern: ${latest.noise.patternState}, Warning >= ${settings.noiseWarningThreshold}%, Anomaly >= ${settings.noiseAnomalyThreshold}%)
Detected Conditions: ${latest.health.detectedConditions.join('; ')}

Provide a concise, engineering-grade diagnostic assessment in 4 short bullet points covering mechanical balance/bearing vibration, acoustic signature, fault likelihood, and recommended physical inspection steps. Do NOT mention or assume temperature or thermal sensors.`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
        });

        const text = response.text?.trim();
        if (text) {
          return res.json({
            evaluation: latest.health,
            detailedReport: text,
            generatedBy: 'gemini',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Gemini diagnostic fallback triggered:', err instanceof Error ? err.message : err);
      }
    }

    const fallbackReport =
      `SmartVibe Deterministic Diagnostic Summary (${latest.machineName}):\n` +
      `• ADXL345 Vibration Profile: Resultant ${latest.vibration.resultant} m/s² (X: ${latest.vibration.x}, Y: ${latest.vibration.y}, Z: ${latest.vibration.z} m/s²), RMS ${latest.vibration.rms} m/s², Peak ${latest.vibration.peak} m/s².\n` +
      `• MAX9814 Acoustic Signature: Relative noise level ${latest.noise.relativeLevel}% (Peak ${latest.noise.peakLevel}%, pattern classified as ${latest.noise.patternState.replace('_', ' ')}).\n` +
      `• Penalty Breakdown: Vibration Penalty -${latest.health.vibrationPenalty} pts | Acoustic Penalty -${latest.health.acousticPenalty} pts -> Score ${latest.health.score}/100 (${latest.health.status.toUpperCase()}).\n` +
      `• Maintenance Action: ${latest.health.recommendation}`;

    res.json({
      evaluation: latest.health,
      detailedReport: fallbackReport,
      generatedBy: 'rule-engine',
      timestamp: new Date().toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartVibe server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SmartVibe server:', err);
  process.exit(1);
});
