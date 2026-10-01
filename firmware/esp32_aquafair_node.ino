/*
 =====================================================================================
  AquaFair / AquaBalance – Smart Equal Water Distribution & SCADA Management System
  ESP32 Hardware-in-the-Loop (HIL) Remote Terminal Unit (RTU) Firmware
 =====================================================================================
  
  Target Microcontroller: ESP32 Dev Module (WROOM-32 / NodeMCU-32S)
  Core Architecture: Dual-Core Tensilica Xtensa LX6 @ 240 MHz
  Communication: 2.4 GHz 802.11 b/g/n Wi-Fi Direct HTTP REST
  
  Supported Hardware Components:
  -----------------------------------------------------------------------------------
  1. Ultrasonic Tank Sensor : JSN-SR04T (Waterproof) or HC-SR04
     - TRIG Pin -> GPIO 12
     - ECHO Pin -> GPIO 13
  2. Pulse Flow Meter       : YF-S201 Hall-Effect Sensor (1-30 L/min, 450 pulses/L)
     - SIGNAL Pin -> GPIO 4 (Hardware Interrupt)
  3. Motorized Sluice Valve : Servo (MG996R / SG90) or Motorized Ball Valve
     - PWM Signal -> GPIO 21
  4. Pump Safety Relay      : 5V 10A Relay Module (Active HIGH / LOW configurable)
     - RELAY Pin  -> GPIO 26
  5. Water Quality Sensors  :
     - Analog pH Probe        -> GPIO 34 (ADC1_CH6)
     - Analog TDS Sensor      -> GPIO 35 (ADC1_CH7)
     - Analog Turbidity Probe -> GPIO 32 (ADC1_CH4)
  6. Heartbeat Status LED   : Onboard LED -> GPIO 2
 =====================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>   // Library: "ArduinoJson" by Benoit Blanchon (v6 or v7)
#include <ESP32Servo.h>    // Library: "ESP32Servo" by Kevin Harrington

// ======================== 1. NETWORK CONFIGURATION ======================== //
// Replace with your local Wi-Fi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Endpoint:
// Set to your computer's local Wi-Fi IPv4 address (run 'ipconfig' in cmd)
// Example: "http://192.168.1.105:8000/api/hardware/telemetry/"
// If using deployed cloud backend, replace with: "https://your-domain.com/api/hardware/telemetry/"
const char* SERVER_URL = "http://192.168.1.100:8000/api/hardware/telemetry/";

// Device Identification & Ward Sector Assignment
const char* DEVICE_ID = "ESP32-AQUABALANCE-NODE-01";
const int   WARD_NUMBER = 1;                              // Municipal Ward monitored by this node
const char* WARD_NAME   = "Ward 1 - Shivaji Nagar";
const int   NO_OF_HOUSES = 250;                           // Connected residential connections

// ======================== 2. GPIO PIN DEFINITIONS ======================== //
const int PIN_TRIG        = 12;  // Ultrasonic Sensor Trigger Pin
const int PIN_ECHO        = 13;  // Ultrasonic Sensor Echo Pin
const int PIN_FLOW_SENSOR = 4;   // YF-S201 Flow Sensor Pulse Signal Pin (Interrupt)
const int PIN_SERVO_VALVE = 21;  // Sluice Valve Servo PWM Control Pin
const int PIN_PUMP_RELAY  = 26;  // Intake & Distribution Pump Relay Pin
const int PIN_PH_SENSOR   = 34;  // Analog pH Probe (0 - 14 pH)
const int PIN_TDS_SENSOR  = 35;  // Analog TDS Meter (ppm)
const int PIN_TURBIDITY   = 32;  // Optical Turbidity Sensor (NTU)
const int PIN_LED_STATUS  = 2;   // Onboard Blue Status LED

// ======================== 3. HYDRAULIC CALIBRATION CONSTANTS ============= //
// Tank Geometry (Cylindrical or Rectangular Reservoir):
// Set empty distance (sensor to tank floor) and full distance (sensor to max water level)
const float TANK_HEIGHT_CM      = 200.0;   // Height from sensor to tank bottom (cm)
const float TANK_FULL_OFFSET_CM = 20.0;    // Minimum distance when tank is 100% full (cm)
const float TANK_CAPACITY_MAX_L = 2500000; // 2.5 ML Municipal Elevated Storage Reservoir (ESR)

// YF-S201 Flow Sensor Calibration:
// Manufacturer standard: 7.5 pulses per second = 1 L/min.
// Exactly 450 pulses represent 1.000 liter of water passage.
const float FLOW_CALIBRATION_FACTOR = 7.5; 
const float PULSES_PER_LITER        = 450.0;

// Relay Active State (Set to LOW if using Active-LOW relay module, HIGH for Active-HIGH)
const int RELAY_ON  = HIGH;
const int RELAY_OFF = LOW;

// ======================== 4. GLOBAL OPERATIONAL STATE ===================== //
volatile unsigned long pulseCount = 0;
unsigned long lastPulseTime       = 0;
unsigned long lastTelemetryMillis = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 2000; // Transmit telemetry every 2 seconds

float totalDeliveredLiters = 0.0;
float currentFlowRateLPM   = 0.0;
int   currentValvePercent  = 90;

Servo sluiceValve;

// ======================== 5. INTERRUPT SERVICE ROUTINE ==================== //
void IRAM_ATTR onFlowSensorPulse() {
  pulseCount++;
}

// ======================== 6. SENSOR MEASUREMENT HELPERS =================== //

// Measure distance in centimeters using Ultrasonic Sensor
float readTankDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // 30ms timeout (covers up to ~5 meters)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) {
    // Sensor out of range or reflection lost
    return -1.0;
  }
  // Speed of sound = 343 m/s = 0.0343 cm/microsecond
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

// Calculate remaining reservoir volume in liters based on ultrasonic distance
float calculateReservoirVolumeLiters() {
  float distCm = readTankDistanceCm();
  if (distCm < 0) {
    // Return nominal storage if sensor reading timed out
    return 1950000.0;
  }

  // Constrain distance within physical tank range
  distCm = constrain(distCm, TANK_FULL_OFFSET_CM, TANK_HEIGHT_CM);

  // Invert distance: closer distance = higher water level
  float waterDepthCm = TANK_HEIGHT_CM - distCm;
  float usableHeightCm = TANK_HEIGHT_CM - TANK_FULL_OFFSET_CM;
  float fillFraction = waterDepthCm / usableHeightCm;
  fillFraction = constrain(fillFraction, 0.0, 1.0);

  return fillFraction * TANK_CAPACITY_MAX_L;
}

// Read and calibrate Analog pH Probe
float readPHLevel() {
  int rawAdc = analogRead(PIN_PH_SENSOR);
  float voltage = (rawAdc / 4095.0) * 3.3;
  // Typical analog pH calibration: pH 7 = 2.5V, Slope = -5.70 pH/V
  float ph = 7.0 + ((2.5 - voltage) * 3.5);
  return constrain(ph, 0.0, 14.0);
}

// Read and calibrate Analog TDS Sensor (ppm)
float readTDSppm() {
  int rawAdc = analogRead(PIN_TDS_SENSOR);
  float voltage = (rawAdc / 4095.0) * 3.3;
  // TDS conversion factor (approximate 0.5 EC)
  float tds = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * 0.5;
  return constrain(tds, 10.0, 1500.0);
}

// Read and calibrate Optical Turbidity Sensor (NTU)
float readTurbidityNTU() {
  int rawAdc = analogRead(PIN_TURBIDITY);
  float voltage = (rawAdc / 4095.0) * 3.3;
  // Voltage to NTU polynomial (clean water ~ 4.2V = 0 NTU)
  float ntu = 0.0;
  if (voltage < 2.5) {
    ntu = 3000.0;
  } else {
    ntu = -1120.4 * (voltage * voltage) + 5742.3 * voltage - 4352.9;
  }
  return constrain(ntu, 0.0, 100.0);
}

// Convert Valve percentage (0% - 100%) to Servo angle (0 deg - 90 deg)
void applyValveAperture(int percent) {
  percent = constrain(percent, 0, 100);
  currentValvePercent = percent;
  int angle = map(percent, 0, 100, 0, 90);
  sluiceValve.write(angle);
}

// Set Intake / Distribution Pump Relay State
void setPumpState(bool turnOn) {
  digitalWrite(PIN_PUMP_RELAY, turnOn ? RELAY_ON : RELAY_OFF);
}

// ======================== 7. WI-FI CONNECTION MANAGER ===================== //
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS)); // Blink while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, HIGH); // Solid ON when connected
    Serial.println("\n[Wi-Fi Connected!]");
    Serial.print("ESP32 IP Address : ");
    Serial.println(WiFi.localIP());
    Serial.print("Connecting to AquaFair SCADA Server at: ");
    Serial.println(SERVER_URL);
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n[ERROR] Wi-Fi Connection Failed. Will retry during loop.");
  }
}

// ======================== 8. ARDUINO SETUP ================================ //
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("  AquaFair IoT RTU Firmware – ESP32 Direct Ingestion   ");
  Serial.println("========================================================");

  // Initialize GPIO Pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);

  // Analog pins configuration (12-bit resolution: 0 - 4095)
  analogReadResolution(12);

  // Initial Safety States
  setPumpState(true); // Energize pump by default (auto-controlled by server)
  digitalWrite(PIN_LED_STATUS, LOW);

  // Attach Hardware Interrupt for Flow Sensor
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), onFlowSensorPulse, RISING);

  // Attach Sluice Valve Servo
  ESP32PWM::allocateTimer(0);
  sluiceValve.setPeriodHertz(50); // Standard 50Hz servo
  sluiceValve.attach(PIN_SERVO_VALVE, 500, 2400);
  applyValveAperture(90); // Default open to 90% aperture

  // Connect to Local Wi-Fi Network
  connectToWiFi();
}

// ======================== 9. ARDUINO MAIN LOOP ============================ //
void loop() {
  // Ensure Wi-Fi connection is maintained
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    delay(1000);
    return;
  }

  unsigned long currentMillis = millis();

  // Transmit telemetry periodically without blocking
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    // --- STEP 1: CALCULATE REAL-TIME FLOW HYDRAULICS ---
    // Read and reset pulse counter atomically
    noInterrupts();
    unsigned long currentPulses = pulseCount;
    pulseCount = 0;
    interrupts();

    // Time elapsed in seconds since last sample
    float elapsedSec = TELEMETRY_INTERVAL_MS / 1000.0;

    // Flow Rate: (pulses / factor) * (60s / elapsedSec) -> L/min
    if (currentPulses > 0) {
      currentFlowRateLPM = (currentPulses / FLOW_CALIBRATION_FACTOR) / elapsedSec;
    } else {
      currentFlowRateLPM = 0.0;
    }

    // Cumulative volume delivered in this interval
    float intervalLiters = currentPulses / PULSES_PER_LITER;
    totalDeliveredLiters += intervalLiters;

    // --- STEP 2: MEASURE SENSORS ---
    float reservoirLiters = calculateReservoirVolumeLiters();
    float phValue         = readPHLevel();
    float tdsValue        = readTDSppm();
    float turbidityNTU    = readTurbidityNTU();

    // Local Anomaly / Contamination Heuristics (Grade A Standards: pH 6.5-8.5, Turbidity < 5 NTU)
    bool contamination = (phValue < 6.5 || phValue > 8.5 || turbidityNTU > 5.0 || tdsValue > 500.0);

    // --- STEP 3: CONSTRUCT JSON TELEMETRY PAYLOAD ---
    StaticJsonDocument<768> payloadDoc;
    payloadDoc["device_id"]            = DEVICE_ID;
    payloadDoc["tank_capacity_liters"] = TANK_CAPACITY_MAX_L;
    payloadDoc["tank_level_liters"]    = reservoirLiters;
    payloadDoc["ph_level"]             = round(phValue * 10.0) / 10.0;
    payloadDoc["tds_ppm"]              = round(tdsValue);
    payloadDoc["turbidity_ntu"]        = round(turbidityNTU * 10.0) / 10.0;
    payloadDoc["contamination_detected"] = contamination;

    // Ward Specific Real-Time Measurements
    JsonArray wardsArray = payloadDoc.createNestedArray("wards");
    JsonObject wardNode = wardsArray.createNestedObject();
    wardNode["ward_number"]                = WARD_NUMBER;
    wardNode["ward_name"]                  = WARD_NAME;
    wardNode["no_of_houses"]               = NO_OF_HOUSES;
    wardNode["flow_rate"]                  = round(currentFlowRateLPM * 10.0) / 10.0;
    wardNode["delivered_increment_liters"] = round(intervalLiters * 100.0) / 100.0;
    wardNode["delivered_liters"]           = round(totalDeliveredLiters * 10.0) / 10.0;
    wardNode["pressure_bar"]               = 3.2; // Nominal headworks line pressure

    String jsonBuffer;
    serializeJson(payloadDoc, jsonBuffer);

    // Print Telemetry Summary to Serial
    Serial.println("\n--------------------------------------------------------");
    Serial.printf("[TX TELEMETRY] ESR Tank: %.0f L | Flow: %.1f L/min | Quota: %.1f L\n", 
                  reservoirLiters, currentFlowRateLPM, totalDeliveredLiters);
    Serial.printf("               pH: %.2f | TDS: %.0f ppm | Turbidity: %.1f NTU\n", 
                  phValue, tdsValue, turbidityNTU);

    // --- STEP 4: SEND HTTP POST TO AQUAFAIR SCADA BACKEND ---
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2500); // 2.5s network timeout

    int httpCode = http.POST(jsonBuffer);

    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      String responseBody = http.getString();
      
      // Parse SCADA Feedback & Actuator Commands
      StaticJsonDocument<1024> respDoc;
      DeserializationError err = deserializeJson(respDoc, responseBody);

      if (!err) {
        // 1. Process Main Intake / Distribution Pump Relay Command
        const char* pumpCommand = respDoc["pump_command"];
        bool reserveSafeguard   = respDoc["reserve_safeguard_active"] | false;

        if (strcmp(pumpCommand, "Stopped") == 0 || strcmp(pumpCommand, "Standby") == 0 || reserveSafeguard) {
          setPumpState(false);
          Serial.printf("   [ACTUATOR] ⚠️  PUMP SAFETY INTERLOCK TRIPPED: %s (Relay OFF)\n", pumpCommand);
        } else {
          setPumpState(true);
        }

        // 2. Process Sluice Valve Aperture Feedback for this Ward
        JsonArray valvesCommand = respDoc["valves_command"];
        for (JsonObject v : valvesCommand) {
          int targetWard = v["ward_number"];
          if (targetWard == WARD_NUMBER) {
            int targetAperture   = v["target_valve_percent"] | v["valve_percent"] | 0;
            bool quotaFulfilled  = v["quota_fulfilled"] | false;

            if (quotaFulfilled || targetAperture == 0) {
              applyValveAperture(0);
              Serial.println("   [ACTUATOR] 🛑 FAIR QUOTA REACHED -> Sluice Valve Auto-Closed (0%)");
            } else {
              applyValveAperture(targetAperture);
              Serial.printf("   [ACTUATOR] ⚙️  Sluice Valve Modulated to %d%% Aperture\n", targetAperture);
            }
            break;
          }
        }
      } else {
        Serial.println("   [WARN] JSON Deserialization error in server response.");
      }
    } else {
      Serial.printf("   [ERROR] HTTP POST Failed with Code: %d\n", httpCode);
      if (httpCode < 0) {
        Serial.printf("           Connection Error: %s\n", http.errorToString(httpCode).c_str());
      }
    }

    http.end();
  }
}
