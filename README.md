# Mechasense - Predictive Maintenance for Electric Motor

**IoT-based Predictive Maintenance for AC Motors**

Mechasense is a monitoring and predictive maintenance platform for AC motors that integrates IoT sensors, Machine Learning predictions, and Expert System diagnosis.

---

## Features

- **Real-time Dashboard**: Monitor 5 sensors (MLX90614, PZEM-004T, DS18B20, GP2Y1010, MPU6050) in real-time via Firebase
- **ML Health Score & Bearing Prediction**: Machine Learning model for motor health scoring and bearing failure prediction
- **Expert System Diagnosis**: Rule-based diagnosis with certainty factor and fuzzy logic for motor problem analysis
- **Historical Analytics**: Trend visualization with configurable time ranges (1h, 6h, 24h, 7d)
- **Smart Alerts**: Automated alerts based on parameter thresholds
- **Modern UI**: Clean, responsive dashboard with industrial design

---

## Tech Stack

- **Frontend**: React 18 + Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Firebase Realtime Database
- **ML Service**: Python Flask (optional, for advanced ML predictions)

---

## Project Structure

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
│   │   └── ml/predict/     # ML prediction endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # Reusable UI components
│   ├── Navbar.tsx
│   ├── SensorStatusCard.tsx
│   ├── MotorOverviewCard.tsx
│   ├── TemperaturePanel.tsx
│   ├── VibrationPanel.tsx
│   ├── ElectricalPanel.tsx
│   ├── DustPanel.tsx
│   └── AlertList.tsx
├── hooks/
│   └── useRealtimeSensorData.ts  # Real-time Firebase data hook
├── lib/
│   ├── firebaseClient.ts   # Firebase configuration
│   ├── thresholds.ts       # Threshold logic & colors
│   ├── calculateHealthScore.ts  # Formula-based health calculation
│   ├── utils.ts            # Utility functions
│   └── expert-system/      # Expert system module
│       ├── symptoms.ts     # Motor symptom definitions
│       ├── rules.ts        # Diagnosis rules
│       ├── fuzzyMembership.ts  # Fuzzy logic mapping
│       └── diagnosisEngine.ts  # Diagnosis engine
├── ml_service/             # Python ML service
│   ├── app.py              # Flask API server
│   ├── models/             # Trained ML models
│   └── requirements.txt
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+ (optional, for ML service)
- Firebase project with Realtime Database

### Installation

1. **Clone repository**

```bash
git clone https://github.com/seipaa/mechasense.git
cd mechasense
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup Firebase**

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**

```bash
npm run dev
```

5. **Open browser**

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## AI Center Features

The AI Center (`/ai-center`) combines two diagnostic systems:

### 1. ML Bearing Failure Prediction

- **Health Score**: Formula-based calculation (0-100) considering:

  - Vibration RMS levels
  - Motor and bearing temperatures
  - Current and power factor
  - Voltage deviation
  - Dust density

- **ML Prediction** (requires Python service):
  - Classification: Will the bearing fail soon? (Yes/No)
  - Regression: Estimated time to failure (hours/minutes)

### 2. Expert System Motor Diagnosis

Interactive rule-based diagnosis system using:

- **10 Motor Symptoms**: Questions about motor conditions
- **Certainty Factor (CF)**: Confidence level for each diagnosis
- **Fuzzy Logic**: Three-level user input (No/Sometimes/Yes)
- **Damage Levels**: Minor (A), Moderate (B), Severe (C)

#### Expert System Symptoms:

| ID  | Symptom                           | CF Expert |
| --- | --------------------------------- | --------- |
| 1   | Motor does not rotate             | 1.0       |
| 2   | Humming sound is heard            | 0.6       |
| 3   | Motor rotation is slow            | 0.8       |
| 4   | Motor heats up quickly            | 0.7       |
| 5   | Burning smell from motor          | 1.0       |
| 6   | MCB or fuse trips frequently      | 0.9       |
| 7   | Excessive vibration               | 0.8       |
| 8   | Rough or abnormal sound           | 1.0       |
| 9   | Capacitor is swollen              | 0.9       |
| 10  | Motor weak despite normal voltage | 1.0       |

---

## ESP32 Integration

### Sending Data from ESP32

ESP32 sends sensor data via HTTP POST to Firebase or the `/api/ingest` endpoint.

**Example JSON payload:**

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
  "motorSurfaceTemp": 68.2,
  "bearingTemp": 65.5,
  "dustDensity": 35.0
}
```

---

## Color Palette

Mechasense uses the following color scheme:

- **Primary Dark Blue** (`#1B3C53`): Navbar, header, primary buttons
- **Secondary Blue** (`#234C6A`): Card header, accent
- **Muted Blue** (`#456882`): Card background, secondary buttons
- **Light Grey** (`#E3E3E3`): Page background, borders
- **Status Colors**:
  - Normal: `#10b981` (green)
  - Warning: `#f59e0b` (amber)
  - Critical: `#ef4444` (red)

---

## Threshold Configuration

The following thresholds determine sensor status:

| Parameter      | Normal       | Warning        | Critical       |
| -------------- | ------------ | -------------- | -------------- |
| Grid Voltage   | 198-242 V    | ±10% deviation | ±15% deviation |
| Motor Current  | < 4.6 A      | 4.6-5.5 A      | > 5.5 A        |
| Power Factor   | > 0.85       | 0.70-0.85      | < 0.70         |
| Grid Frequency | 49.5-50.5 Hz | ±1%            | ±2%            |
| Motor Temp     | < 70°C       | 70-85°C        | > 85°C         |
| Bearing Temp   | < 65°C       | 65-80°C        | > 80°C         |
| Dust Density   | < 50 µg/m³   | 50-100 µg/m³   | > 100 µg/m³    |
| Vibration RMS  | < 2.8 mm/s   | 2.8-4.5 mm/s   | > 4.5 mm/s     |

Thresholds can be adjusted in `lib/thresholds.ts`.

---

## ML Service (Optional)

To enable advanced ML predictions:

1. **Navigate to ML service directory**

```bash
cd ml_service
```

2. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

3. **Run the ML service**

```bash
python app.py
```

The ML service runs on `http://localhost:5001` by default.

---

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Sensors

1. Update Firebase data structure
2. Update threshold logic (`lib/thresholds.ts`)
3. Create/update UI components
4. Update health score calculation if needed

---

## Contributors

• Adzka Dzikri Imanullah (2301706)

• Andhika Pratama	(2301647)

• Andre Saputra	(2312601)

• Dewi Siti Jamilah	(2300707)

• Faiz Lintang Prawira	(2301910)

• Hafizh 'Abid Khalish	(2304423)

• Khairunnisa Labibah	(2307564)

• Muhammad Farid Febriansyah Prasetyo	(2306825)

• Primanda Suryawan Gani Zuher	(2301578)

• Rifki Destrizal Nugraha	(2304034)

• Sabtina Arinda Inayah	(2301906)

• Sunan Maulana Sulinda Dwika Darma	(2312131)

Student of Mechatronics and Artificial Intelligence at University of Education Indonesia.

---

## License

This project is for educational purposes.

---
 
**Mechasense** - Predictive Maintenance for Electric Motor 
