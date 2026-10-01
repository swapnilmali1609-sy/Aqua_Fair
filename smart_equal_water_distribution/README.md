# AquaFair — Smart Water Monitoring and Equity System

**AquaFair** is an intelligent water management and equal distribution solution designed to monitor water usage, ensure fair equitable distribution across households, and eliminate water wastage from pipeline leaks, abnormal booster suction, and storage reservoir overflow.

The platform integrates real-time telemetry from IoT pulse flow transmitters (YF-S201), ultrasonic tank level sensors, motorized sluice valves, and multi-parameter water quality sensors (pH, TDS, Turbidity, Chlorine), offering an end-to-end municipal SCADA console for Nagar Parishad authorities alongside an interactive smart-meter portal for citizen households.

**Keywords**: *Smart Water Management, IoT, Water Monitoring, Water Flow Sensors, Real-Time Monitoring, Water Distribution, Water Conservation, Leak Detection, Cloud Connectivity, Data Visualization.*

---

## 🌟 The 9 Foundational Pillars of AquaFair

AquaFair provides complete operational visibility and automated protection through 9 core capabilities:

### 1. Real-Time Water Monitoring
- Continuously monitors water levels and flow rates across the central 5,00,000 L (500 kL) Elevated Storage Reservoir (ESR) and community feeders.
- Real-time pulse flow sensors calculate flow velocity ($L/\min$) and cumulative delivery.
- Multi-parameter potable quality verification: Residual Chlorine 0.8 ppm, Turbidity 1.2 NTU, pH 7.4, and TDS 185 ppm.

### 2. Leakage, Overflow & Dry-Run Protection
- **Continuous Differential Line Analysis**: Identifies pinhole leaks and pipeline bursts before loss escalates.
- **Storage Tank Overflow Prevention Guard**: Automated high-level cutoff disengages intake pumps when reservoir reaches $\ge 95\%$ capacity.
- **Pump Dry-Run Protection**: Automated cutoff trips pumps when reservoir level drops below $\le 12\%$ to eliminate cavitation motor burnout.

### 3. Equitable Water Allocation Engine
- Dynamically modulates motorized sluice valves ($35\% - 100\%$) based on elevation head loss and real-time consumption.
- Prevents upstream lowland households from monopolizing supply, ensuring tail-end sectors receive their fair share.
- Maintains a municipal **Water Equity Fairness Index of 99.3%** across 1,010 connected homes.

### 4. Automated Alerts & Anomaly Watchdog
- Instant multi-channel notifications for both municipal administrators and citizens:
  - **Early Water Contamination Detection**: Flags pH and TDS breaches and triggers emergency automated valve isolation.
  - **Abnormal Suction / Surge**: Detects rapid draws ($>22\text{ L}/\min$) caused by unauthorized 1 HP booster suction motors.
  - **Pipe Leaks & Line Bursts**: Detected via telemetry pressure drops.
  - **Low Water Levels & Shift Completion**: Automated milestone broadcasts.

### 5. Extra Water Demand Requests & Municipal Authorizations
- Citizens can submit formal requests for additional water allocation (e.g. wedding ceremonies, religious festivals, sump refills).
- Municipal officers review, approve, or reject applications with one click, with extra water automatically added to the household's daily quota.

### 6. Municipal Grievance Desk & Field Technician Dispatch
- Citizens report street leaks, low pressure, or valve malfunctions with photos and descriptions, generating real municipal tickets (e.g. `AF-GRV-101`).
- Municipal engineers dispatch repair crews with estimated arrival times (ETA), monitor work in progress, and record formal resolution notes upon completion.
- Citizens track ticket progress in real-time from their portal.

### 7. Emergency Municipal Water Tanker Fleet
- Integrated tanker logistics system for drought relief, high-altitude ridge compensation, and pipeline maintenance shutdowns.
- Tracks tanker vehicle numbers, driver contacts, water capacity ($5,000\text{ L} - 10,000\text{ L}$), destination wards, and transit status.

