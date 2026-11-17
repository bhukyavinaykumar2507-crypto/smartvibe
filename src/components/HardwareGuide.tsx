import React, { useState } from 'react';
import { Cpu, Copy, Check, Send, Radio } from 'lucide-react';

interface HardwareGuideProps {
  onPacketSent?: () => void;
}

export const HardwareGuide: React.FC<HardwareGuideProps> = ({ onPacketSent }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const serverOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const esp32Code = `#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_ADXL345_U.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "${serverOrigin}/api/telemetry";

const int MAX9814_PIN = 34; // Analog ADC1 pin for MAX9814 OUT
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA = GPIO 21, SCL = GPIO 22
  if (!accel.begin()) {
    Serial.println("ADXL345 not detected! Check wiring.");
  }
  accel.setRange(ADXL345_RANGE_16_G);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  sensors_event_t event;
  accel.getEvent(&event);

  // Sample MAX9814 envelope peak-to-peak over 50ms window
  int signalMax = 0, signalMin = 4095;
  unsigned long startMillis = millis();
  while (millis() - startMillis < 50) {
    int sample = analogRead(MAX9814_PIN);
    if (sample > signalMax) signalMax = sample;
    if (sample < signalMin) signalMin = sample;
  }
  float noiseIndex = ((float)(signalMax - signalMin) / 4095.0) * 100.0;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"machineId\\":\\"machine_01\\",\\"x\\":" + String(event.acceleration.x, 3) +
                     ",\\"y\\":" + String(event.acceleration.y, 3) +
                     ",\\"z\\":" + String(event.acceleration.z, 3) +
                     ",\\"noiseLevel\\":" + String(noiseIndex, 1) + "}";
    http.POST(payload);
    http.end();
  }
  delay(2000);
}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(esp32Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestPacket = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: 'machine_01',
          x: 0.19,
          y: 0.14,
          z: 0.22,
          noiseLevel: 58,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestResult('Test packet delivered to /api/telemetry successfully.');
      onPacketSent?.();
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Failed to send test packet.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5 sv-enter">
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1322]/95 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                ESP32 Dual-Sensor Hardware Integration Guide
              </h2>
              <p className="text-xs text-slate-400">
                Pinout and HTTP JSON telemetry setup for ADXL345 + MAX9814
              </p>
            </div>
          </div>

          <button
            onClick={handleSendTestPacket}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{testing ? 'Sending...' : 'Send Test Telemetry Packet'}</span>
          </button>
        </div>

        {testResult && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs text-cyan-200 sv-tab-enter">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Pinout Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-800/40 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold text-cyan-300 mb-2">
              Sensor 1: ADXL345 Accelerometer (I2C)
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              <li>VCC &rarr; ESP32 3.3V</li>
              <li>GND &rarr; ESP32 GND</li>
              <li>SDA &rarr; ESP32 GPIO 21</li>
              <li>SCL &rarr; ESP32 GPIO 22</li>
              <li>CS &rarr; 3.3V (Enables I2C mode)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-purple-800/40 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold text-purple-300 mb-2">
              Sensor 2: MAX9814 Electret Microphone (Analog)
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              <li>VDD &rarr; ESP32 3.3V</li>
              <li>GND &rarr; ESP32 GND</li>
              <li>OUT &rarr; ESP32 GPIO 34 (ADC1_CH6)</li>
              <li>GAIN &rarr; Floating (Default 60dB AGC) or GND (50dB)</li>
            </ul>
          </div>
        </div>

        {/* Firmware Snippet */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              ESP32 Arduino HTTP Client Sketch
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-[#05080f] p-4 text-[11px] font-mono leading-relaxed text-cyan-200">
            {esp32Code}
          </pre>
        </div>
      </div>
    </div>
  );
};
