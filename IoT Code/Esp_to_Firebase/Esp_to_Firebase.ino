#include <PZEM004Tv30.h>
#include <Wire.h>
#include <time.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_MLX90614.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

/* =======================
   WiFi Credentials
   ======================= */
#define WIFI_SSID "WIFIPARAREL"
#define WIFI_PASSWORD "pararel123"

/* =======================
   Firebase Configuration
   ======================= */
#define FIREBASE_HOST "test-mode-62bda-default-rtdb.firebaseio.com"  // TANPA https:// dan /
#define FIREBASE_AUTH "UK4P0trCSAcKN1iEMRNplvkYmkom3m6aHWba48DU"

/* =======================
   Firebase Objects
   ======================= */
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool firebaseReady = false;

/* =======================
   PZEM-004T
   ======================= */
#define RXD2 16
#define TXD2 17
HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, RXD2, TXD2);

/* =======================
   I2C Sensors
   ======================= */
MPU6050 mpu;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

/* =======================
   DS18B20
   ======================= */
#define ONE_WIRE_BUS 14
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

/* =======================
   Dust Sensor GP2Y
   ======================= */
#define DUST_PIN 34
#define LED_PIN  4
#define OFFSET_V 0.33

/* =======================
   EDGE AGGREGATION CONFIG
   ======================= */
const uint32_t READ_INTERVAL_MS = 200;    // baca sensor tiap 200ms (aggregation input)
const uint32_t SEND_INTERVAL_MS = 2000;   // kirim ke Firebase tiap 2 detik (aggregation output)

/* =======================
   MPU Stabilization
   ======================= */
float axOff = 0, ayOff = 0, azOff = 0;     // baseline (g)
bool  mpuCalibrated = false;

float vibEma = 0.0f;                       // smoothing hasil vibration
const float VIB_EMA_ALPHA = 0.10f;         // makin kecil makin halus (0.05-0.2)

/* =======================
   Aggregator State
   ======================= */
struct Agg {
  uint32_t n = 0;

  // sums (mean)
  double vSum=0, iSum=0, pSum=0, fSum=0, pfSum=0;
  double motorTSum=0, ambTSum=0;
  double bearingTSum=0, deltaTSum=0;
  double dustSum=0, soilSum=0;
  double vibSum=0;

  // peaks (max)
  float vibPeak = 0;
  float motorTPeak = -999;
  float bearingTPeak = -999;
  float dustPeak = 0;

  // last (for cumulative)
  float energyLast = 0;

  // flags (OR)
  bool hotspotAny = false;

  void reset() {
    n = 0;
    vSum=iSum=pSum=fSum=pfSum=0;
    motorTSum=ambTSum=0;
    bearingTSum=deltaTSum=0;
    dustSum=soilSum=0;
    vibSum=0;

    vibPeak = 0;
    motorTPeak = -999;
    bearingTPeak = -999;
    dustPeak = 0;

    energyLast = 0;
    hotspotAny = false;
  }
};
Agg agg;

/* =======================
   Timing for dual-rate
   ======================= */
uint32_t lastReadMs = 0;
uint32_t lastSendMs = 0;

/* =======================
   Time helper
   ======================= */
unsigned long getUnixTimestamp() {
  time_t now;
  time(&now);
  return (unsigned long) now;
}

/* =======================
   MPU Calibration
   ======================= */
void calibrateMPU6050(uint16_t samples = 500) {
  // Ideal: motor OFF dan sensor diam
  double sx=0, sy=0, sz=0;

  for (uint16_t i=0; i<samples; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    float x = ax / 16384.0f;
    float y = ay / 16384.0f;
    float z = az / 16384.0f;

    sx += x; sy += y; sz += z;
    delay(5);
  }

  axOff = (float)(sx / samples);
  ayOff = (float)(sy / samples);
  azOff = (float)(sz / samples);

  mpuCalibrated = true;

  Serial.println("✓ MPU Calibrated (baseline g):");
  Serial.printf("  axOff=%.4f, ayOff=%.4f, azOff=%.4f\n", axOff, ayOff, azOff);
}

