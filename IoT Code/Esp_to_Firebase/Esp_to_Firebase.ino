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
       WIFI CONFIG
   ======================= */
#define WIFI_SSID     " "
#define WIFI_PASSWORD " "

/* =======================
      FIREBASE CONFIG
   ======================= */
// PASTIKAN: Tanpa "https://" dan tanpa "/" di akhir
#define FIREBASE_HOST "test-mode-62bda-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "UK4P0trCSAcKN1iEMRNplvkYmkom3m6aHWba48DU"

FirebaseData fbdo;
FirebaseAuth auth;   
FirebaseConfig config;

/* =======================
   SENSORS PINOUT & OBJECTS
   ======================= */
#define RXD2 16
#define TXD2 17
HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, RXD2, TXD2);

MPU6050 mpu;
Adafruit_MLX90614 mlx;

#define ONE_WIRE_BUS 14
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

#define DUST_PIN 34
#define LED_PIN  4

/* =======================
   VARIABLES
   ======================= */
float dustOffset = 0.25;
float axOffset = 0, ayOffset = 0, azOffset = 0;
#define SAMPLE_COUNT 500

unsigned long lastMillis = 0;
const unsigned long interval = 2000;

/* =======================
   CALIBRATION FUNCTIONS
   ======================= */

void calibrateMPU6050() {
  Serial.println("Calibrating MPU6050...");
  long axSum = 0, aySum = 0, azSum = 0;
  for (int i = 0; i < 500; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);
    axSum += ax; aySum += ay; azSum += az;
    delay(5);
  }
  axOffset = axSum / 500.0f;
  ayOffset = aySum / 500.0f;
  azOffset = (azSum / 500.0f) - 16384.0f;
  Serial.println("MPU6050 Calibrated");
}

void calibrateDustSensor() {
  Serial.println("Calibrating Dust Sensor...");
  float sum = 0;
  for (int i = 0; i < 100; i++) {
    digitalWrite(LED_PIN, LOW);
    delayMicroseconds(280);
    int adc = analogRead(DUST_PIN);
    delayMicroseconds(40);
    digitalWrite(LED_PIN, HIGH);
    sum += adc * (3.3f / 4095.0f);
    delay(10);
  }
  dustOffset = sum / 100.0f;
  Serial.print("Dust Offset: "); Serial.println(dustOffset, 3);
}

/* =======================
   SETUP
   ======================= */
