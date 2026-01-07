# MechaSense  
**Digital Twin & Predictive Maintenance Platform for Single-Phase AC Electric Motor**

MechaSense is an integrated **Digital Twin–based predictive maintenance system** designed for **single-phase AC electric motors**, combining **IoT sensing, real-time monitoring, Machine Learning prediction, and expert system diagnosis**.

The system monitors motor health continuously using multiple sensors, processes the data through an intelligent analytics pipeline, and provides actionable insights for early fault detection, condition-based maintenance, and operational optimization.

This platform is designed to operate in industrial and laboratory environments, where the motor is controlled by a **PLC Omron CP2E** acting as an actuator, while **MQTT and Node-RED** serve as the communication backbone between edge devices, analytics services, and the web-based dashboard.

<img width="1600" height="800" alt="image" src="https://github.com/Andre2404/Digital_Twin_Predictive_Maintenance_for_electric_motors/blob/main/public/3D%20visualization.PNG" />

<img width="1200" height="735" alt="image" src="https://github.com/Andre2404/Digital_Twin_Predictive_Maintenance_for_electric_motors/blob/main/public/Dashboard.PNG" />

---

## Demo Project

Video Demo :
https://youtu.be/BjRDWnmDT9M

Web Preview : https://mechasenses-tw2u.vercel.app/

## System Overview

In conventional maintenance strategies, electric motors are often serviced either **after failure** (corrective maintenance) or based on **fixed schedules** (preventive maintenance). Both approaches are inefficient and may lead to unnecessary downtime or unexpected breakdowns.

MechaSense addresses this problem by implementing:

- **Condition Monitoring**: Continuous real-time data acquisition from critical motor parameters  
- **Predictive Maintenance**: Early fault detection using Machine Learning and vibration analysis  
- **Digital Twin Concept**: A virtual representation of motor behavior synchronized with real sensor data  
- **Decision Support**: Expert system diagnosis and automated alerts  
- **Closed-Loop Control**: Actuator output via PLC based on diagnostic results  

---

## Sensor Configuration and Fault Detection Role

<img width="1000" height="900" alt="image" src="https://github.com/Andre2404/Digital_Twin_Predictive_Maintenance_for_electric_motors/blob/main/public/wiring.jpeg?raw=true" />

MechaSense utilizes **five complementary sensors**, each representing a different physical aspect of motor health. This multi-sensor approach enables robust fault detection and reduces false positives.

### 1. MPU6050 – Vibration and Mechanical Fault Detection
- Measures 3-axis acceleration (used primarily for vibration RMS, peak, crest factor)
- Detects:
  - Bearing wear and damage
  - Shaft misalignment
  - Mechanical imbalance
  - Looseness and abnormal resonance
- Vibration features are the **primary input for bearing fault prediction**

### 2. MLX90614 – Non-Contact Surface Temperature
- Measures motor surface temperature without physical contact
- Detects:
  - Overheating due to overload
  - Cooling system degradation
  - Friction-related faults
- Useful for monitoring **thermal stress trends**

### 3. DS18B20 – Bearing or Internal Temperature
- Measures direct-contact temperature
- Detects:
  - Bearing overheating
  - Lubrication failure
  - Early-stage bearing degradation
- Provides more stable readings compared to non-contact sensors

### 4. PZEM-004T – Electrical Parameter Monitoring
- Measures:
  - Voltage
  - Current
  - Power consumption
  - Power factor
  - Frequency
  - Energy usage
- Detects:
  - Overload conditions
  - Electrical imbalance
  - Capacitor degradation
  - Abnormal power factor trends

### 5. GP2Y1010 – Dust and Environmental Condition
- Measures dust particle density in the surrounding environment
- Detects:
  - Poor ventilation
  - High contamination environments
  - Increased risk of cooling inefficiency
- Used as a **contextual feature** in ML health scoring

---

## System Architecture

<img width="1000" height="900" alt="image" src="https://github.com/Andre2404/Digital_Twin_Predictive_Maintenance_for_electric_motors/blob/main/public/Alur.PNG" />

---

## Technology Stack

### Frontend
- **React 18**
- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Recharts** for time-series visualization
- **Three.js** for 3D motor visualization using `.glb` models

### Backend & Integration
- **Firebase Realtime Database** – real-time data synchronization
- **Node-RED** – MQTT orchestration, logic flow, and data transformation
- **MQTT** – lightweight communication protocol for IoT devices

### Machine Learning & Intelligence
- **Python Flask** (optional service)
- Feature-based ML models for:
  - Motor health scoring
  - Bearing failure classification
  - Remaining useful life estimation
- Rule-based **Expert System** with:
  - Certainty Factor
  - Fuzzy Logic inference

### Control System
- **PLC Omron CP2E**
- Receives control signals for:
  - Motor shutdown
  - Warning indicators
  - Safety interlock logic

---

## Key Features

- **Real-Time Dashboard**
  - Live monitoring of all five sensors
  - Status indicators (Normal, Warning, Critical)

- **Predictive Maintenance**
  - Vibration-based bearing fault detection
  - Health score computation (0–100)

- **Expert System Diagnosis**
  - Rule-based reasoning
  - Certainty Factor and fuzzy membership
  - Multi-level fault severity classification

- **Historical Analytics**
  - Trend analysis (1h, 6h, 24h, 7d)
  - Long-term degradation tracking

- **Smart Alerts**
  - Automated threshold-based alerts
  - Integration with PLC for actuator response

- **Digital Twin Visualization**
  - Interactive 3D motor model
  - Visual mapping of fault locations

---

## Project Structure

```

mechasense/
├── app/
│   ├── dashboard/
│   ├── analytics/
│   ├── ai-center/
│   ├── settings/
│   ├── api/
│   │   ├── ingest/
│   │   ├── latest/
│   │   └── ml/predict/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── hooks/
├── lib/
│   ├── firebaseClient.ts
│   ├── thresholds.ts
│   ├── calculateHealthScore.ts
│   └── expert-system/
├── ml_service/
│   ├── app.py
│   ├── models/
│   └── requirements.txt
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md

````

---

## ESP32 Data Payload Example

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
````

---

## Threshold Configuration

Thresholds are configurable in `lib/thresholds.ts` and follow industrial standards for single-phase AC motors.

| Parameter     | Normal     | Warning      | Critical   |
| ------------- | ---------- | ------------ | ---------- |
| Vibration RMS | < 2.8 mm/s | 2.8–4.5 mm/s | > 4.5 mm/s |
| Motor Temp    | < 70°C     | 70–85°C      | > 85°C     |
| Bearing Temp  | < 65°C     | 65–80°C      | > 80°C     |
| Power Factor  | > 0.85     | 0.70–0.85    | < 0.70     |

---

## Installation & Setup

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

## Academic Context

This project is developed as part of research and applied engineering work in the **Mechatronics and Artificial Intelligence** domain, focusing on **Industry 4.0**, **predictive maintenance**, and **cyber-physical systems**.

**Department of Mechatronics and Artificial Intelligence**
University of Education Indonesia


```


