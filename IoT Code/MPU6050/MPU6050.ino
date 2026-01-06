#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

const int SAMPLE_COUNT = 500;
const int SAMPLE_DELAY_US = 500;

// ===== RMS REFERENSI (HASIL OBSERVASI REAL) =====
const float RMS_MIN      = 0.010;   // idle normal
const float RMS_NORMAL   = 0.250;   // batas normal
const float RMS_WARNING  = 0.400;   // mulai warning
const float RMS_FAULT    = 1.000;   // fault keras

// ===== SKALA LAMA =====
const int SCALE_MIN      = 4000;
const int SCALE_NORMAL   = 4700;
const int SCALE_WARNING  = 5000;
const int SCALE_FAULT    = 5400;

void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(21, 22);
  delay(100);

  mpu.initialize();
  delay(100);

  Serial.println("VibrationIndex,RMS_g,Peak_g,Status");
}

int mapFloat(float x, float in_min, float in_max, int out_min, int out_max) {
  if (x <= in_min) return out_min;
  if (x >= in_max) return out_max;
  return out_min + (x - in_min) * (out_max - out_min) / (in_max - in_min);
}

void loop() {
  float data[SAMPLE_COUNT];
  float meanAcc = 0;

  // ===== SAMPLING Z-AXIS =====
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    float azg = az / 16384.0;
    data[i] = azg;
    meanAcc += azg;

    delayMicroseconds(SAMPLE_DELAY_US);
  }

  // ===== DC REMOVAL =====
  meanAcc /= SAMPLE_COUNT;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    data[i] -= meanAcc;
  }

  // ===== FEATURE EXTRACTION =====
  float sumSq = 0;
  float peak = 0;

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    float v = data[i];
    sumSq += v * v;
    if (abs(v) > peak) peak = abs(v);
  }

  float rms = sqrt(sumSq / SAMPLE_COUNT);

  // ===== SKALA KOMPATIBEL =====
  int vibrationIndex;
  String status;

  if (rms < RMS_NORMAL) {
    vibrationIndex = mapFloat(rms, RMS_MIN, RMS_NORMAL,
                              SCALE_MIN, SCALE_NORMAL);
    status = "NORMAL";
  }
  else if (rms < RMS_WARNING) {
    vibrationIndex = mapFloat(rms, RMS_NORMAL, RMS_WARNING,
                              SCALE_NORMAL, SCALE_WARNING);
    status = "WARNING";
  }
  else {
    vibrationIndex = mapFloat(rms, RMS_WARNING, RMS_FAULT,
                              SCALE_WARNING, SCALE_FAULT);
    status = "ALERT";
  }

  // ===== OUTPUT =====
  Serial.print(vibrationIndex);
  Serial.print(",");
  Serial.print(rms, 6);
  Serial.print(",");
  Serial.print(peak, 6);
  Serial.print(",");
  Serial.println(status);

  delay(500);
}
