# SmartVibe — AI-Based Machine Health Monitoring System

**Monitor • Analyze • Keep It Running**

SmartVibe is an industrial IoT + AI machine health monitoring dashboard powered by an ESP32 dual-sensor node:
1. **ADXL345 Accelerometer** (Tri-axial X, Y, Z acceleration, Resultant, RMS, Peak in `m/s²`)
2. **MAX9814 Electret Microphone** (Relative sound index `%`, Peak level, Acoustic pattern classification)

## Running Locally
```bash
npm install
npm run dev
```
The dashboard and Express API run together on `http://localhost:3000`.

## ESP32 Live Telemetry Endpoint
POST JSON packets to `/api/telemetry`:
```json
{
  "machineId": "machine_01",
  "x": 0.14,
  "y": 0.11,
  "z": 0.16,
  "noiseLevel": 56
}
```

## Android APK Build (Capacitor)
```bash
npm run build
npx cap sync android
```
Open `/android` in Android Studio to compile a signed or debug `.apk`.
