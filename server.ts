import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type { 
  TelemetryPoint, 
  MachineSettings, 
  AlertItem, 
  HealthStatus,
  MachineHealthEvaluation 
} from './src/types/telemetry.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state
let settings: MachineSettings = {
  machineId: 'machine_01',
  machineName: 'Machine 01 — CNC Spindle Drive',
  machineType: 'Three-Phase AC Induction Motor & Milling Spindle',
  location: 'Lab Test Bay 3 / Bench A',
  mode: 'demo',
  demoScenario: 'normal',
  tempWarningThreshold: 55,
  tempCriticalThreshold: 75,
  vibrationBaseline: 1.2,
  vibrationWarningThreshold: 2.8, // ISO 10816 Zone C boundary
  vibrationCriticalThreshold: 4.5, // ISO 10816 Zone D boundary
  noiseWarningThreshold: 68,
  noiseCriticalThreshold: 85,
};

let telemetryHistory: TelemetryPoint[] = [];
let alerts: AlertItem[] = [];
let lastHardwarePacketTime: number = 0;
let simulationStep = 0;

// Scoring algorithm compliant with ISO 10816-1 severity zones
function evaluateHealth(
  vibrationRMS: number,
  temperature: number,
  noiseRelative: number,
  cfg: MachineSettings
): MachineHealthEvaluation {
  // Vibration penalty (0 - 45 pts)
  let vibPenalty = 0;
  if (vibrationRMS > cfg.vibrationBaseline) {
    const range = Math.max(0.1, cfg.vibrationCriticalThreshold - cfg.vibrationBaseline);
    const ratio = (vibrationRMS - cfg.vibrationBaseline) / range;
    vibPenalty = Math.min(45, Math.max(0, Math.round(ratio * 45)));
  }

  // Thermal penalty (0 - 35 pts)
  let thermPenalty = 0;
  if (temperature > cfg.tempWarningThreshold) {
    const range = Math.max(1, cfg.tempCriticalThreshold - cfg.tempWarningThreshold);
    const ratio = (temperature - cfg.tempWarningThreshold) / range;
    thermPenalty = Math.min(35, Math.max(0, Math.round(ratio * 35)));
  }

  // Acoustic penalty (0 - 20 pts)
  let noisePenalty = 0;
  if (noiseRelative > cfg.noiseWarningThreshold) {
    const range = Math.max(1, cfg.noiseCriticalThreshold - cfg.noiseWarningThreshold);
    const ratio = (noiseRelative - cfg.noiseWarningThreshold) / range;
    noisePenalty = Math.min(20, Math.max(0, Math.round(ratio * 20)));
  }

  const score = Math.max(0, 100 - (vibPenalty + thermPenalty + noisePenalty));

  let status: HealthStatus = 'normal';
  if (score < 60 || vibrationRMS >= cfg.vibrationCriticalThreshold || temperature >= cfg.tempCriticalThreshold) {
    status = 'anomaly';
  } else if (score < 80 || vibrationRMS >= cfg.vibrationWarningThreshold || temperature >= cfg.tempWarningThreshold || noiseRelative >= cfg.noiseWarningThreshold) {
    status = 'warning';
  }

  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (vibrationRMS >= cfg.vibrationCriticalThreshold) {
    reasons.push(`Vibration RMS (${vibrationRMS.toFixed(2)} mm/s) severely exceeds ISO 10816 Zone C threshold (${cfg.vibrationCriticalThreshold} mm/s).`);
    recommendations.push('Immediate mechanical inspection of spindle/bearing assembly; inspect for unbalance or loose coupling.');
  } else if (vibrationRMS >= cfg.vibrationWarningThreshold) {
    reasons.push(`Vibration RMS (${vibrationRMS.toFixed(2)} mm/s) has entered ISO 10816 Advisory Zone C.`);
    recommendations.push('Check sensor ADXL345 magnetic/screw mounting rigidity; verify baseline alignment during off-peak load.');
  }

  if (temperature >= cfg.tempCriticalThreshold) {
    reasons.push(`DS18B20 temperature (${temperature.toFixed(1)}°C) exceeds critical limit (${cfg.tempCriticalThreshold}°C).`);
    recommendations.push('Inspect cooling fan ducting, thermal paste/heatsink contact, and thermal overload relay.');
  } else if (temperature >= cfg.tempWarningThreshold) {
    reasons.push(`DS18B20 temperature (${temperature.toFixed(1)}°C) elevated above warning threshold (${cfg.tempWarningThreshold}°C).`);
    recommendations.push('Verify machine ambient airflow and monitor motor casing temperature gradient.');
  }

  if (noiseRelative >= cfg.noiseCriticalThreshold) {
    reasons.push(`MAX9814 relative acoustic envelope (${noiseRelative.toFixed(1)}%) reached high-intensity peaks.`);
    recommendations.push('Check for external acoustic interference, microphone placement proximity, or continuous bearing friction chatter.');
  } else if (noiseRelative >= cfg.noiseWarningThreshold) {
    reasons.push(`MAX9814 relative acoustic level (${noiseRelative.toFixed(1)}%) is above baseline operational envelope.`);
    recommendations.push('Perform frequency spot check; verify if noise correlates with motor rotational speed.');
  }

  if (reasons.length === 0) {
    reasons.push('All parameters (vibration, temperature, acoustic envelope) are operating within nominal baseline tolerances.');
    recommendations.push('Maintain regular predictive maintenance logging and baseline calibration schedule.');
  }

  return {
    score,
    status,
    reasons,
    recommendations,
    scoringFormula: {
      vibrationPenalty: vibPenalty,
      thermalPenalty: thermPenalty,
      acousticPenalty: noisePenalty,
      explanation: 'Health Score = 100 - (VibrationPenalty [0-45] + ThermalPenalty [0-35] + AcousticPenalty [0-20])'
    },
    disclaimer: 'Cautious Engineering Notice: Sensor deviations suggest condition variance. Physical inspection is required before asserting any confirmed mechanical failure.'
  };
}

