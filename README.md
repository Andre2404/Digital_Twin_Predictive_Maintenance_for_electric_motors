# Mechasense - Digital twin predictive maintenance for motor electric

**IoT-based Predictive Maintenance for AC Motors**

Mechasense adalah platform monitoring dan predictive maintenance untuk motor AC yang mengintegrasikan IoT sensors, Machine Learning predictions, dan Expert System diagnosis.

---

## 🎯 Features

- **Real-time Dashboard**: Monitor 5 sensor (MLX90614, PZEM-004T, DS18B20, GP2Y1010, MPU6050) secara real-time
- **Predictive ML Health Score**: Placeholder untuk integrasi model ML prediksi kesehatan motor
- **Expert System Diagnosis**: Rule-based diagnosis dengan rekomendasi maintenance
- **Historical Analytics**: Visualisasi tren dan riwayat data sensor
- **Smart Alerts**: Automated alerts berdasarkan threshold parameter
- **Modern UI**: Clean, responsive dashboard dengan industrial vibes

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: PostgreSQL / SQLite
- **ORM**: Prisma
- **Real-time**: Polling (mudah upgrade ke SSE/WebSocket)

---

## 📁 Project Structure

```
mechasense/
├── app/
│   ├── dashboard/          # Main monitoring dashboard
│   ├── analytics/          # Historical data & trends
│   ├── ai-center/          # ML predictions & expert system
│   ├── settings/           # Configuration
│   ├── api/
│   │   ├── ingest/         # ESP data ingestion endpoint
│   │   ├── latest/         # Get latest sensor data
│   │   ├── ml/predict/     # ML prediction endpoint
│   │   └── expert/diagnose/# Expert system endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # Reusable UI components
│   ├── Navbar.tsx
│   ├── SensorStatusCard.tsx
│   ├── MotorOverviewCard.tsx
│   ├── TemperaturePanel.tsx
│   ├── VibrationPanel.tsx
│   ├── DustPanel.tsx
│   ├── AlertList.tsx
│   └── RealtimeStatusBar.tsx
├── hooks/
│   └── useRealtimeSensorData.ts  # Real-time data hook
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── thresholds.ts       # Threshold logic & colors
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script for dummy data
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm atau yarn
- PostgreSQL (opsional, bisa pakai SQLite untuk demo)

### Installation

1. **Clone repository** (atau gunakan folder ini)

```bash
cd "D:\APP\Web 3 Matkul"
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup database**

Untuk **SQLite** (demo):
```bash
# Database sudah dikonfigurasi di .env
# Tidak perlu setup tambahan
```

Untuk **PostgreSQL** (production):
```bash
# Edit .env dan ganti DATABASE_URL:
DATABASE_URL="postgresql://user:password@localhost:5432/mechasense?schema=public"
```

4. **Run Prisma migrations**

```bash
npx prisma migrate dev --name init
```

5. **Seed database dengan dummy data**

```bash
npm run prisma:seed
```

6. **Run development server**

```bash
npm run dev
```

7. **Open browser**

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 📊 Color Palette

Mechasense menggunakan color scheme berikut:

- **Primary Dark Blue** (`#1B3C53`): Navbar, header, tombol utama
- **Secondary Blue** (`#234C6A`): Card header, accent
- **Muted Blue** (`#456882`): Background card, secondary button
- **Light Grey** (`#E3E3E3`): Page background, borders
- **Status Colors**:
  - Normal: `#10b981` (green)
  - Warning: `#f59e0b` (amber)
  - Critical: `#ef4444` (red)

---

## 🔌 ESP32 Integration

### Sending Data from ESP32

ESP32 mengirim data sensor via HTTP POST ke endpoint `/api/ingest`.

**Contoh payload JSON:**

```json
{
  "motorId": "default-motor-1",
  "gridVoltage": 220.5,
  "motorCurrent": 3.8,
  "powerConsumption": 835.0,
  "powerFactor": 0.88,
  "dailyEnergyKwh": 18.5,
  "gridFrequency": 50.1,
  "vibrationRms": 2.3,
  "faultFrequency": 48.5,
  "rotorUnbalanceScore": 92.0,
  "bearingHealthScore": 88.0,
  "motorSurfaceTemp": 68.2,
  "thermalAnomalyIndex": 12.0,
  "bearingTemp": 65.5,
  "dustDensity": 35.0,
  "soilingLossPercent": 2.5
}
```