void setup() {
  Serial.begin(115200);
  
  pzemSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Wire.begin(21, 22);
  
  mpu.initialize();
  mlx.begin();
  ds18b20.begin();

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  analogReadResolution(12);
  analogSetPinAttenuation(DUST_PIN, ADC_11db);

  calibrateMPU6050();
  calibrateDustSensor();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

/* =======================
   LOOP
   ======================= */
void loop() {
  if (millis() - lastMillis < interval) return;
  lastMillis = millis();

  // --- ELECTRICAL ---
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power   = pzem.power();
  float energy  = pzem.energy();
  float freq    = pzem.frequency();
  float pf      = pzem.pf();

  if (isnan(voltage)) voltage = 0.0f;
  if (isnan(current)) current = 0.0f;
  if (isnan(power))   power = 0.0f;
  if (isnan(pf))      pf = 0.0f;

  float apparentPower = voltage * current;
  float loadIndex = (apparentPower > 0) ? (power / apparentPower) : 0.0f;
  float currentFreqRatio = (freq > 0) ? (current / freq) : 0.0f;

  // --- TEMPERATURE ---
  float ambientTemp = mlx.readAmbientTempC();
  float motorTemp   = mlx.readObjectTempC();
  ds18b20.requestTemperatures();
  float bearingTemp = ds18b20.getTempCByIndex(0);

  float deltaTemp = bearingTemp - ambientTemp;
  float tempGradient = motorTemp - ambientTemp;
  float bearingMotorTempDiff = bearingTemp - motorTemp;
  bool hotspot = tempGradient > 15.0f;

  // --- DUST ---
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(280);
  int adcDust = analogRead(DUST_PIN);
  delayMicroseconds(40);
  digitalWrite(LED_PIN, HIGH);

  float vDust = adcDust * (3.3f / 4095.0f);
  float dust = (vDust - dustOffset) * 1000.0f;
  if (dust < 0) dust = 0.0f;
  float soilingLoss = min((dust / 300.0f) * 100.0f, 100.0f);

  // --- VIBRATION ---
  float sumSq = 0, peak = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);
    float x = (ax - axOffset) / 16384.0f;
    float y = (ay - ayOffset) / 16384.0f;
    float z = (az - azOffset) / 16384.0f;
    float res = abs(sqrt(x*x + y*y + z*z) - 1.0f);
    sumSq += res * res;
    if (res > peak) peak = res;
    delayMicroseconds(1000); 
  }

  float rms_g = sqrt(sumSq / SAMPLE_COUNT);
  float rms_mm_s = rms_g * 9.81f * 1000.0f;
  float crestFactor = (rms_g > 0) ? (peak / rms_g) : 0.0f;
  float unbalance = min((rms_mm_s / 6.0f) * 100.0f, 100.0f);
  float bearingHealth = 100.0f - unbalance;

  // --- HEALTH INDEX CALCULATION ---
  // Perbaikan max(float, float) dengan suffix 'f'
  float healthIndex = 100.0f 
                    - (0.35f * unbalance) 
                    - (0.30f * max(tempGradient, 0.0f)) 
                    - (0.20f * max((1.0f - pf) * 100.0f, 0.0f)) 
                    - (0.15f * soilingLoss);
  healthIndex = constrain(healthIndex, 0.0f, 100.0f);

  // --- SEND TO FIREBASE ---
  if (Firebase.ready()) {
    FirebaseJson json;
    json.clear(); // Sangat penting untuk mencegah error parsing

    json.set("voltage", voltage);
    json.set("current", current);
    json.set("power", power);
    json.set("energy", energy);
    json.set("frequency", freq);
    json.set("pf", pf);
    json.set("apparent_power", apparentPower);
    json.set("load_index", loadIndex);
    json.set("current_freq_ratio", currentFreqRatio);

    json.set("motor_temp", motorTemp);
    json.set("ambient_temp", ambientTemp);
    json.set("bearing_temp", bearingTemp);
    json.set("delta_temp", deltaTemp);
    json.set("temp_gradient", tempGradient);
    json.set("bearing_motor_temp_diff", bearingMotorTempDiff);
    json.set("hotspot", hotspot);

    json.set("dust", dust);
    json.set("soiling_loss", soilingLoss);

    json.set("vibration_rms_mm_s", rms_mm_s);
    json.set("vibration_peak_g", peak);
    json.set("crest_factor", crestFactor);
    json.set("unbalance", unbalance);

    json.set("bearing_health", bearingHealth);
    json.set("health_index", healthIndex);
    
    // Gunakan explicit cast ke uint32_t agar JSON valid
    json.set("timestamp", (uint32_t)time(nullptr));

    // Kirim data
    if (Firebase.setJSON(fbdo, "/sensor_data/latest", json)) {
      Serial.println("✓ Success: Latest data updated");
    } else {
      Serial.print("X Failed SetJSON: "); Serial.println(fbdo.errorReason());
    }

    if (Firebase.pushJSON(fbdo, "/sensor_data/history", json)) {
      Serial.println("✓ Success: History pushed");
    } else {
      Serial.print("X Failed PushJSON: "); Serial.println(fbdo.errorReason());
    }
  } else {
    Serial.println("Firebase not ready...");
  }
    // --- SERIAL MONITOR OUTPUT (MATCH JSON) ---
  Serial.println("\n================ SENSOR DATA ================");

  Serial.println("\n--- ELECTRICAL ---");
  Serial.printf("voltage               : %.2f V\n", voltage);
  Serial.printf("current               : %.2f A\n", current);
  Serial.printf("power                 : %.2f W\n", power);
  Serial.printf("energy                : %.3f kWh\n", energy);
  Serial.printf("frequency             : %.2f Hz\n", freq);
  Serial.printf("pf                    : %.2f\n", pf);
  Serial.printf("apparent_power        : %.2f VA\n", apparentPower);
  Serial.printf("load_index            : %.2f\n", loadIndex);
  Serial.printf("current_freq_ratio    : %.4f\n", currentFreqRatio);

  Serial.println("\n--- TEMPERATURE ---");
  Serial.printf("motor_temp            : %.2f °C\n", motorTemp);
  Serial.printf("ambient_temp          : %.2f °C\n", ambientTemp);
  Serial.printf("bearing_temp          : %.2f °C\n", bearingTemp);
  Serial.printf("delta_temp            : %.2f °C\n", deltaTemp);
  Serial.printf("temp_gradient         : %.2f °C\n", tempGradient);
  Serial.printf("bearing_motor_diff    : %.2f °C\n", bearingMotorTempDiff);
  Serial.printf("hotspot               : %s\n", hotspot ? "true" : "false");

  Serial.println("\n--- DUST ---");
  Serial.printf("dust                  : %.2f ug/m3\n", dust);
  Serial.printf("soiling_loss          : %.2f %%\n", soilingLoss);

  Serial.println("\n--- VIBRATION ---");
  Serial.printf("vibration_rms_mm_s    : %.2f mm/s\n", rms_mm_s);
  Serial.printf("vibration_peak_g      : %.4f g\n", peak);
  Serial.printf("crest_factor          : %.2f\n", crestFactor);
  Serial.printf("unbalance             : %.2f %%\n", unbalance);

  Serial.println("\n--- HEALTH ---");
  Serial.printf("bearing_health        : %.2f %%\n", bearingHealth);
  Serial.printf("health_index          : %.2f %%\n", healthIndex);

  Serial.println("\n--- TIME ---");
  Serial.printf("timestamp             : %lu\n", (uint32_t)time(nullptr));

  Serial.println("=============================================\n");

}