// Generate a synthetic or calibrated data point
function createSyntheticDataPoint(timestampStr?: string): TelemetryPoint {
  const timestamp = timestampStr || new Date().toISOString();
  simulationStep += 0.2;

  let x = 0.4 + Math.sin(simulationStep * 0.7) * 0.2;
  let y = 0.3 + Math.cos(simulationStep * 0.5) * 0.15;
  let z = 9.81 + Math.sin(simulationStep * 1.2) * 0.25; // gravity + perturbation
  let temp = 39.2 + Math.sin(simulationStep * 0.1) * 2.5;
  let noiseRel = 35 + Math.sin(simulationStep * 0.8) * 8;
  let pattern: 'steady' | 'periodic_pulses' | 'erratic_bursts' = 'steady';

  // Apply scenario modifications
  switch (settings.demoScenario) {
    case 'bearing_wear':
      // Higher vibration with sporadic shock peaks and friction acoustics
      x += (Math.random() > 0.7 ? 2.5 : 1.2) + Math.sin(simulationStep * 2.8) * 0.9;
      y += 1.4 + Math.cos(simulationStep * 2.1) * 0.7;
      temp += 8.5 + (Math.sin(simulationStep * 0.15) * 3);
      noiseRel = 69 + Math.random() * 12;
      pattern = 'periodic_pulses';
      break;

    case 'overheating':
      // High temperature condition
      temp = 68.4 + Math.sin(simulationStep * 0.2) * 6;
      x += 0.6;
      y += 0.5;
      noiseRel = 44 + Math.random() * 6;
      pattern = 'steady';
      break;

    case 'unbalance':
      // Massive 1X rotational vibration
      x += Math.sin(simulationStep * 1.8) * 3.8;
      y += Math.cos(simulationStep * 1.8) * 3.6;
      temp += 4.2;
      noiseRel = 58 + Math.sin(simulationStep * 1.8) * 14;
      pattern = 'periodic_pulses';
      break;

    case 'acoustic_spike':
      // High noise bursts while vibration is steady
      noiseRel = 82 + Math.random() * 14;
      temp = 41.2;
      pattern = 'erratic_bursts';
      break;

    case 'normal':
    default:
      // Nominal, stable operational condition
      temp = 38.5 + Math.sin(simulationStep * 0.1) * 1.8;
      noiseRel = 32 + Math.random() * 6;
      pattern = 'steady';
      break;
  }

  // Jitter
  x += (Math.random() - 0.5) * 0.15;
  y += (Math.random() - 0.5) * 0.15;
  z += (Math.random() - 0.5) * 0.15;

  const dynamicAcc = Math.sqrt(x * x + y * y + Math.pow(z - 9.81, 2));
  const resultant = Number(dynamicAcc.toFixed(2));
  const rms = Number((dynamicAcc * 0.707 + (settings.demoScenario === 'unbalance' ? 1.8 : 0.4)).toFixed(2));
  const peak = Number((dynamicAcc * 1.414 + 0.3).toFixed(2));

  // Determine individual statuses
  let vibStatus: HealthStatus = 'normal';
  if (rms >= settings.vibrationCriticalThreshold) vibStatus = 'anomaly';
  else if (rms >= settings.vibrationWarningThreshold) vibStatus = 'warning';

  let tempStatus: HealthStatus = 'normal';
  if (temp >= settings.tempCriticalThreshold) tempStatus = 'anomaly';
  else if (temp >= settings.tempWarningThreshold) tempStatus = 'warning';

  let noiseStatus: HealthStatus = 'normal';
  if (noiseRel >= settings.noiseCriticalThreshold) noiseStatus = 'anomaly';
  else if (noiseRel >= settings.noiseWarningThreshold) noiseStatus = 'warning';

  // Overall evaluation
  const health = evaluateHealth(rms, temp, noiseRel, settings);

  // Check alert creation
  if (health.status !== 'normal') {
    const existingUnack = alerts.find(a => !a.acknowledged && a.severity === health.status);
    if (!existingUnack || alerts.length < 5) {
      const topReason = health.reasons[0] || 'Condition parameter alert';
      const sensorName = vibStatus !== 'normal' 
        ? 'ADXL345 Vibration' 
        : tempStatus !== 'normal' 
          ? 'DS18B20 Temperature' 
          : 'MAX9814 Noise';
      
      const newAlert: AlertItem = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        severity: health.status,
        sensor: sensorName,
        parameter: sensorName.includes('Vibration') ? 'Vibration RMS' : sensorName.includes('Temperature') ? 'Temperature' : 'Acoustic Level',
        recordedValue: sensorName.includes('Vibration') ? `${rms} mm/s` : sensorName.includes('Temperature') ? `${temp.toFixed(1)}°C` : `${noiseRel.toFixed(1)}%`,
        thresholdValue: sensorName.includes('Vibration') ? `${settings.vibrationWarningThreshold} mm/s` : sensorName.includes('Temperature') ? `${settings.tempWarningThreshold}°C` : `${settings.noiseWarningThreshold}%`,
        deviation: `+${((rms - settings.vibrationBaseline) / settings.vibrationBaseline * 100).toFixed(0)}%`,
        suggestedAction: health.recommendations[0] || 'Inspect physical mounting and verify cable connections.',
        acknowledged: false
      };

      // Keep alerts array clean (max 50)
      if (!alerts.some(a => a.parameter === newAlert.parameter && a.severity === newAlert.severity && !a.acknowledged)) {
        alerts.unshift(newAlert);
        if (alerts.length > 50) alerts.pop();
      }
    }
  }

  // Historical temperature stats
  const tempHistory = telemetryHistory.map(p => p.temperature.current).concat([temp]);
  const minTemp = Number(Math.min(...tempHistory).toFixed(1));
  const maxTemp = Number(Math.max(...tempHistory).toFixed(1));

  return {
    id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    machineId: settings.machineId,
    machineName: settings.machineName,
    vibration: {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      z: Number(z.toFixed(2)),
      resultant: Number((dynamicAcc > 0 ? dynamicAcc * 0.25 + 0.18 : 0.18).toFixed(2)),
      rms: Number((rms * 0.2 + 0.12).toFixed(2)),
      peak: Number((peak * 0.2 + 0.36).toFixed(2)),
      dominantFrequency: Number((48.7 + (settings.demoScenario === 'unbalance' ? 51.3 : (Math.random() - 0.5) * 0.4)).toFixed(1)),
      baseline: settings.vibrationBaseline,
      deviationPercent: Number((((rms - settings.vibrationBaseline) / settings.vibrationBaseline) * 100).toFixed(1)),
      status: vibStatus,
    },
    temperature: {
      current: Number(temp.toFixed(1)),
      min: minTemp || 28.3,
      max: maxTemp || 56.2,
      warningThreshold: settings.tempWarningThreshold,
      criticalThreshold: settings.tempCriticalThreshold,
      status: tempStatus,
    },
    noise: {
      relativeLevel: Number(noiseRel.toFixed(1)),
      peakLevel: Number(Math.min(150, noiseRel * 1.5).toFixed(1)),
      variance: Number((Math.random() * 4.2).toFixed(2)),
      patternState: pattern,
      trend: settings.demoScenario === 'bearing_wear' ? 'Rising' : settings.demoScenario === 'acoustic_spike' ? 'Fluctuating' : 'Stable',
      status: noiseStatus,
      calibrationNote: 'Uncalibrated relative acoustic envelope index (0-100%). Not calibrated dB SPL.'
    },
    health,
    deviceStatus: settings.mode === 'live' 
      ? (Date.now() - lastHardwarePacketTime < 15000 ? 'online' : 'offline')
      : 'online',
    hardware: {
      adxl345Connected: true,
      ds18b20Connected: true,
      max9814Connected: true,
    },
    source: settings.mode === 'live' ? 'esp32_hardware' : 'demo_simulation'
  };
}