**Contoh kode ESP32 (Arduino/PlatformIO):**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/ingest";

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["motorId"] = "default-motor-1";
    doc["gridVoltage"] = readVoltage();
    doc["motorCurrent"] = readCurrent();
    doc["powerConsumption"] = readPower();
    doc["powerFactor"] = readPowerFactor();
    doc["dailyEnergyKwh"] = readEnergy();
    doc["gridFrequency"] = readFrequency();
    doc["vibrationRms"] = readVibration();
    doc["rotorUnbalanceScore"] = calculateRotorScore();
    doc["bearingHealthScore"] = calculateBearingScore();
    doc["motorSurfaceTemp"] = readIRTemp();
    doc["bearingTemp"] = readBearingTemp();
    doc["dustDensity"] = readDust();
    doc["soilingLossPercent"] = calculateSoiling();
    
    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.printf("Data sent successfully: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void loop() {
  sendSensorData();
  delay(2000); // Send every 2 seconds
}
```

---

## 📈 Threshold Configuration

Berikut adalah threshold yang digunakan untuk menentukan status sensor:

| Parameter | Normal | Warning | Critical |
|-----------|--------|---------|----------|
| Grid Voltage | < 200 V | 200-230 V | > 230 V |
| Motor Current | < 4 A | 4-5.5 A | > 5.5 A |
| Power Factor | > 0.85 | 0.7-0.85 | < 0.7 |
| Grid Frequency | 49.5-50.5 Hz | - | Outside range |
| Motor Temp | < 70°C | 70-85°C | > 85°C |
| Bearing Temp | < 70°C | 70-85°C | > 85°C |
| Dust Density | < 50 µg/m³ | 50-100 µg/m³ | > 100 µg/m³ |
| Vibration RMS | < 2.8 mm/s | 2.8-4.5 mm/s | > 4.5 mm/s |

Threshold dapat disesuaikan di file `lib/thresholds.ts`.

---

## 🤖 ML & Expert System Integration

### Machine Learning

Endpoint: `POST /api/ml/predict`

**Saat ini**: Menggunakan dummy logic berdasarkan threshold
**Production**: Integrasikan dengan model TensorFlow/PyTorch via REST API

```typescript
// Example: Call external Python ML service
const mlResponse = await fetch('http://ml-service:5000/predict', {
  method: 'POST',
  body: JSON.stringify({ features: sensorData })
});
```

### Expert System

Endpoint: `POST /api/expert/diagnose`

**Saat ini**: Hardcoded rules di `app/api/expert/diagnose/route.ts`
**Production**: Integrasikan dengan rule engine seperti Drools atau Nools

Contoh rules yang sudah diimplementasi:
- High vibration + High bearing temp → Bearing damage
- Low PF + High current → Overload
- High vibration + Normal temp → Misalignment/Unbalance
- Dan lainnya...

---

## 🧪 Testing

### Manual Testing

1. Jalankan seed script untuk generate dummy data:
```bash
npm run prisma:seed
```

2. Buka dashboard di browser

3. Test POST data via curl:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "motorId": "default-motor-1",
    "gridVoltage": 225,
    "motorCurrent": 4.2,
    "powerConsumption": 850,
    "powerFactor": 0.87,
    "dailyEnergyKwh": 20,
    "gridFrequency": 50.0,
    "vibrationRms": 2.5,
    "rotorUnbalanceScore": 90,
    "bearingHealthScore": 85,
    "motorSurfaceTemp": 72,
    "bearingTemp": 68,
    "dustDensity": 45,
    "soilingLossPercent": 3.0
  }'
```

---

## 📦 Deployment

### Production Checklist

- [ ] Ganti SQLite ke PostgreSQL di `.env`
- [ ] Set proper `NEXT_PUBLIC_API_BASE_URL`
- [ ] Implementasi authentication (NextAuth.js recommended)
- [ ] Setup HTTPS/SSL
- [ ] Optimize Prisma queries dengan pagination
- [ ] Implement rate limiting di API routes
- [ ] Setup monitoring (Sentry, LogRocket, dll)
- [ ] Deploy ke Vercel/Railway/DigitalOcean

### Deploy ke Vercel

```bash
npm install -g vercel
vercel
```

Jangan lupa tambahkan environment variables di Vercel dashboard.

---

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:migrate` - Run Prisma migrations
- `npm run prisma:seed` - Seed database

### Adding New Sensors

1. Update Prisma schema (`prisma/schema.prisma`)
2. Run migration: `npx prisma migrate dev`
3. Update threshold logic (`lib/thresholds.ts`)
4. Create/update UI components
5. Update API ingestion endpoint

---

## 🐛 Troubleshooting

### Prisma errors

```bash
npx prisma generate
npx prisma migrate reset
npm run prisma:seed
```

### Port already in use

```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database locked (SQLite)

Stop the dev server and restart.

---

## 📝 TODO / Future Improvements

- [ ] Authentication & authorization
- [ ] Multi-motor support dengan selector
- [ ] WebSocket untuk true real-time (ganti polling)
- [ ] Export data ke CSV/Excel
- [ ] Email notifications untuk alerts
- [ ] Mobile app (React Native)
- [ ] Dashboard customization (drag-drop widgets)
- [ ] Maintenance scheduling & tracking
- [ ] Integration dengan SCADA systems
- [ ] Predictive maintenance recommendations timeline

---

## 👥 Contributors

- **Your Name** - Initial work

---

## 📄 License

This project is for educational/demo purposes. Modify as needed for your use case.

---

## 🙏 Acknowledgments

- Next.js & React team
- Prisma team  
- Recharts contributors
- ESP32 community

---

**Mechasense** - _Digital twin predictive maintenance for motor electric_ 🔧⚡

