#include <PZEM004Tv30.h>
#include <Wire.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_MLX90614.h>
#include <time.h>

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
Adafruit_MLX90614 mlx;

/* =======================
   DS18B20
   ======================= */
#define ONE_WIRE_BUS 14
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

/* =======================
   GP2Y1010A0
   ======================= */
#define DUST_PIN 34
#define LED_PIN  4

/* =======================
   MPU Sampling (ISO 20816)
   ======================= */
const int SAMPLE_COUNT = 1024;
const float SAMPLE_RATE = 1000.0;
const float DT = 1.0 / SAMPLE_RATE;

/* =======================
   Dust Calibration
   ======================= */
const float DUST_OFFSET_MG = 0.05;

/* =======================
   Setup
   ======================= */
void setup() {
  Serial.begin(115200);
  delay(1500);

  pzemSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);

  Wire.begin(21, 22);
  mpu.initialize();
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);

  mlx.begin();
  ds18b20.begin();

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  analogSetPinAttenuation(DUST_PIN, ADC_11db);

  configTime(0, 0, "pool.ntp.org"); // optional, timestamp fallback tetap jalan
}

/* =======================
   Main Loop
   ======================= */
void loop() {

  /* ========= ELECTRICAL ========= */
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power   = pzem.power();
  float energy  = pzem.energy();
  float freq    = pzem.frequency();
  float pf      = pzem.pf();

  float apparentPower = voltage * current;
  float loadIndex = constrain((current / 10.0f) * 100.0f, 0.0f, 100.0f);
  float currentFreqRatio = (freq > 0) ? current / freq : 0.0f;

  /* ========= TEMPERATURE ========= */
  float ambientTemp = mlx.readAmbientTempC();
  float motorTemp   = mlx.readObjectTempC();

  ds18b20.requestTemperatures();
  float bearingTemp = ds18b20.getTempCByIndex(0);

  float deltaTemp = bearingTemp - ambientTemp;
  float tempGradient = motorTemp - ambientTemp;
  float bearingMotorTempDiff = bearingTemp - motorTemp;
  bool hotspot = tempGradient > 15.0f;

  /* ========= DUST ========= */
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(280);
  int adc = analogRead(DUST_PIN);
  delayMicroseconds(40);
  digitalWrite(LED_PIN, HIGH);
  delayMicroseconds(9680);

  float voltageDust = adc * (3.3f / 4095.0f);
  float dust_mg_m3 = (voltageDust - 0.9f) / 0.5f;
  if (dust_mg_m3 < 0) dust_mg_m3 = 0;
  dust_mg_m3 -= DUST_OFFSET_MG;
  if (dust_mg_m3 < 0) dust_mg_m3 = 0;

  float dust_ug_m3 = dust_mg_m3 * 1000.0f;
  float soilingLoss = constrain((dust_ug_m3 / 300.0f) * 100.0f, 0.0f, 100.0f);

  /* ========= VIBRATION (ISO 20816) ========= */
  float velocity = 0.0f;
  float velocitySqSum = 0.0f;
  float peak_g = 0.0f;

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    float x = ax / 16384.0f;
    float y = ay / 16384.0f;
    float z = az / 16384.0f;

    float acc_g = sqrt(x*x + y*y + z*z) - 1.0f;
    float acc_ms2 = acc_g * 9.80665f;

    velocity += acc_ms2 * DT;
    velocitySqSum += velocity * velocity;

    if (abs(acc_g) > peak_g) peak_g = abs(acc_g);

    delayMicroseconds((int)(1000000.0f / SAMPLE_RATE));
  }

  float vibration_rms_ms = sqrt(velocitySqSum / SAMPLE_COUNT);
  float vibration_rms_mm_s = vibration_rms_ms * 1000.0f;
  float crestFactor = (vibration_rms_ms > 0) ?
                      (peak_g * 9.80665f) / vibration_rms_ms : 0.0f;

  float unbalance = constrain((vibration_rms_mm_s / 6.0f) * 100.0f, 0.0f, 100.0f);
  float bearingHealth = 100.0f - unbalance;

  /* ========= HEALTH INDEX ========= */
  float healthIndex =
    (bearingHealth * 0.6f) +
    ((motorTemp < 80.0f) ? 20.0f : 0.0f) +
    ((dust_ug_m3 < 150.0f) ? 20.0f : 0.0f);
  healthIndex = constrain(healthIndex, 0.0f, 100.0f);

  /* ========= JSON OUTPUT (STRICT) ========= */
  Serial.print("{");

  Serial.printf("\"voltage\":%.2f,", voltage);
  Serial.printf("\"current\":%.2f,", current);
  Serial.printf("\"power\":%.2f,", power);
  Serial.printf("\"energy\":%.3f,", energy);
  Serial.printf("\"frequency\":%.2f,", freq);
  Serial.printf("\"pf\":%.2f,", pf);
  Serial.printf("\"apparent_power\":%.2f,", apparentPower);
  Serial.printf("\"load_index\":%.2f,", loadIndex);
  Serial.printf("\"current_freq_ratio\":%.4f,", currentFreqRatio);

  Serial.printf("\"motor_temp\":%.2f,", motorTemp);
  Serial.printf("\"ambient_temp\":%.2f,", ambientTemp);
  Serial.printf("\"bearing_temp\":%.2f,", bearingTemp);
  Serial.printf("\"delta_temp\":%.2f,", deltaTemp);
  Serial.printf("\"temp_gradient\":%.2f,", tempGradient);
  Serial.printf("\"bearing_motor_diff\":%.2f,", bearingMotorTempDiff);
  Serial.printf("\"hotspot\":%s,", hotspot ? "true" : "false");

  Serial.printf("\"dust\":%.2f,", dust_ug_m3);
  Serial.printf("\"soiling_loss\":%.2f,", soilingLoss);

  Serial.printf("\"vibration_rms_mm_s\":%.2f,", vibration_rms_mm_s);
  Serial.printf("\"vibration_peak_g\":%.4f,", peak_g);
  Serial.printf("\"crest_factor\":%.2f,", crestFactor);
  Serial.printf("\"unbalance\":%.2f,", unbalance);

  Serial.printf("\"bearing_health\":%.2f,", bearingHealth);
  Serial.printf("\"health_index\":%.2f,", healthIndex);

  Serial.printf("\"timestamp\":%lu", (uint32_t)time(nullptr));

  Serial.println("}");

  delay(2000);
}