// Seed initial history points
function seedTelemetryHistory() {
  telemetryHistory = [];
  const now = Date.now();
  const pointsCount = 60; // past 60 intervals
  for (let i = pointsCount; i >= 0; i--) {
    const time = new Date(now - i * 15000).toISOString();
    const pt = createSyntheticDataPoint(time);
    telemetryHistory.push(pt);
  }
}
seedTelemetryHistory();

// Background tick for simulation
setInterval(() => {
  if (settings.mode === 'demo') {
    const pt = createSyntheticDataPoint();
    telemetryHistory.push(pt);
    if (telemetryHistory.length > 300) {
      telemetryHistory.shift();
    }
  }
}, 2000);

// API Endpoints

// 1. Telemetry Latest
app.get('/api/telemetry/latest', (_req, res) => {
  const latest = telemetryHistory[telemetryHistory.length - 1] || createSyntheticDataPoint();
  // Recalculate deviceStatus dynamically
  const isOnline = settings.mode === 'demo' || (Date.now() - lastHardwarePacketTime < 15000);
  res.json({
    ...latest,
    deviceStatus: isOnline ? 'online' : 'offline',
    settings,
    serverTime: new Date().toISOString()
  });
});

// 2. Telemetry History (with range filtering)
app.get('/api/telemetry/history', (req, res) => {
  const range = (req.query.range as string) || '15m';
  const now = Date.now();
  let timeWindowMs = 15 * 60 * 1000; // 15 min default

  if (range === '1h') timeWindowMs = 60 * 60 * 1000;
  else if (range === '24h') timeWindowMs = 24 * 60 * 60 * 1000;
  else if (range === '7d') timeWindowMs = 7 * 24 * 60 * 60 * 1000;

  const filtered = telemetryHistory.filter(pt => {
    const ptTime = new Date(pt.timestamp).getTime();
    return now - ptTime <= timeWindowMs;
  });

  res.json({
    range,
    count: filtered.length,
    points: filtered.length > 0 ? filtered : telemetryHistory.slice(-20)
  });
});

