# AquaFair — Smart Equal Water Distribution & Monitoring System

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fswapnilmali1609-sy%2FAqua_Fair)
[![GitHub Repository](https://img.shields.io/badge/GitHub-swapnilmali1609--sy%2FAqua__Fair-blue?logo=github)](https://github.com/swapnilmali1609-sy/Aqua_Fair)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-cyan.svg)](https://vitejs.dev/)
[![Backend: Django REST](https://img.shields.io/badge/Backend-Django%20REST%20Framework-green.svg)](https://www.django-rest-framework.org/)
[![Hardware: ESP32 HIL](https://img.shields.io/badge/Hardware-ESP32%20IoT%20HIL-orange.svg)](https://www.espressif.com/en/products/socs/esp32)

**AquaFair** is an intelligent IoT-enabled municipal water distribution and SCADA management platform designed to monitor pipeline hydraulics in real time, guarantee equitable water allocation across all connected households, and automatically eliminate water loss from pipeline bursts, illegal booster suction, and storage reservoir overflow.

The system integrates real-time telemetry from IoT pulse flow transmitters (YF-S201), ultrasonic tank depth sensors (JSN-SR04T), motorized sluice valves, and multi-parameter potable water quality probes (pH, TDS, Turbidity, Chlorine), offering an end-to-end command console for Municipal Officers, dedicated portals for Tanker Drivers and Field Repair Squads, and an interactive smart meter for citizen residents.

---

## 🌟 Foundational Capabilities

### 1. Real-Time SCADA Operations Console
- Continuous IoT telemetry tracking water volume across the central 2,500,000 L (2.5 ML) Municipal Storage Reservoir (ESR).
- Real-time pulse flow sensors calculate flow velocity ($L/\min$) and cumulative delivery per sector.
- Potable water quality verification: Residual Chlorine 0.8 ppm, Turbidity 1.2 NTU, pH 7.4, and TDS 185 ppm.

### 2. Leakage, Overflow & Dry-Run Protection
- **Continuous Differential Line Analysis**: Identifies pinhole leaks and pipe bursts before loss escalates.
- **Storage Reservoir Overflow Guard**: Automated high-level cutoff disengages intake pumps when reservoir reaches $\ge 95\%$ capacity.
- **Pump Dry-Run Protection**: Automated cutoff trips pumps when reservoir level drops below $\le 12\%$ to eliminate motor burnout.
- **20% Strategic Reserve Guard**: Guarantees emergency reserve for critical firefighting and hospital demands.

### 3. Equitable Water Allocation Engine
- Dynamically modulates motorized sluice valves ($35\% - 100\%$) based on elevation head loss and real-time consumption.
- Prevents upstream lowland households from monopolizing supply, ensuring tail-end sectors receive their fair quota.
- Maintains a municipal **Water Equity Fairness Index of >99%** across connected homes.

### 4. Automated Contamination Sentinel & Anomaly Watchdog
- Instant automated protection:
  - **Contamination Fault Isolation**: Flags pH (<6.5 or >8.5) and Turbidity (>5 NTU) breaches, commanding all motorized sluice valves to 0% to prevent contaminated supply from reaching citizen taps.
  - **Booster Suction Detection**: Identifies rapid surge draws ($>22\text{ L}/\min$) caused by illegal 1 HP suction pumps.
  - **Line Pressure Drop**: Real-time watchdog identifies mainline pipe ruptures.

### 5. Multi-Role Consoles & Authority Separation
- **Municipal Officer**: Executive SCADA console, valve aperture trim, water demand approvals, crew dispatches, and emergency tanker scheduling.
- **Dispatch Team Leader & Field Crew**: On-site incident management, pipeline repairs, hydrant operations, and ticket closure.
- **Tanker Driver Cockpit**: Mobile delivery routing, sump replenishment, and digital arrival confirmation.
- **Citizen Resident**: Personal smart meter telemetry, daily quota tracking (135 L/person CPHEEO standard), extra quota requests, and complaint filing.

### 6. Emergency Municipal Water Tanker Fleet
- Integrated logistics system for deficit compensation and emergency pipeline repairs.
- Tracks fleet tanker vehicles, driver contacts, volume capacity (5,000 L – 10,000 L), ward destinations, and live transit telemetry.

---

## 🏘️ Community Sector & Ward Grid

| Sector | Community Name | Connected Homes | Target Allocation | Sluice Aperture | Elevation Head Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ward 1** | Shivaji Nagar | 250 Homes | 125,000 L (125 kL) | Motorized Sluice 1 (88-92% Trimmed) | Lowland (High Natural Head) |
| **Ward 2** | Gandhi Ward | 280 Homes | 140,000 L (140 kL) | Motorized Sluice 2 (Auto Shutoff at 100%) | Standard Elevation |
| **Ward 3** | Subhash Nagar | 220 Homes | 110,000 L (110 kL) | Motorized Sluice 3 (96% Boosted Opening) | High-Altitude Ridge (+18m Head) |
| **Ward 4** | Ambedkar Ward | 260 Homes | 130,000 L (130 kL) | Motorized Sluice 4 (100% Full Bore) | Tail-End Distribution Sector |

---

## 🔌 Hardware-in-the-Loop (HIL) Integration

AquaFair includes native bidirectional IoT integration for microcontrollers (ESP32, ESP8266, Arduino, Raspberry Pi):

- **Ingestion Endpoint**: `POST /api/hardware/telemetry/`
- **Firmware Template**: Available directly in the **System Settings** tab ([SettingsView.jsx](file:///c:/Users/samru/OneDrive/Desktop/AquaBalance_Smart_Equal_Water_Distribution/smart_equal_water_distribution/src/views/SettingsView.jsx)).
- **Sensor Support**:
  - JSN-SR04T / HC-SR04 Ultrasonic Level Sensor
  - YF-S201 Hall-Effect Flow Pulse Sensor
  - Analog pH Probe & Analog TDS Module
  - SG90 / MG996R Motorized Sluice Servo Actuators
  - 5V Relay Intake Pump Control

---

## 🚀 Quick Start Guide

### 1-Click Launch (Windows)
Double-click **`start_aquafair.bat`** in the project root to launch both the Django backend and Vite frontend automatically.

---

### Manual Launch

#### 1. Backend (Django REST Framework)
```powershell
cd smart_equal_water_distribution\backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_data
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend (React 18 + Vite)
In a separate terminal:
```powershell
cd smart_equal_water_distribution
npm install
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

---

## 🚀 Live Cloud Deployment on Vercel

AquaFair is configured for zero-configuration continuous deployment on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fswapnilmali1609-sy%2FAqua_Fair)

### Instant 1-Click Deployment
1. Click the **Deploy with Vercel** button above or navigate to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import **`swapnilmali1609-sy/Aqua_Fair`**.
3. Vercel automatically detects the preconfigured `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `smart_equal_water_distribution/dist`
4. Click **Deploy**. The app will build and go live at `https://aqua-fair.vercel.app` (or your assigned Vercel URL) in under 60 seconds!

> **Note on Standalone Mode**: On Vercel, all interactive dashboards (SCADA valve triggers, tanker fleet tracking, citizen meters, grievance dispatches, and emergency shutdowns) run seamlessly with intelligent client-side simulation. If you also deploy the Django REST backend (e.g. on Render, Fly.io, or AWS), simply add the environment variable `VITE_API_BASE=https://your-backend.com/api` in your Vercel Project Settings!

---

## 🔑 Demo Access Credentials

| Role | Username / ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Municipal Officer** | `samru` (or `swapnilmali1613@gmail.com`) | `samru123` | Executive SCADA Control, Valve Trimming, Demands Approval, Dispatches |
| **Dispatch Team Leader** | `suresh_leader` | `leader123` | Field Squad & Pipeline Repairs, Hydrant Closure |
| **Tanker Driver** | `suresh_driver` | `driver123` | Vehicle Fleet Delivery Cockpit, Sump Refills |
| **Citizen Resident** | `Ramesh Patil` (or `AF-W1-1042`) | `123456` | Smart Meter Quota, Demand Requests, Grievance Reports |

---

## 🧪 Automated Test Suite

Run full backend unit tests:
```powershell
cd smart_equal_water_distribution\backend
.\venv\Scripts\python.exe manage.py test accounts
```

Run end-to-end integration tests:
```powershell
.\venv\Scripts\python.exe test_e2e_flow.py
.\venv\Scripts\python.exe test_hardware_integration.py
```

---

## 📄 License
This project is open-source under the MIT License.
