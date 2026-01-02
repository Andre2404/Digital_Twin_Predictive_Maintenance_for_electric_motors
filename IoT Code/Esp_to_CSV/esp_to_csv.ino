#include <PZEM004Tv30.h>
#include <Wire.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_MLX90614.h>

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
   MPU Sampling
   ======================= */
const int SAMPLE_COUNT = 500;


void setup() {
  Serial.begin(115200);
  delay(1000);

  pzemSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);

  Wire.begin(21, 22);
  mpu.initialize();
  mlx.begin();

  ds18b20.begin();

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  analogSetPinAttenuation(DUST_PIN, ADC_11db);

  Serial.println("=== 5 SENSOR MONITORING SYSTEM READY ===");
}

void loop() {

  /* =======================
     PZEM
     ======================= */
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power   = pzem.power();
  float energy  = pzem.energy();
  float freq    = pzem.frequency();
  float pf      = pzem.pf();

  String voltageAlert = (voltage < 200) ? "GREEN" :
                        (voltage <= 230) ? "YELLOW" : "RED";

  String pfAlert = (pf > 0.85) ? "GREEN" :
                   (pf >= 0.7) ? "YELLOW" : "RED";

  /* =======================
     MLX90614
     ======================= */
  float tempAmbient = mlx.readAmbientTempC();
  float tempMotor   = mlx.readObjectTempC();

  String tempAlert = (tempMotor < 70) ? "GREEN" :
                     (tempMotor <= 85) ? "YELLOW" : "RED";

  bool hotspot = (tempMotor - tempAmbient) > 15;

  /* =======================
     DS18B20
     ======================= */
  ds18b20.requestTemperatures();
  float tempBearing = ds18b20.getTempCByIndex(0);
  float deltaTemp   = tempBearing - tempAmbient;

  /* =======================
     Dust Sensor
     ======================= */
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(280);
  int adc = analogRead(DUST_PIN);
  delayMicroseconds(40);
  digitalWrite(LED_PIN, HIGH);
  delayMicroseconds(9680);

  float vDust = adc * (3.3 / 4095.0) * 3.0;
  float dust = (vDust - OFFSET_V) * 1000.0;
  if (dust < 0) dust = 0;

  String dustAlert = (dust < 50) ? "GREEN" :
                     (dust <= 100) ? "YELLOW" : "RED";

  float soilingLoss = min((dust / 300.0) * 100.0, 100.0);

  /* =======================
     MPU6050 Vibration
     ======================= */
  float sum = 0, sumSq = 0, peak = 0;

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    float x = ax / 16384.0;
    float y = ay / 16384.0;
    float z = az / 16384.0;

    float res = abs(sqrt(x*x + y*y + z*z) - 1.0);
    sum += res;
    sumSq += res * res;
    if (res > peak) peak = res;

    delayMicroseconds(2000);
  }

  float rms_g = sqrt(sumSq / SAMPLE_COUNT);
  float rms_mm_s = rms_g * 9.81 * 1000.0;

  String vibAlert = (rms_mm_s < 2.8) ? "GREEN" :
                    (rms_mm_s <= 4.5) ? "YELLOW" : "RED";

  float unbalance = min((rms_mm_s / 6.0) * 100.0, 100.0);
  float bearingHealth = 100.0 - unbalance;

  /* =======================
     JSON OUTPUT
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

  delay(2000);
}