// 3. Settings Get & Update
app.get('/api/settings', (_req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const body = req.body;
  settings = {
    ...settings,
    ...body,
    // ensure numeric types
    tempWarningThreshold: Number(body.tempWarningThreshold ?? settings.tempWarningThreshold),
    tempCriticalThreshold: Number(body.tempCriticalThreshold ?? settings.tempCriticalThreshold),
    vibrationBaseline: Number(body.vibrationBaseline ?? settings.vibrationBaseline),
    vibrationWarningThreshold: Number(body.vibrationWarningThreshold ?? settings.vibrationWarningThreshold),
    vibrationCriticalThreshold: Number(body.vibrationCriticalThreshold ?? settings.vibrationCriticalThreshold),
    noiseWarningThreshold: Number(body.noiseWarningThreshold ?? settings.noiseWarningThreshold),
    noiseCriticalThreshold: Number(body.noiseCriticalThreshold ?? settings.noiseCriticalThreshold),
  };

  res.json({ success: true, settings });
});

// 4. Alerts API
app.get('/api/alerts', (_req, res) => {
  res.json(alerts);
});

app.post('/api/alerts/acknowledge', (req, res) => {
  const { alertId } = req.body;
  alerts = alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
  res.json({ success: true });
});

app.post('/api/alerts/clear', (_req, res) => {
  alerts = alerts.filter(a => !a.acknowledged);
  res.json({ success: true, remaining: alerts.length });
});

