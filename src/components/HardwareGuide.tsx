import React, { useState } from 'react';
import { Cpu, Copy, Check, Terminal, Wifi, Send, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface HardwareGuideProps {
  onSendTestPacket: () => Promise<void>;
  isSendingPacket: boolean;
  appUrl: string;
}

export const HardwareGuide: React.FC<HardwareGuideProps> = ({
  onSendTestPacket,
  isSendingPacket,
  appUrl,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const endpointUrl = `${appUrl || window.location.origin}/api/telemetry`;

  const esp32Code = `/*
 * SmartVibe - ESP32 IoT Machine Health Monitoring Firmware
 * Sensors:
 *  - ADXL345 Accelerometer (I2C: SDA=GPIO 21, SCL=GPIO 22)
 *  - DS18B20 Digital Temperature (OneWire: DATA=GPIO 4 with 4.7k pullup)
 *  - MAX9814 Microphone Module (Analog OUT=GPIO 34 ADC)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// SmartVibe Server Telemetry Ingestion Endpoint
const char* serverUrl = "${endpointUrl}";

// Sensors Setup
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

#define MIC_PIN 34 // ADC1_CH6

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize ADXL345
  Wire.begin(21, 22);
  if (!accel.begin()) {
    Serial.println("Warning: ADXL345 not found on I2C!");
  } else {
    accel.setRange(ADXL345_RANGE_16_G);
  }

  // Initialize DS18B20
  tempSensors.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read ADXL345 Vibration
    sensors_event_t event;
    accel.getEvent(&event);
    float ax = event.acceleration.x;
    float ay = event.acceleration.y;
    float az = event.acceleration.z;
    float dyn = sqrt(ax * ax + ay * ay + pow(az - 9.81, 2));
    float rms = dyn * 0.707; // RMS estimate

    // 2. Read DS18B20 Temperature
    tempSensors.requestTemperatures();
    float tempC = tempSensors.getTempCByIndex(0);

    // 3. Read MAX9814 Microphone Envelope
    int minVal = 4095;
    int maxVal = 0;
    unsigned long startWindow = millis();
    while (millis() - startWindow < 50) { // 50ms peak-to-peak sample
      int sample = analogRead(MIC_PIN);
      if (sample < minVal) minVal = sample;
      if (sample > maxVal) maxVal = sample;
    }
    int peakToPeak = maxVal - minVal;
    float relativeNoise = (peakToPeak / 4095.0) * 100.0;

    // 4. Construct JSON Payload
    StaticJsonDocument<384> doc;
    doc["machine_id"] = "machine_01";
    doc["vibration_x"] = ax;
    doc["vibration_y"] = ay;
    doc["vibration_z"] = az;
    doc["vibration_rms"] = rms;
    doc["temperature"] = tempC;
    doc["noise_relative"] = relativeNoise;

    JsonObject hw = doc.createNestedObject("hardware_status");
    hw["adxl345"] = true;
    hw["ds18b20"] = (tempC > -55 && tempC < 125);
    hw["max9814"] = true;

    String jsonString;
    serializeJson(doc, jsonString);

    // 5. Send HTTP POST to SmartVibe
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      Serial.printf("Telemetry sent, code: %d\\n", httpResponseCode);
    } else {
      Serial.printf("POST error: %s\\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }

  delay(2000); // Sample rate: every 2 seconds
}`;

  const sampleCurl = `curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "machine_id": "machine_01",
    "vibration_x": 0.85,
    "vibration_y": 0.62,
    "vibration_z": 9.85,
    "vibration_rms": 2.15,
    "temperature": 43.8,
    "noise_relative": 54.0,
    "hardware_status": { "adxl345": true, "ds18b20": true, "max9814": true }
  }'`;

  const copyToClipboard = (text: string, type: 'code' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Hardware Wiring & ESP32 Integration Hub
              </h2>
              <p className="text-xs text-slate-400">
                Complete wiring schematics, pinout mapping, and Arduino firmware for college project demonstration
              </p>
            </div>
          </div>

          {/* Test Ingestion Button */}
          <button
            onClick={onSendTestPacket}
            disabled={isSendingPacket}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSendingPacket ? 'Transmitting Packet...' : 'Simulate ESP32 Live POST'}</span>
          </button>
        </div>
      </div>

      {/* Sensor Pinout Mapping Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          1. ESP32 Pinout & Sensor Interfacing Specification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ADXL345 */}
          <div className="rounded-lg bg-slate-950/70 p-4 border border-indigo-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-indigo-300">ADXL345 Accelerometer</span>
              <span className="text-[10px] font-mono text-slate-400">I2C Protocol</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">VCC / CS</span>
                <span className="text-white">3.3V (CS to 3V3)</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">GND</span>
                <span className="text-white">GND</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">SDA (Data)</span>
                <span className="text-indigo-400 font-bold">GPIO 21</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">SCL (Clock)</span>
                <span className="text-indigo-400 font-bold">GPIO 22</span>
              </li>
            </ul>
          </div>

          {/* DS18B20 */}
          <div className="rounded-lg bg-slate-950/70 p-4 border border-emerald-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-emerald-300">DS18B20 Temperature</span>
              <span className="text-[10px] font-mono text-slate-400">1-Wire Digital</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">VCC (Red)</span>
                <span className="text-white">3.3V / 5V</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">GND (Black)</span>
                <span className="text-white">GND</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">DATA (Yellow)</span>
                <span className="text-emerald-400 font-bold">GPIO 4</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Pull-Up</span>
                <span className="text-amber-400">4.7 kΩ (VCC-DATA)</span>
              </li>
            </ul>
          </div>

          {/* MAX9814 */}
          <div className="rounded-lg bg-slate-950/70 p-4 border border-cyan-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-cyan-300">MAX9814 Microphone</span>
              <span className="text-[10px] font-mono text-slate-400">Analog ADC</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">VDD</span>
                <span className="text-white">3.3V</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">GND</span>
                <span className="text-white">GND</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">OUT</span>
                <span className="text-cyan-400 font-bold">GPIO 34 (ADC1)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">GAIN</span>
                <span className="text-slate-300">Floating (60dB)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Firmware Code & Curl Ingestion */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              2. Complete ESP32 Arduino C++ Firmware (smartvibe_firmware.ino)
            </h3>
            <p className="text-xs text-slate-400">
              Includes WiFi connection, ADXL345 I2C sampling, DS18B20 1-wire readout, MAX9814 ADC peak envelope, and JSON HTTP POST
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(esp32Code, 'code')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="max-h-80 overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] text-slate-300 border border-slate-800">
          {esp32Code}
        </pre>
      </div>

      {/* cURL Test Terminal */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              3. Test Telemetry Endpoint via Terminal / cURL
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(sampleCurl, 'curl')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Execute this command in your command line or from Postman to push live telemetry into the SmartVibe dashboard:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 border border-slate-800">
          {sampleCurl}
        </pre>
      </div>

    </div>
  );
};
