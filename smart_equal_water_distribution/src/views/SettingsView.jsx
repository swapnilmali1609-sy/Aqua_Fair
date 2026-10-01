import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Sliders, UserCheck, Copy, Check, Cloud, Radio, Home, Layers, ShieldCheck, CheckCircle2, Server, Send, Zap, Droplet, Database, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView({ user, simSpeed, setSimSpeed, system, onUpdateSystem }) {
  const [copied, setCopied] = useState(false);
  const [firmwareProtocol, setFirmwareProtocol] = useState('http');
  const [mqttConfig, setMqttConfig] = useState({
    broker: 'mqtt://aquafair-cloud.org',
    port: '1883',
    topic: 'aquafair/v1/telemetry/nodes'
  });
  const [toast, setToast] = useState('');

  // Central Storage Reservoir (ESR) Capacity Management State
  const [esrForm, setEsrForm] = useState({
    tank_capacity_liters: system?.tank_capacity_liters || 2500000,
    tank_level_liters: system?.tank_level_liters || 1950000,
    tank_name: system?.tank_name || 'AquaFair Municipal Storage Reservoir (ESR)'
  });
  const [isUpdatingEsr, setIsUpdatingEsr] = useState(false);

  // Synchronize ESR form whenever system state updates
  useEffect(() => {
    if (system?.tank_capacity_liters) {
      setEsrForm(prev => ({
        ...prev,
        tank_capacity_liters: system.tank_capacity_liters,
        tank_level_liters: system.tank_level_liters ?? prev.tank_level_liters,
        tank_name: system.tank_name || prev.tank_name
      }));
      setHwTestForm(prev => ({
        ...prev,
        tank_capacity_liters: system.tank_capacity_liters
      }));
    }
  }, [system?.tank_capacity_liters, system?.tank_level_liters, system?.tank_name]);

  // Hardware Test & Verification State
  const [hwTestForm, setHwTestForm] = useState({
    ward_name: 'Ward 5 - Hardware Sector',
    ward_number: 5,
    no_of_houses: 200,
    tank_capacity_liters: system?.tank_capacity_liters || 2500000,
    flow_rate: 18.5,
    delivered_increment_liters: 100
  });
  const [hwTestResult, setHwTestResult] = useState(null);
  const [isTransmittingHw, setIsTransmittingHw] = useState(false);

  const handleUpdateEsr = async (e) => {
    e?.preventDefault();
    setIsUpdatingEsr(true);
    const capacity = Number(esrForm.tank_capacity_liters) || 2500000;
    const level = Number(esrForm.tank_level_liters) || Math.round(capacity * 0.78);
    try {
      await api.controlSystem('update_tank', {
        tank_capacity_liters: capacity,
        tank_level_liters: level
      });
      if (onUpdateSystem) {
        onUpdateSystem({
          tank_capacity_liters: capacity,
          tank_level_liters: level
        });
      }
      try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (err) {}
      setToast(`Municipal ESR Reservoir capacity successfully set to ${capacity.toLocaleString()} Litres!`);
      setTimeout(() => setToast(''), 4500);
    } catch {
      setToast('Failed to update reservoir settings.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsUpdatingEsr(false);
    }
  };

  const handleTransmitTestTelemetry = async () => {
    setIsTransmittingHw(true);
    try {
      const res = await api.sendHardwareTelemetry({
        device_id: 'ESP32-AQUABALANCE-TEST-01',
        tank_capacity_liters: Number(hwTestForm.tank_capacity_liters) || 2500000,
        wards: [
          {
            ward_name: hwTestForm.ward_name,
            ward_number: Number(hwTestForm.ward_number) || 5,
            no_of_houses: Number(hwTestForm.no_of_houses) || 200,
            flow_rate: Number(hwTestForm.flow_rate) || 18.5,
            delivered_increment_liters: Number(hwTestForm.delivered_increment_liters) || 100,
            pressure_bar: 3.2
          }
        ]
      });
      setHwTestResult(res);
      setToast(`Telemetry transmitted! Operations isolated to ${hwTestForm.ward_name} (Ward #${hwTestForm.ward_number}). Previous wards set to Completed.`);
      setTimeout(() => setToast(''), 4500);
    } catch {
      setToast('Failed to transmit telemetry.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsTransmittingHw(false);
    }
  };

  const esp32HttpCode = `// AquaBalance – Smart Equal Water Distribution System
// ESP32 Direct HTTP REST Hardware-in-the-Loop (HIL) Firmware
// Automatically interacts with Django Backend: /api/hardware/telemetry/
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Library: ArduinoJson by Benoit Blanchon (v6 or v7)
#include <ESP32Servo.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
// Set to your computer / server IP running AquaBalance Django Backend:
const char* serverUrl = "http://192.168.1.100:8000/api/hardware/telemetry/";

// Pin Definitions
const int TRIG_PIN = 12;         // JSN-SR04T / HC-SR04 Ultrasonic Trigger
const int ECHO_PIN = 13;         // Ultrasonic Echo
const int FLOW_PIN_W1 = 4;       // YF-S201 Water Flow Sensor (Hall Pulse)
const int VALVE_PIN_W1 = 21;     // Motorized Sluice / Servo Valve (PWM)
const int RELAY_PUMP_PIN = 26;   // Main Intake & Distribution Pump Relay
const int PIN_PH = 34;           // Analog pH Probe (ADC1_CH6)

volatile unsigned long pulseCountW1 = 0;
Servo valveW1;

void IRAM_ATTR countPulse() { pulseCountW1++; }

float getTankDepthCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  if (dur == 0) return 80.0;
  return dur * 0.034 / 2.0; // Distance in cm
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(FLOW_PIN_W1, INPUT_PULLUP);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  digitalWrite(RELAY_PUMP_PIN, HIGH); // Default Pump Active

  attachInterrupt(digitalPinToInterrupt(FLOW_PIN_W1), countPulse, RISING);
  valveW1.attach(VALVE_PIN_W1);
  valveW1.write(90); // 90 deg = 100% open aperture

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi Connected! Backend Link: " + String(serverUrl));
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // 1. Calculate Real-Time Hydraulics
    // YF-S201 calibration: 7.5 pulses/sec = 1 L/min (450 pulses = 1 Liter)
    float flowRate = (pulseCountW1 / 7.5);
    float deliveredLiters = pulseCountW1 / 450.0;
    float tankDist = getTankDepthCm();
    // Map depth distance to 2,500,000 L (2.5 ML) reservoir capacity (liters)
    float tankLevelLiters = map(tankDist, 20, 200, 2400000, 525000);
    float phVal = (analogRead(PIN_PH) / 4095.0) * 14.0;

    // 2. Build Ingestion JSON Payload
    StaticJsonDocument<512> doc;
    doc["device_id"] = "ESP32-AQUABALANCE-NODE-01";
    doc["tank_capacity_liters"] = 2500000; // 2,500,000 L storage capacity
    doc["tank_level_liters"] = tankLevelLiters;
    doc["ph_level"] = phVal;
    
    // Target newly added ward for hardware testing (Operations isolate to this ward)
    JsonObject wNew = doc["wards"].createNestedObject();
    wNew["ward_number"] = 5; // New Ward
    wNew["ward_name"] = "Ward 5 - Hardware Sector";
    wNew["no_of_houses"] = 200; // Auto-computes 100,000 L target
    wNew["flow_rate"] = flowRate;
    wNew["delivered_liters"] = deliveredLiters;
    wNew["pressure_bar"] = 3.2;

    String requestBody;
    serializeJson(doc, requestBody);

    // 3. Transmit Telemetry to Django SCADA Core
    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode == 200) {
      String response = http.getString();
      StaticJsonDocument<512> respDoc;
      deserializeJson(respDoc, response);

      // 4. Actuator Cutoff & Valve Aperture Command
      int targetValve = respDoc["valves_command"][0]["target_valve_percent"];
      bool quotaFulfilled = respDoc["valves_command"][0]["quota_fulfilled"];
      
      if (quotaFulfilled || targetValve == 0) {
        valveW1.write(0); // Cut off valve completely (0 degrees)
        Serial.println("[QUOTA REACHED] Valve auto-closed to 0%. Target fulfilled.");
      } else {
        int servoAngle = map(targetValve, 0, 100, 0, 90);
        valveW1.write(servoAngle);
      }

      // 5. Main Pump Safety Relay (Dry-run / 20% Strategic Reserve)
      const char* pumpCmd = respDoc["pump_command"];
      if (strcmp(pumpCmd, "Stopped") == 0 || strcmp(pumpCmd, "Standby") == 0) {
        digitalWrite(RELAY_PUMP_PIN, LOW); // Cut off pump motor
        Serial.println("[SAFEGUARD ACTIVE] Pump Relay Tripped: " + String(pumpCmd));
      } else {
        digitalWrite(RELAY_PUMP_PIN, HIGH); // Keep pump energized
      }
    } else {
      Serial.printf("HTTP Error: %d\\n", httpResponseCode);
    }
    http.end();
  }
  delay(1500); // 1.5 second loop sampling
}`;


  const arduinoCode = `// AquaFair – Smart Water Monitoring, Quality & Equity System
// ESP32 Open-Source IoT RTU Firmware: Water Quality (pH, TDS, Turbidity), Flow Sensors & Sluice Valves
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

const char* ssid = "AQUAFAIR_IOT_AP";
const char* password = "SECURE_IOT_KEY";
const char* mqtt_server = "${mqttConfig.broker.replace('mqtt://', '')}";

WiFiClient espClient;
PubSubClient client(espClient);

// Multi-Parameter IoT Water Quality Sensors (Analog ADC Pins)
const int PIN_PH = 34;         // Analog pH Electrode (Range 0-14, Safe: 6.5-8.5)
const int PIN_TDS = 35;        // Analog Total Dissolved Solids (Safe: 50-300 ppm)
const int PIN_TURBIDITY = 32;  // Turbidity Optical Scattering (Safe: <5.0 NTU)

// High-precision Water Flow Sensors (Interrupt Pins for 4 Distribution Sectors)
const int FLOW_PINS[4] = {4, 5, 18, 19};
volatile unsigned long pulseCounts[4] = {0, 0, 0, 0};

// Motorized Sluice Valve Servos
Servo sluiceValves[4];
const int VALVE_PINS[4] = {21, 22, 23, 25};

// Ultrasonic Storage Tank Sensor Pins (HC-SR04 / JSN-SR04T)
const int TRIG_PIN = 12;
const int ECHO_PIN = 13;

void IRAM_ATTR countPulse0() { pulseCounts[0]++; }
void IRAM_ATTR countPulse1() { pulseCounts[1]++; }
void IRAM_ATTR countPulse2() { pulseCounts[2]++; }
void IRAM_ATTR countPulse3() { pulseCounts[3]++; }

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  
  client.setServer(mqtt_server, ${mqttConfig.port});

  // Attach flow interrupts & calibrate servos
  for(int i=0; i<4; i++) {
    attachInterrupt(digitalPinToInterrupt(FLOW_PINS[i]), 
      (i==0 ? countPulse0 : i==1 ? countPulse1 : i==2 ? countPulse2 : countPulse3), RISING);
    sluiceValves[i].attach(VALVE_PINS[i]);
    sluiceValves[i].write(90); // default open 90 deg
  }

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  analogReadResolution(12); // 12-bit ADC (0-4095)
}

float readTankLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2; // distance in cm
}

void loop() {
  if (!client.connected()) { reconnect(); }
  client.loop();

  // Transmit real-time telemetry to AquaFair Cloud every 1000ms
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 1000) {
    lastMsg = millis();
    float tankDist = readTankLevel();

    // 1. Read Multi-Parameter Water Quality
    float phVal = (analogRead(PIN_PH) / 4095.0) * 14.0;
    float tdsVal = (analogRead(PIN_TDS) / 4095.0) * 1000.0;
    float turbVal = (analogRead(PIN_TURBIDITY) / 4095.0) * 10.0;

    // 2. Early Contamination Detection & Emergency Shutoff Watchdog
    bool contamination = (phVal < 6.5 || phVal > 8.5 || tdsVal > 500.0 || turbVal > 5.0);
    if (contamination) {
      // Immediate Automated Failsafe: Isolate all 4 motorized sluice valves to 0%
      for(int i=0; i<4; i++) { sluiceValves[i].write(0); }
      Serial.println("[EMERGENCY] Contamination Detected! Valves Isolated.");
    }

    // 3. Publish JSON Telemetry to AquaFair Centralized Broker
    char payload[384];
    snprintf(payload, sizeof(payload), 
      "{\\"f1\\":%lu,\\"f2\\":%lu,\\"f3\\":%lu,\\"f4\\":%lu,"
      "\\"tank_depth_cm\\":%.1f,\\"ph\\":%.2f,\\"tds\\":%.1f,\\"turbidity\\":%.2f,"
      "\\"contamination\\":%s}",
      pulseCounts[0], pulseCounts[1], pulseCounts[2], pulseCounts[3],
      tankDist, phVal, tdsVal, turbVal, contamination ? "true" : "false");
    client.publish("${mqttConfig.topic}", payload);
  }
}`;

  const copyCode = () => {
    const codeToCopy = firmwareProtocol === 'http' ? esp32HttpCode : arduinoCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const saveSettings = (e) => {
    e.preventDefault();
    setToast('AquaBalance IoT Cloud Gateway settings updated.');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="view-container">
      <div className="analytics-header-bar">
        <div>
          <h3>System & Hardware Settings</h3>
          <p>Simulation parameters, cloud MQTT telemetry gateway, and edge hardware firmware</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Municipal Central Storage Reservoir (ESR) Capacity & Configuration */}
        <section className="panel-container esr-config-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <Droplet size={20} className="info-icon-teal" />
                Central Storage Reservoir (ESR) Capacity & Safeguards
              </h3>
              <p>Configure municipal elevated storage reservoir volume, baseline reserve, and safety floors</p>
            </div>
            <span style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '4px 12px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '12px'
            }}>
              Active Capacity: {(Number(system?.tank_capacity_liters) || 2500000).toLocaleString()} L ({(Math.round((Number(system?.tank_capacity_liters) || 2500000) / 1000)).toLocaleString()} kL)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total ESR Capacity</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {(Number(esrForm.tank_capacity_liters) || 2500000).toLocaleString()} <small style={{ fontSize: '12px', fontWeight: 600 }}>Liters</small>
              </div>
              <small style={{ fontSize: '11px', color: '#64748b' }}>{((Number(esrForm.tank_capacity_liters) || 2500000) / 1000000).toFixed(2)} ML (Mega Liters)</small>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current Reserve Level</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d9488', marginTop: '4px' }}>
                {(Number(esrForm.tank_level_liters) || 1950000).toLocaleString()} <small style={{ fontSize: '12px', fontWeight: 600 }}>Liters</small>
              </div>
              <small style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600 }}>
                {Math.round(((Number(esrForm.tank_level_liters) || 1950000) / Math.max(1, Number(esrForm.tank_capacity_liters) || 2500000)) * 100)}% Full
              </small>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>20% Strategic Reserve Floor</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                {Math.round((Number(esrForm.tank_capacity_liters) || 2500000) * 0.20).toLocaleString()} <small style={{ fontSize: '12px', fontWeight: 600 }}>Liters</small>
              </div>
              <small style={{ fontSize: '11px', color: '#b45309' }}>🛡️ Mandatory Protected Reserve (Cannot Empty)</small>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>12% Dry-Run Protection</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>
                {Math.round((Number(esrForm.tank_capacity_liters) || 2500000) * 0.12).toLocaleString()} <small style={{ fontSize: '12px', fontWeight: 600 }}>Liters</small>
              </div>
              <small style={{ fontSize: '11px', color: '#e11d48' }}>Pump Cavitation Motor Cutoff</small>
            </div>
          </div>

          <form onSubmit={handleUpdateEsr} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Storage Reservoir Capacity (Liters) *
                <input
                  type="number"
                  min="100000"
                  step="10000"
                  value={esrForm.tank_capacity_liters}
                  onChange={(e) => setEsrForm({ ...esrForm, tank_capacity_liters: e.target.value })}
                  style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                  required
                />
              </label>

              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Current Reservoir Water Level (Liters)
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={esrForm.tank_level_liters}
                  onChange={(e) => setEsrForm({ ...esrForm, tank_level_liters: e.target.value })}
                  style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEsrForm({
                    ...esrForm,
                    tank_capacity_liters: 2500000,
                    tank_level_liters: 1950000
                  })}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                  title="Set to 2,500,000 Litres (2.5 ML)"
                >
                  ⚡ Preset 2.5 ML
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingEsr}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{isUpdatingEsr ? 'Updating Reservoir...' : 'Save & Update ESR Capacity'}</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Simulation Speed Control */}
        <section className="panel-container">
          <div className="panel-header">
            <div>
              <h3>Simulation Engine Clock</h3>
              <p>Adjust telemetry polling interval and dynamic equity calculation rate</p>
            </div>
            <Sliders size={18} className="info-icon-teal" />
          </div>

          <div className="sim-speed-options">
            {[
              { label: 'Pause Simulation', value: 0 },
              { label: '1x (Normal)', value: 1000 },
              { label: '2x (Fast)', value: 500 },
              { label: '5x (Turbo)', value: 200 },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`speed-btn ${simSpeed === opt.value ? 'active' : ''}`}
                onClick={() => setSimSpeed(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="setting-help-text">
            Simulates dynamic water flow sensors, storage tank fluctuations, leak detection, and automated motorized valve trimming.
          </p>
        </section>

        {/* User Account & Deployment Scope */}
        <section className="panel-container">
          <div className="panel-header">
            <div>
              <h3>Active Session Profile</h3>
              <p>Current authenticated authority and deployment parameters</p>
            </div>
            <UserCheck size={18} className="info-icon-teal" />
          </div>

          <div className="profile-summary-box">
            <div className="profile-row">
              <span>Account Name</span>
              <strong>{user?.name || 'AquaFair Administrator'}</strong>
            </div>
            <div className="profile-row">
              <span>Deployment Tier</span>
              <strong>Homes, Apartments & Nagar Parishad Communities</strong>
            </div>
            <div className="profile-row">
              <span>Designated Role</span>
              <span className="badge-role">{user?.role || 'Municipal Officer'}</span>
            </div>
            <div className="profile-row">
              <span>Connection / Node ID</span>
              <strong>{user?.household_id || 'AF-OFFICER-01'}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* Cloud & IoT Connectivity Hub */}
      <section className="panel-container hardware-section">
        <div className="panel-header">
          <div>
            <h3>IoT Technologies & Cloud Connectivity Gateway</h3>
            <p>Connect physical water flow sensors, ultrasonic storage tank transmitters, and motorized valves via MQTT/REST</p>
          </div>
          <Cloud size={20} className="info-icon-teal" />
        </div>

        <form onSubmit={saveSettings} className="mqtt-form-row">
          <label>
            AquaFair Cloud MQTT Broker URI
            <input
              type="text"
              value={mqttConfig.broker}
              onChange={(e) => setMqttConfig({ ...mqttConfig, broker: e.target.value })}
            />
          </label>
          <label>
            Broker Port
            <input
              type="text"
              value={mqttConfig.port}
              onChange={(e) => setMqttConfig({ ...mqttConfig, port: e.target.value })}
            />
          </label>
          <label>
            Telemetry Topic Ingestion
            <input
              type="text"
              value={mqttConfig.topic}
              onChange={(e) => setMqttConfig({ ...mqttConfig, topic: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-save-settings">Save Cloud Config</button>
        </form>

        <div className="code-snippet-header">
          <div className="firmware-tab-pills">
            <button
              type="button"
              className={`firmware-tab-btn ${firmwareProtocol === 'http' ? 'active' : ''}`}
              onClick={() => setFirmwareProtocol('http')}
            >
              ⚡ Direct HTTP REST API (Recommended • Zero Broker Setup)
            </button>
            <button
              type="button"
              className={`firmware-tab-btn ${firmwareProtocol === 'mqtt' ? 'active' : ''}`}
              onClick={() => setFirmwareProtocol('mqtt')}
            >
              ☁️ MQTT Cloud Broker (PubSubClient)
            </button>
          </div>
          <button className="btn-copy-code" onClick={copyCode}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Firmware'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--slate-600)', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
          <strong style={{ color: 'var(--teal-700)' }}>Active Ingestion URL:</strong>
          <code>POST http://&lt;server-ip&gt;:8000/api/hardware/telemetry/</code>
          <span style={{ marginLeft: 'auto', color: 'var(--slate-500)' }}>Compatible with ESP32, Arduino, Raspberry Pi, GSM SIM800</span>
        </div>

        <pre className="code-snippet-block">
          <code>{firmwareProtocol === 'http' ? esp32HttpCode : arduinoCode}</code>
        </pre>

        {/* Interactive Hardware Telemetry Test Suite */}
        <div style={{
          marginTop: '18px',
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '10px',
          padding: '16px 18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} className="text-teal" />
                Live Hardware Node Test & Verification
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Simulate or verify physical ESP32 telemetry ingestion on a new ward. Operations isolate to this ward automatically.
              </p>
            </div>
            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
              2,500,000 L Reservoir Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Target Ward Name
              <input
                type="text"
                value={hwTestForm.ward_name}
                onChange={(e) => setHwTestForm({ ...hwTestForm, ward_name: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Ward Number
              <input
                type="number"
                value={hwTestForm.ward_number}
                onChange={(e) => setHwTestForm({ ...hwTestForm, ward_number: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              No. of Houses (Families)
              <input
                type="number"
                value={hwTestForm.no_of_houses}
                onChange={(e) => setHwTestForm({ ...hwTestForm, no_of_houses: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Tank Capacity (L)
              <input
                type="number"
                value={hwTestForm.tank_capacity_liters}
                onChange={(e) => setHwTestForm({ ...hwTestForm, tank_capacity_liters: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Live Flow Rate (L/min)
              <input
                type="number"
                step="0.1"
                value={hwTestForm.flow_rate}
                onChange={(e) => setHwTestForm({ ...hwTestForm, flow_rate: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Delivered Increment (L)
              <input
                type="number"
                value={hwTestForm.delivered_increment_liters}
                onChange={(e) => setHwTestForm({ ...hwTestForm, delivered_increment_liters: e.target.value })}
                style={{ width: '100%', marginTop: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: '#0369a1' }}>
              Calculated Target: <strong>{(Number(hwTestForm.no_of_houses || 200) * 500).toLocaleString()} L</strong> • Isolation: <strong>Previous Wards Standby</strong>
            </span>
            <button
              type="button"
              onClick={handleTransmitTestTelemetry}
              disabled={isTransmittingHw}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              <Send size={14} />
              <span>{isTransmittingHw ? 'Transmitting...' : 'Transmit Hardware Telemetry (Focus Operations)'}</span>
            </button>
          </div>

          {hwTestResult && (
            <div style={{ marginTop: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
              <strong style={{ color: '#065f46' }}>Hardware Node Telemetry Acknowledged:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '6px' }}>
                <div>ESR Capacity: <strong>{hwTestResult.tank_capacity_liters?.toLocaleString() || '2,500,000'} L</strong></div>
                <div>ESR Level: <strong>{hwTestResult.tank_level_liters?.toLocaleString()} L</strong></div>
                <div>Pump Command: <strong>{hwTestResult.pump_command}</strong></div>
                <div>Active Ward: <strong>Ward #{hwTestResult.valves_command?.[0]?.ward_number || hwTestForm.ward_number}</strong></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Edge Hardware Architecture & Bill of Materials */}
      <section className="panel-container open-source-section">
        <div className="panel-header">
          <div>
            <h3>Hardware Architecture & Bill of Materials (BOM)</h3>
            <p>Edge IoT sensors, actuators, and open-source software stack specifications</p>
          </div>
          <Layers size={20} className="info-icon-teal" />
        </div>

        <div className="bom-grid">
          <div className="bom-card">
            <div className="bom-header">
              <Cpu size={18} className="text-teal" />
              <strong>Edge Microcontroller Node</strong>
            </div>
            <div className="bom-spec">
              <span>Hardware</span>
              <strong>ESP32 NodeMCU-32S (Dual-Core 240MHz, Wi-Fi/BLE)</strong>
            </div>
            <div className="bom-spec">
              <span>Role</span>
              <p>Real-time edge ADC sampling, flow interrupt counting, servo actuation, and automated failsafe shutoff</p>
            </div>
            <div className="bom-cost">
              <span>Unit Cost</span>
              <strong className="text-emerald">~$4.50 USD (₹380 INR)</strong>
            </div>
          </div>

          <div className="bom-card">
            <div className="bom-header">
              <ShieldCheck size={18} className="text-cyan" />
              <strong>Multi-Parameter Water Quality Sensors</strong>
            </div>
            <div className="bom-spec">
              <span>Hardware</span>
              <strong>Analog pH Probe (E-201-C), Analog TDS Module & Turbidity Optical Sensor</strong>
            </div>
            <div className="bom-spec">
              <span>Role</span>
              <p>Continuous monitoring of pH (6.5–8.5), TDS (&le;300 ppm), Turbidity (&le;5 NTU), early contamination detection</p>
            </div>
            <div className="bom-cost">
              <span>Unit Cost</span>
              <strong className="text-emerald">~$22.00 USD (₹1,850 INR)</strong>
            </div>
          </div>

          <div className="bom-card">
            <div className="bom-header">
              <Radio size={18} className="text-amber" />
              <strong>Ultrasonic Storage Tank Transmitter</strong>
            </div>
            <div className="bom-spec">
              <span>Hardware</span>
              <strong>JSN-SR04T Waterproof Ultrasonic Transducer (20–600 cm range)</strong>
            </div>
            <div className="bom-spec">
              <span>Role</span>
              <p>Continuous reservoir level tracking, overflow prevention (&gt;95%), dry-run pump cutoff (&le;12%)</p>
            </div>
            <div className="bom-cost">
              <span>Unit Cost</span>
              <strong className="text-emerald">~$4.00 USD (₹330 INR)</strong>
            </div>
          </div>

          <div className="bom-card">
            <div className="bom-header">
              <Server size={18} className="text-teal" />
              <strong>Open-Source Software & Cloud Stack</strong>
            </div>
            <div className="bom-spec">
              <span>Frameworks</span>
              <strong>Django REST (Python 3), React 18, Vite, Chart.js, Eclipse Mosquitto MQTT</strong>
            </div>
            <div className="bom-spec">
              <span>Role</span>
              <p>Dynamic equity distribution engine, centralized dashboard, anomaly watchdog, zero recurring license fees</p>
            </div>
            <div className="bom-cost">
              <span>License</span>
              <strong className="text-emerald">$0 (100% Free & Open-Source)</strong>
            </div>
          </div>
        </div>
      </section>

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}