### 8. Data Analytics, Audit & Non-Revenue Water (NRW) Reporting
- **7-Day Consumption Trends**: Daily water delivered vs target quota visualization.
- **Wastage Prevention Metrics**: Liters saved through overflow prevention, leak isolation, and equitable rationing ($93,400+\text{ L}$ conserved).
- **One-Click Audit Export**: Generates and downloads standard `.CSV` municipal compliance logs.
- **Nagar Parishad Bulk Sync**: Import and export official municipal tax and consumer ledgers.

### 9. Citizen & Household Remote Monitoring Portal
- Live household smart meter flow rate and pressure monitoring.
- Daily consumption progress vs 135 L/person standard CPHEEO quota.
- Domestic leak sentinel and anti-suction pump check status.
- One-click perspective switcher in the topbar (`[🏛️ Municipal Admin] ⇄ [🏡 Household Resident]`).

---

## 🏘️ Community Sector & Ward Grid

| Sector | Community Name | Connected Homes | Target Allocation | Sluice Aperture | Elevation Head Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ward 1** | Shivaji Nagar | 250 Homes | 1,25,000 L (125 kL) | Motorized Sluice 1 (88-92% Trimmed) | Lowland (High Natural Pressure) |
| **Ward 2** | Gandhi Ward | 280 Homes | 1,40,000 L (140 kL) | Motorized Sluice 2 (Auto Shutoff at 100%) | Standard Elevation |
| **Ward 3** | Subhash Nagar | 220 Homes | 1,10,000 L (110 kL) | Motorized Sluice 3 (96% Boosted Opening) | High-Altitude Ridge (+18m Head) |
| **Ward 4** | Ambedkar Ward | 260 Homes | 1,30,000 L (130 kL) | Motorized Sluice 4 (100% Full Bore) | Tail-End Distribution Sector |

---

## ⚡ Interactive Anomaly Simulator

The topbar includes a live **Anomaly Simulator** for instant evaluation and demonstration:
- **Simulate Pipe Leak**: Differential pressure drop in Ward 3 with critical leak alerts.
- **Simulate Tank Overflow (&ge;95%)**: Fills reservoir to 97% and triggers automated intake pump cutoff.
- **Simulate Low Water Level (&le;20%)**: Depletes reservoir to 19% and triggers low-water reserve warning.
- **Simulate Booster Suction / Surge**: Injects high draw ($26.8\text{ L}/\min$) to demonstrate anti-suction detection.
- **Simulate Contamination**: Flags chemical breach (pH 5.4, TDS 680) and executes emergency valve isolation.
- **Reset to Nominal Equilibrium**: Restores all sectors and storage tanks to balanced operating parameters.

---

## 🚀 Quick Start Guide

### 1-Click Launch (Windows)
Double-click **`start_aquafair.bat`** in the project root. This automatically starts both the Django REST backend (`http://127.0.0.1:8000`) and the Vite React frontend (`http://localhost:5173`).

---

### Manual Launch

#### 1. Backend (Django REST Framework)
From the project root:
```powershell
cd smart_equal_water_distribution\backend
& "..\..\.venv\Scripts\python.exe" manage.py migrate
& "..\..\.venv\Scripts\python.exe" manage.py seed_data
& "..\..\.venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
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

## 🔑 Demo Credentials

| Role | Username / ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Municipal Officer** | `samru` (or `swapnilmali1613@gmail.com`) | `samru123` | Full SCADA Console, Valve Trimming, Demands Approval, Grievance Dispatch, Tanker Fleet |
| **Citizen / Household** | `AF-W1-1042` | `123456` | Household Smart Meter, Daily Quota, Demand Request, Leak Grievances |

*(You can also use the one-click demo buttons on the sign-in screen or the topbar perspective switcher to toggle instantly between Officer and Citizen views).*

---

## 🧪 Running Automated Unit & Integration Tests

To run the complete Django test suite:
```powershell
cd smart_equal_water_distribution\backend
& "..\..\.venv\Scripts\python.exe" manage.py test
```
**Test Results**: 11 passed (100% pass rate) covering system state, simulation ticks, CPHEEO quota calculations, overflow cutoff, dry-run protection, contamination emergency isolation, demands approval, grievance dispatch, tanker logistics, and Nagar Parishad data ingestion.
