# Future hardware/API integration

Recommended next layer:
- ESP32/Arduino reads flow sensors, tank ultrasonic sensor and valve states.
- ESP32 publishes telemetry over MQTT.
- Django/FastAPI backend receives telemetry.
- Backend stores readings and sends valve/pump commands.
- Dashboard consumes REST/WebSocket endpoints.

Suggested endpoints:
POST /api/auth/register
POST /api/auth/login
GET  /api/dashboard
GET  /api/zones
GET  /api/telemetry
POST /api/zones/{id}/control
GET  /api/alerts
