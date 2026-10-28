# SmartVibe ⚡
### AI-Based IoT System for Machine Vibration Monitoring and Anomaly Detection

SmartVibe is an IoT and AI-based machine health monitoring project designed to monitor **vibration, temperature, and noise** to help identify unusual machine operating conditions.

The project combines sensor data collection, a responsive monitoring dashboard, historical trends, alerts, and an extensible anomaly-detection architecture. It is being developed as a cost-effective engineering project and prototype.

> **Project status:** In development. Hardware connectivity, cloud integration, anomaly-detection validation, and Android APK packaging should be considered complete only after they have been implemented and tested.

---

## ✨ Features

- **Vibration Monitoring:** Collect acceleration measurements using an ADXL345 accelerometer.
- **Temperature Monitoring:** Monitor temperature using a DS18B20 sensor.
- **Noise Monitoring:** Analyse relative microphone signal levels using a MAX9814 module.
- **Interactive Dashboard:** Display sensor cards, charts, historical readings, and machine status.
- **Anomaly Alerts:** Identify unusual readings using configurable rules.
- **AI Integration:** Architecture intended to support machine-learning-based anomaly detection.
- **Machine Health Reports:** Generate reports from available sensor data.
- **Responsive Design:** Access the web dashboard from desktop, tablet, or mobile browsers.
- **Demo Mode:** Demonstrate the interface with clearly labelled simulated data.
- **Android App:** Planned packaging of the existing dashboard into an Android APK using Capacitor.

## 🎯 Objectives

1. Develop a low-cost IoT system for machine condition monitoring.
2. Collect vibration, temperature, and noise-related measurements.
3. Visualise machine readings and trends through a dashboard.
4. Detect abnormal operating patterns using data-driven methods.
5. Generate understandable summaries and maintenance recommendations.
6. Provide a foundation for future real-time monitoring and mobile access.

## 🏗️ System Architecture

```text
Vibration Sensor (ADXL345)
Temperature Sensor (DS18B20)
Microphone Module (MAX9814)
             |
             v
       ESP32 DevKit V1
          Wi-Fi
             |
             v
     Backend / Cloud Storage
             |
             v
     SmartVibe Web Dashboard
             |
             v
  Anomaly Analysis and Reports
             |
             v
      Android App (Planned)
```

The architecture is a target design. Each connection must be implemented and tested before it can be considered operational.

## 🧰 Hardware Requirements

| Component | Purpose |
|---|---|
| ESP32 DevKit V1 | Sensor interface and Wi-Fi communication |
| ADXL345 accelerometer | Vibration and acceleration measurements |
| DS18B20 temperature sensor | Temperature measurements |
| MAX9814 microphone module | Relative sound signal acquisition |
| Breadboard | Prototype circuit assembly |
| Jumper wires | Sensor connections |
| USB data cable | Programming and powering the ESP32 |
| Resistors and mounting materials | Wiring and sensor installation |

**Estimated hardware budget:** ₹920–₹1,820, depending on supplier prices and components already available.

A separate Arduino Uno is not required. The ESP32 can be programmed using the Arduino IDE.

## 💻 Technology Stack

The intended or existing project stack may include:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js and Express
- **IoT:** ESP32, Wi-Fi, sensor interfaces
- **Data visualisation:** Interactive charts
- **Cloud storage:** Firebase Firestore or another configured service
- **AI / signal processing:** Python, NumPy, SciPy, scikit-learn
- **Android packaging:** Capacitor and Android Studio
- **Version control:** Git and GitHub

Refer to the actual project configuration files to determine which technologies and dependencies are currently installed.

## 📊 Sensor Measurements

### Vibration
The ADXL345 provides acceleration measurements. The application can calculate RMS acceleration, peak acceleration, and frequency-related features when suitable sampled data is available.

### Temperature
The DS18B20 provides temperature readings in degrees Celsius. Warning thresholds should be configured for the machine and operating conditions being monitored.

### Noise
The MAX9814 provides an amplified microphone signal. Relative signal levels and sound-pattern features can be analysed.

> **Measurement note:** The MAX9814 is not a calibrated sound-level meter. Do not report calibrated dB SPL without suitable calibration and a valid measurement method. Likewise, vibration acceleration in m/s² must not be presented as vibration velocity in mm/s.

## 🚀 Getting Started

### Prerequisites

Install the following tools as needed:

- [Node.js (LTS)](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Arduino IDE](https://www.arduino.cc/en/software)
- [Android Studio](https://developer.android.com/studio) — for Android development

### 1. Clone the repository

Replace the placeholder URL with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Check the backend's environment-variable requirements. If it uses a `.env` file, create one using the variable names documented by the project.

Never commit API keys, passwords, private credentials, or production secrets. Keep `.env` files out of version control and provide a sanitized `.env.example` when needed.

### 4. Run the application

Use the scripts defined in `package.json`. A typical Vite development command is:

```bash
npm run dev
```

If the project requires a separate Express backend, start it using the configured backend script as well.

### 5. Validate the production build

```bash
npm run build
```

If the project provides a TypeScript validation script, run that before building too.

**Note:** Exact commands may vary according to the current repository configuration.

## 📱 Android APK

The planned Android application will reuse the existing web dashboard through Capacitor.

The general build workflow is:

1. Install Node.js and Android Studio.
2. Install the project dependencies.
3. Build the web application.
4. Configure Capacitor and the Android platform.
5. Synchronise the web build with Android.
6. Open the Android project in Android Studio.
7. Build and test a debug APK.

Typical commands after Capacitor has been configured:

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio, use the **Build APK** option to generate a debug APK.

The expected debug APK path is usually:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The APK must be generated and tested before it can be distributed. Live monitoring also requires a reachable backend or correctly configured local-network connection.

## 🧪 Testing and Validation

Before presenting the project:

- [ ] Verify the production web build.
- [ ] Check all dashboard navigation and controls.
- [ ] Verify sensor readings against the actual hardware.
- [ ] Confirm that demo data is labelled.
- [ ] Test offline and backend-error states.
- [ ] Validate measurement units and thresholds.
- [ ] Check historical data and report generation.
- [ ] Test the Android APK on a physical phone.
- [ ] Verify that credentials are not exposed in frontend code.

## 🔮 Future Enhancements

- Validated machine-learning anomaly detection.
- Persistent cloud-based sensor history.
- Real-time notifications.
- Multiple machine monitoring.
- Improved signal processing and frequency analysis.
- Calibrated sound-level measurements where supported by suitable hardware.
- Signed Android release APK.
- Predictive maintenance based on validated datasets.

## ⚠️ Limitations

SmartVibe is a prototype and is not a certified industrial condition-monitoring or safety system. Sensor mounting, sampling rate, calibration, machine type, and data quality affect the reliability of measurements.

An anomaly is an indication that a reading or pattern differs from the expected baseline; it is not proof of a particular mechanical fault. Validate results before making maintenance or safety decisions.

## 👨‍💻 Project Information

**Project:** SmartVibe — AI-Based IoT System for Machine Vibration Monitoring and Anomaly Detection  
**Domain:** Internet of Things (IoT), Artificial Intelligence, Machine Condition Monitoring  
**Purpose:** Engineering semester project and prototype

## 📄 License

Add a license file before declaring a project license. If you choose the MIT License, include the complete license text and your intended copyright holder.

---

*SmartVibe aims to make machine-condition monitoring more accessible through affordable sensors, useful visualisation, and responsible anomaly analysis.*