// 5. Ingestion Endpoint for ESP32 Hardware
app.post('/api/telemetry', (req, res) => {
  try {
    const {
      machine_id,
      vibration_x,
      vibration_y,
      vibration_z,
      vibration_rms,
      temperature,
      noise_relative,
      hardware_status
    } = req.body;

    lastHardwarePacketTime = Date.now();

    const timestamp = new Date().toISOString();
    const x = Number(vibration_x ?? 0);
    const y = Number(vibration_y ?? 0);
    const z = Number(vibration_z ?? 9.81);
    const dynamicAcc = Math.sqrt(x * x + y * y + Math.pow(z - 9.81, 2));
    const resultant = Number(dynamicAcc.toFixed(2));
    const rms = Number((vibration_rms ?? dynamicAcc * 0.707).toFixed(2));
    const peak = Number((dynamicAcc * 1.414).toFixed(2));
    const temp = Number(temperature ?? 25.0);
    const noise = Number(noise_relative ?? 30.0);

    let vibStatus: HealthStatus = 'normal';
    if (rms >= settings.vibrationCriticalThreshold) vibStatus = 'anomaly';
    else if (rms >= settings.vibrationWarningThreshold) vibStatus = 'warning';

    let tempStatus: HealthStatus = 'normal';
    if (temp >= settings.tempCriticalThreshold) tempStatus = 'anomaly';
    else if (temp >= settings.tempWarningThreshold) tempStatus = 'warning';

    let noiseStatus: HealthStatus = 'normal';
    if (noise >= settings.noiseCriticalThreshold) noiseStatus = 'anomaly';
    else if (noise >= settings.noiseWarningThreshold) noiseStatus = 'warning';

    const health = evaluateHealth(rms, temp, noise, settings);

    const point: TelemetryPoint = {
      id: `hw-${Date.now()}`,
      timestamp,
      machineId: machine_id || settings.machineId,
      machineName: settings.machineName,
      vibration: {
        x,
        y,
        z,
        resultant,
        rms,
        peak,
        dominantFrequency: 48.7,
        baseline: settings.vibrationBaseline,
        deviationPercent: Number((((rms - settings.vibrationBaseline) / settings.vibrationBaseline) * 100).toFixed(1)),
        status: vibStatus
      },
      temperature: {
        current: temp,
        min: temp,
        max: temp,
        warningThreshold: settings.tempWarningThreshold,
        criticalThreshold: settings.tempCriticalThreshold,
        status: tempStatus
      },
      noise: {
        relativeLevel: noise,
        peakLevel: Number((noise * 1.1).toFixed(1)),
        variance: 1.0,
        patternState: 'steady',
        trend: 'Stable',
        status: noiseStatus,
        calibrationNote: 'ESP32 ADC raw envelope sampling. Uncalibrated relative noise level.'
      },
      health,
      deviceStatus: 'online',
      hardware: {
        adxl345Connected: hardware_status?.adxl345 ?? true,
        ds18b20Connected: hardware_status?.ds18b20 ?? true,
        max9814Connected: hardware_status?.max9814 ?? true
      },
      source: 'esp32_hardware'
    };

    telemetryHistory.push(point);
    if (telemetryHistory.length > 500) telemetryHistory.shift();

    res.status(201).json({ success: true, pointId: point.id, healthStatus: health.status });
  } catch (err: any) {
    res.status(400).json({ error: 'Malformed telemetry packet', message: err.message });
  }
});