/* =======================
   Read Vibration (stable index)
   NOTE: Ini tetap pakai konsep kamu.
         Angka besar (mis 9xxx) dianggap sebagai "index".
   ======================= */
float readVibrationRmsMmS(uint16_t sampleCount = 200, uint16_t delayUs = 1000) {
  double sumSq = 0;

  for (uint16_t i=0; i<sampleCount; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    float x = ax / 16384.0f;
    float y = ay / 16384.0f;
    float z = az / 16384.0f;

    // baseline compensation
    if (mpuCalibrated) {
      x -= axOff;
      y -= ayOff;
      z -= azOff;
    }

    float mag = sqrtf(x*x + y*y + z*z);
    float res = fabsf(mag - 1.0f);

    sumSq += (double)res * (double)res;
    delayMicroseconds(delayUs);
  }

  float rms_g = sqrtf((float)(sumSq / sampleCount));
  float rms_mm_s = rms_g * 9.81f * 1000.0f;

  // EMA smoothing biar stabil
  vibEma = (VIB_EMA_ALPHA * rms_mm_s) + ((1.0f - VIB_EMA_ALPHA) * vibEma);
  return vibEma;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  /* =======================
     Initialize Sensors
     ======================= */
  pzemSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);

  Wire.begin(21, 22);
  mpu.initialize();

  // Kalibrasi MPU (ideal motor OFF / kondisi paling stabil)
  calibrateMPU6050(500);

  mlx.begin();
  ds18b20.begin();

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  analogSetPinAttenuation(DUST_PIN, ADC_11db);

  /* =======================
     Connect to WiFi
     ======================= */
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nWiFi Connection Failed!");
    while (1) delay(1000);
  }

  /* =======================
     Time Sync
     ======================= */
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");
  time_t now;
  while ((now = time(nullptr)) < 100000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✓ Time synced");

  /* =======================
     Initialize Firebase
     ======================= */
  Serial.println("\nInitializing Firebase...");
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  config.timeout.serverResponse = 10000;

  fbdo.setBSSLBufferSize(4096, 1024);
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  delay(2000);

  Serial.println("Testing Firebase connection...");
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("✓ Firebase Ready!");

    FirebaseJson testJson;
    testJson.set("test", "connected");
    testJson.set("timestamp", millis() / 1000);

    if (Firebase.setJSON(fbdo, "/test_connection", testJson)) {
      Serial.println("✓ Firebase Test Write Success!");
    } else {
      Serial.println("✗ Firebase Test Write Failed: " + fbdo.errorReason());
    }
  } else {
    Serial.println("✗ Firebase Not Ready!");
    Serial.println("Check your host and auth token");
  }

  Serial.println("\n=== 5 SENSOR MONITORING SYSTEM READY ===");
  Serial.println("=========================================");
}

