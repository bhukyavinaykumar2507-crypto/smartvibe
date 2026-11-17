export type HealthStatus = 'normal' | 'warning' | 'anomaly';

export type NoisePatternState = 'normal' | 'high_noise' | 'spike_detected';

export interface VibrationReading {
  x: number;
  y: number;
  z: number;
  resultant: number;
  rms: number;
  peak: number;
  dominantFrequency: number | null;
  dominantFreqSource: 'demo' | 'unavailable';
  status: HealthStatus;
}

export interface NoiseReading {
  relativeLevel: number;
  peakLevel: number;
  patternState: NoisePatternState;
  trend: string;
  status: HealthStatus;
}

export interface MachineHealthEvaluation {
  score: number;
  status: HealthStatus;
  vibrationPenalty: number;
  acousticPenalty: number;
  detectedConditions: string[];
  recommendation: string;
}

export interface TelemetryPoint {
  id: string;
  machineId: string;
  machineName: string;
  timestamp: string;
  mode: 'demo' | 'live';
  deviceStatus: 'online' | 'offline';
  vibration: VibrationReading;
  noise: NoiseReading;
  health: MachineHealthEvaluation;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'anomaly';
  sensor: 'Vibration (ADXL345)' | 'Noise (MAX9814)' | 'System';
  value: string;
  threshold: string;
  message: string;
  acknowledged: boolean;
}

export interface MachineSettings {
  machineId: string;
  machineName: string;
  mode: 'demo' | 'live';
  vibWarningThreshold: number;
  vibAnomalyThreshold: number;
  noiseWarningThreshold: number;
  noiseAnomalyThreshold: number;
  esp32TimeoutSeconds: number;
}

export interface AiDiagnosisResponse {
  evaluation: MachineHealthEvaluation;
  detailedReport: string;
  generatedBy: 'gemini' | 'rule-engine';
  timestamp: string;
}
