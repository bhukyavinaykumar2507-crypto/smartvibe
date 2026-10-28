/**
 * SmartVibe - Telemetry and Health Data Types
 * Standardized on:
 * - Acceleration: m/s² (Resultant, RMS, Peak)
 * - Temperature: °C
 * - Acoustic / Noise: Relative Noise Level (%) / Relative Signal Index
 */

export type HealthStatus = 'normal' | 'warning' | 'anomaly';

export interface VibrationReading {
  x: number; // m/s²
  y: number; // m/s²
  z: number; // m/s²
  resultant: number; // m/s² dynamic resultant acceleration
  rms: number; // m/s² acceleration RMS
  peak: number; // m/s² peak acceleration
  dominantFrequency: number | null; // Hz (or null if unavailable)
  dominantFreqSource?: 'calculated' | 'demo' | 'unavailable';
  baseline: number; // m/s² baseline acceleration
  deviationPercent: number; // % deviation from baseline
  status: HealthStatus;
}

export interface TemperatureReading {
  current: number; // °C
  min: number; // °C
  max: number; // °C
  warningThreshold: number; // °C
  criticalThreshold: number; // °C
  status: HealthStatus;
}

export interface NoiseReading {
  relativeLevel: number; // 0-100% relative envelope amplitude index (uncalibrated)
  peakLevel: number; // 0-100%
  variance: number;
  patternState: 'steady' | 'periodic_pulses' | 'erratic_bursts';
  trend: 'Stable' | 'Rising' | 'Fluctuating';
  status: HealthStatus;
  calibrationNote: string;
}

export interface MachineHealthEvaluation {
  score: number; // 0 - 100 calculated transparently
  status: HealthStatus;
  reasons: string[];
  recommendations: string[];
  scoringFormula: {
    vibrationPenalty: number;
    thermalPenalty: number;
    acousticPenalty: number;
    explanation: string;
  };
  disclaimer: string;
}

export interface TelemetryPoint {
  id: string;
  timestamp: string; // ISO
  machineId: string;
  machineName: string;
  vibration: VibrationReading;
  temperature: TemperatureReading;
  noise: NoiseReading;
  health: MachineHealthEvaluation;
  deviceStatus: 'online' | 'offline';
  hardware: {
    adxl345Connected: boolean;
    ds18b20Connected: boolean;
    max9814Connected: boolean;
  };
  source: 'demo_simulation' | 'esp32_hardware';
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'warning' | 'anomaly' | 'info';
  sensor: 'ADXL345 Vibration' | 'DS18B20 Temperature' | 'MAX9814 Noise' | 'System';
  parameter: string;
  recordedValue: string;
  thresholdValue: string;
  deviation: string;
  suggestedAction: string;
  acknowledged: boolean;
}

export interface MachineSettings {
  machineId: string;
  machineName: string;
  machineType: string;
  location: string;
  mode: 'demo' | 'live';
  demoScenario: 'normal' | 'bearing_wear' | 'overheating' | 'unbalance' | 'acoustic_spike';
  tempWarningThreshold: number;
  tempCriticalThreshold: number;
  vibrationBaseline: number;
  vibrationWarningThreshold: number;
  vibrationCriticalThreshold: number;
  noiseWarningThreshold: number;
  noiseCriticalThreshold: number;
  customApiUrl?: string; // Configurable remote API base URL for Android APK
}
