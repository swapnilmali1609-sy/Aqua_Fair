# 📡 AquaFair ESP32 Hardware-in-the-Loop (HIL) Firmware

This folder contains the complete, battle-tested Arduino C++ firmware for the **ESP32 Dev Module (WROOM-32 / NodeMCU-32S)** to link physical sensors and motorized actuators to the AquaFair SCADA platform in real time.

---

## 🔌 Hardware Pin Mapping & Circuit Wiring

| Hardware Sensor / Actuator | ESP32 GPIO Pin | Physical Connection | Description |
| :--- | :--- | :--- | :--- |
| **Ultrasonic Trigger** (JSN-SR04T / HC-SR04) | **GPIO 12** | Digital Output | Sends 10µs pulse to start measurement |
| **Ultrasonic Echo** (JSN-SR04T / HC-SR04) | **GPIO 13** | Digital Input | Measures echo travel time (5V $\rightarrow$ 3.3V divider recommended) |
| **Pulse Flow Meter** (YF-S201) | **GPIO 4** | Digital Input (Interrupt) | Counts Hall-effect pulse interrupts (450 pulses = 1 Liter) |
| **Motorized Sluice Valve** (Servo PWM) | **GPIO 21** | PWM Output (Timer 0) | Modulates valve aperture from $0^\circ$ (Closed) to $90^\circ$ (Full Flow) |
| **Intake Pump Relay Module** | **GPIO 26** | Digital Output | Active control of 5V pump relay with safety dry-run cutoff |
| **Analog pH Sensor Probe** | **GPIO 34** | ADC1 Channel 6 | Measures water pH (6.5 – 8.5 optimal range) |
| **Analog TDS Meter Sensor** | **GPIO 35** | ADC1 Channel 7 | Measures dissolved solids (50 – 300 ppm optimal range) |
| **Analog Turbidity Sensor** | **GPIO 32** | ADC1 Channel 4 | Optical NTU turbidity detection (< 5.0 NTU optimal) |
| **Status Heartbeat LED** | **GPIO 2** | Built-in LED | Blinks during connection; solid ON when connected |

---

## 🛠️ Arduino IDE Setup Guide

### 1. Board Installation
1. Open **Arduino IDE** (v2.x recommended).
2. Go to **File $\rightarrow$ Preferences**.
3. In **Additional boards manager URLs**, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools $\rightarrow$ Board $\rightarrow$ Boards Manager**, search for `esp32` by Espressif Systems, and click **Install**.
5. Select **Tools $\rightarrow$ Board $\rightarrow$ ESP32 Arduino $\rightarrow$ ESP32 Dev Module**.

### 2. Required Libraries
Open **Tools $\rightarrow$ Manage Libraries** (Ctrl+Shift+I) and install:
1. **`ArduinoJson`** (by *Benoit Blanchon*) — Version 6.x or 7.x
2. **`ESP32Servo`** (by *Kevin Harrington*) — Latest version

*(Built-in ESP32 core libraries `WiFi.h` and `HTTPClient.h` are included automatically).*

---

## ⚙️ Configuration in `esp32_aquafair_node.ino`

Before flashing, update these lines in [`esp32_aquafair_node.ino`](file:///c:/Users/samru/OneDrive/Desktop/AquaBalance_Smart_Equal_Water_Distribution/firmware/esp32_aquafair_node.ino):

```cpp
// 1. Your Wi-Fi Credentials:
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Your Computer's Local IP Address:
// Open terminal/cmd, run 'ipconfig', find your IPv4 address (e.g. 192.168.1.105):
const char* SERVER_URL    = "http://192.168.1.105:8000/api/hardware/telemetry/";

// 3. (Optional) If deploying with Vercel or cloud backend:
// const char* SERVER_URL = "https://your-cloud-domain.com/api/hardware/telemetry/";
```

---

## 🚀 How to Flash the ESP32

1. Connect the ESP32 to your computer using a standard Micro-USB or USB-C cable.
2. In Arduino IDE:
   - Select the COM Port under **Tools $\rightarrow$ Port** (e.g., `COM3`, `COM4`).
   - Set **Upload Speed**: `921600` (or `115200` if flashing fails).
3. Click the **Upload** button (arrow icon).
4. If your ESP32 board requires it, hold down the **BOOT** button on the ESP32 board for 2 seconds when you see `Connecting.......` in the console until the upload begins.
5. Open **Tools $\rightarrow$ Serial Monitor** at **`115200 baud`** to see real-time hydraulic telemetry and bidirectional actuator commands from the server!