// 6. AI Machine Health Diagnostic (Rule-based + optional Gemini analysis)
app.post('/api/ai/diagnose', async (req, res) => {
  const latest = telemetryHistory[telemetryHistory.length - 1] || createSyntheticDataPoint();
  const apiKey = process.env.GEMINI_API_KEY;

  const baselineRuleAnalysis = {
    vibrationAnalysis: `ADXL345 recorded resultant vibration is ${latest.vibration.resultant} m/s² with RMS of ${latest.vibration.rms} mm/s (baseline: ${latest.vibration.baseline} mm/s, deviation: ${latest.vibration.deviationPercent}%). According to ISO 10816-1 machinery guidelines, operation sits in ${latest.vibration.status.toUpperCase()} zone.`,
    temperatureAnalysis: `DS18B20 digital temperature probe indicates ${latest.temperature.current}°C (warning threshold: ${latest.temperature.warningThreshold}°C, critical: ${latest.temperature.criticalThreshold}°C). Thermal status is ${latest.temperature.status.toUpperCase()}.`,
    acousticAnalysis: `MAX9814 relative acoustic amplitude index is ${latest.noise.relativeLevel}% (peak: ${latest.noise.peakLevel}%). Pattern classified as ${latest.noise.patternState}. Note: Uncalibrated relative microphone signal.`,
    holisticConditionScore: latest.health.score,
    overallAssessment: latest.health.reasons.join(' '),
    cautiousRecommendations: latest.health.recommendations,
    disclaimer: 'Notice: This AI diagnostic evaluation is advisory. Sensor telemetry alone cannot establish conclusive mechanical diagnosis. Certified personnel physical inspection is required before taking equipment offline or performing teardown.'
  };

  // If Gemini API Key is configured, enrich with Gemini 2.5 Flash
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an industrial mechanical reliability engineer analyzing an automated condition-monitoring system called SmartVibe.
Machine: ${latest.machineName} (${settings.machineType})
Sensors:
1. ADXL345 Vibration: Resultant=${latest.vibration.resultant} m/s², RMS=${latest.vibration.rms} mm/s, Peak=${latest.vibration.peak} m/s², Baseline=${latest.vibration.baseline} mm/s
2. DS18B20 Temperature: Current=${latest.temperature.current}°C, Warning=${latest.temperature.warningThreshold}°C, Critical=${latest.temperature.criticalThreshold}°C
3. MAX9814 Noise: Relative Amplitude Envelope=${latest.noise.relativeLevel}% (uncalibrated ADC index, not dB SPL), Pattern=${latest.noise.patternState}
Current Health Score: ${latest.health.score}/100 (Status: ${latest.health.status})

Provide a structured, cautious technical assessment:
- Multi-parameter correlation analysis
- Potential mechanical explanations to verify (e.g. bearing lubrication, shaft misalignment, belt tension, or sensor mounting looseness)
- Step-by-step cautious recommendations (strictly adhering to: do NOT claim a confirmed mechanical fault from sensor readings alone).
Keep your tone rigorous, professional, and practical for an engineering lab test bay.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return res.json({
        ...baselineRuleAnalysis,
        geminiEnriched: true,
        detailedAiReport: response.text
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to rule-based engine:', err?.message);
    }
  }

  res.json({
    ...baselineRuleAnalysis,
    geminiEnriched: false,
    detailedAiReport: null
  });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartVibe IoT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