void loop() {
  uint32_t nowMs = millis();

  /* =======================
     READ SENSOR FAST (aggregation input)
     ======================= */
  if (nowMs - lastReadMs >= READ_INTERVAL_MS) {
    lastReadMs = nowMs;

    // ---------- PZEM ----------
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power   = pzem.power();
    float energy  = pzem.energy();
    float freq    = pzem.frequency();
    float pf      = pzem.pf();

    if (isnan(voltage)) voltage = 0;
    if (isnan(current)) current = 0;
    if (isnan(power))   power   = 0;
    if (isnan(freq))    freq    = 0;
    if (isnan(pf))      pf      = 0;
    if (isnan(energy))  energy  = agg.energyLast;

    // ---------- MLX90614 ----------
    float tempAmbient = mlx.readAmbientTempC();
    float tempMotor   = mlx.readObjectTempC();

    // ---------- DS18B20 ----------
    ds18b20.requestTemperatures();
    float tempBearing = ds18b20.getTempCByIndex(0);
    float deltaTemp   = tempBearing - tempAmbient;

    // ---------- Dust ----------
    digitalWrite(LED_PIN, LOW);
    delayMicroseconds(280);
    int adc = analogRead(DUST_PIN);
    delayMicroseconds(40);
    digitalWrite(LED_PIN, HIGH);
    delayMicroseconds(9680);

    float vDust = adc * (3.3 / 4095.0) * 3.0;
    float dust = (vDust - OFFSET_V) * 1000.0;
    if (dust < 0) dust = 0;

    float soilingLoss = min((dust / 300.0) * 100.0, 100.0);

    // ---------- Vibration (stable index) ----------
    float rms_mm_s = readVibrationRmsMmS(200, 1000);

    // hotspot flag
    bool hotspot = (tempMotor - tempAmbient) > 15;

    // ---------- Aggregate into 2s window ----------
    agg.n++;

    agg.vSum  += voltage;
    agg.iSum  += current;
    agg.pSum  += power;
    agg.fSum  += freq;
    agg.pfSum += pf;

    agg.motorTSum += tempMotor;
    agg.ambTSum   += tempAmbient;

    agg.bearingTSum += tempBearing;
    agg.deltaTSum   += deltaTemp;

    agg.dustSum += dust;
    agg.soilSum += soilingLoss;

    agg.vibSum  += rms_mm_s;

    // peaks
    if (rms_mm_s > agg.vibPeak) agg.vibPeak = rms_mm_s;
    if (tempMotor > agg.motorTPeak) agg.motorTPeak = tempMotor;
    if (tempBearing > agg.bearingTPeak) agg.bearingTPeak = tempBearing;
    if (dust > agg.dustPeak) agg.dustPeak = dust;

    agg.energyLast = energy;
    agg.hotspotAny = agg.hotspotAny || hotspot;
  }

  /* =======================
     SEND TO FIREBASE EACH 2s (aggregation output)
     ======================= */
  if (nowMs - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = nowMs;

    if (agg.n == 0) return;

    // mean values for this 2s window
    float voltage = (float)(agg.vSum / agg.n);
    float current = (float)(agg.iSum / agg.n);
    float power   = (float)(agg.pSum / agg.n);
    float energy  = (float)(agg.energyLast);
    float freq    = (float)(agg.fSum / agg.n);
    float pf      = (float)(agg.pfSum / agg.n);

    float tempMotor   = (float)(agg.motorTSum / agg.n);
    float tempAmbient = (float)(agg.ambTSum / agg.n);
    bool  hotspot     = agg.hotspotAny;

    float tempBearing = (float)(agg.bearingTSum / agg.n);
    float deltaTemp   = (float)(agg.deltaTSum / agg.n);

    float dust        = (float)(agg.dustSum / agg.n);
    float soilingLoss = (float)(agg.soilSum / agg.n);

    float rms_mm_s    = (float)(agg.vibSum / agg.n);

    // ALERT logic (pakai mean agar stabil)
    String voltageAlert = (voltage < 200) ? "GREEN" :
                          (voltage <= 230) ? "YELLOW" : "RED";

    String pfAlert = (pf > 0.85) ? "GREEN" :
                     (pf >= 0.7) ? "YELLOW" : "RED";

    String tempAlert = (tempMotor < 70) ? "GREEN" :
                       (tempMotor <= 85) ? "YELLOW" : "RED";

    String dustAlert = (dust < 50) ? "GREEN" :
                       (dust <= 100) ? "YELLOW" : "RED";

    // NOTE: threshold kamu tetap, tapi rms_mm_s kamu itu "index".
    // Kalau mau threshold sesuai index kamu, tinggal ganti angka ini nanti.
    String vibAlert = (rms_mm_s < 2.8) ? "GREEN" :
                      (rms_mm_s <= 4.5) ? "YELLOW" : "RED";

    float unbalance = min((rms_mm_s / 6.0) * 100.0, 100.0);
    float bearingHealth = 100.0 - unbalance;

    /* =======================
       Serial Output (tiap 2 detik)
       ======================= */
    Serial.println("{");
    Serial.printf("\"voltage\": %.1f,\n", voltage);
    Serial.printf("\"current\": %.2f,\n", current);
    Serial.printf("\"power\": %.1f,\n", power);
    Serial.printf("\"energy\": %.2f,\n", energy);
    Serial.printf("\"frequency\": %.2f,\n", freq);
    Serial.printf("\"pf\": %.2f,\n", pf);
    Serial.printf("\"voltage_alert\": \"%s\",\n", voltageAlert.c_str());
    Serial.printf("\"pf_alert\": \"%s\",\n", pfAlert.c_str());

    Serial.printf("\"motor_temp\": %.2f,\n", tempMotor);
    Serial.printf("\"ambient_temp\": %.2f,\n", tempAmbient);
    Serial.printf("\"temp_alert\": \"%s\",\n", tempAlert.c_str());
    Serial.printf("\"hotspot\": %s,\n", hotspot ? "true" : "false");

    Serial.printf("\"bearing_temp\": %.2f,\n", tempBearing);
    Serial.printf("\"delta_temp\": %.2f,\n", deltaTemp);

    Serial.printf("\"dust\": %.1f,\n", dust);
    Serial.printf("\"dust_alert\": \"%s\",\n", dustAlert.c_str());
    Serial.printf("\"soiling_loss\": %.1f,\n", soilingLoss);

    Serial.printf("\"vibration_rms_mm_s\": %.2f,\n", rms_mm_s);
    Serial.printf("\"vibration_alert\": \"%s\",\n", vibAlert.c_str());
    Serial.printf("\"unbalance\": %.1f,\n", unbalance);
    Serial.printf("\"bearing_health\": %.1f\n", bearingHealth);
    Serial.println("}");
    Serial.println("========================================");

    /* =======================
       Send to Firebase (tiap 2 detik)
       ======================= */
    if (firebaseReady) {
      FirebaseJson json;

      // Electrical Data
      json.set("voltage", voltage);
      json.set("current", current);
      json.set("power", power);
      json.set("energy", energy);
      json.set("frequency", freq);
      json.set("pf", pf);
      json.set("voltage_alert", voltageAlert.c_str());
      json.set("pf_alert", pfAlert.c_str());

      // Temperature Data
      json.set("motor_temp", tempMotor);
      json.set("ambient_temp", tempAmbient);
      json.set("temp_alert", tempAlert.c_str());
      json.set("hotspot", hotspot);

      // Bearing Data
      json.set("bearing_temp", tempBearing);
      json.set("delta_temp", deltaTemp);

      // Dust Data
      json.set("dust", dust);
      json.set("dust_alert", dustAlert.c_str());
      json.set("soiling_loss", soilingLoss);

      // Vibration Data
      json.set("vibration_rms_mm_s", rms_mm_s);
      json.set("vibration_alert", vibAlert.c_str());
      json.set("unbalance", unbalance);
      json.set("bearing_health", bearingHealth);

      // Timestamp
      unsigned long timestamp = getUnixTimestamp();
      json.set("timestamp", timestamp);

      // Paths
      String latestPath  = "/sensor_data/latest";
      String historyPath = "/sensor_data/history/" + String(timestamp);

      bool latestOK  = Firebase.setJSON(fbdo, latestPath, json);
      bool historyOK = Firebase.setJSON(fbdo, historyPath, json);

      if (latestOK) Serial.println("✓ Latest data updated");
      else Serial.println("✗ Latest update failed: " + fbdo.errorReason());

      if (historyOK) Serial.println("✓ History data appended");
      else Serial.println("✗ History write failed: " + fbdo.errorReason());

      if (fbdo.httpCode() == 401) {
        Serial.println("Reconnecting to Firebase...");
        Firebase.begin(&config, &auth);
        delay(1000);
      }
    } else {
      Serial.println("Firebase not ready, skipping upload");
    }

    // reset aggregator for next 2s window
    agg.reset();
  }
}
